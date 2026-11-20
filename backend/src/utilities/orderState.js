const ApiError = require('./ApiError');

const SELLER_TRANSITIONS = {
  pending: ['confirmed', 'cancelled', 'failed'],
  confirmed: ['preparing', 'cancelled', 'failed'],
  preparing: ['ready', 'cancelled', 'failed'],
  ready: ['out_for_delivery', 'cancelled', 'failed'],
  out_for_delivery: ['failed'],
  delivered: [],
  cancelled: [],
  failed: [],
};

const DELIVERY_TRANSITIONS = {
  awaiting_assignment: ['assigned', 'accepted', 'cancelled'],
  assigned: ['accepted', 'cancelled', 'failed'],
  accepted: ['picked_up', 'cancelled', 'failed'],
  picked_up: ['in_transit', 'failed'],
  in_transit: ['delivered', 'failed'],
  delivered: [],
  failed: [],
  cancelled: [],
};

function calculateParentOrderStatus(statuses) {
  if (!statuses.length) return null;
  if (statuses.every((status) => status === 'cancelled')) return 'cancelled';
  if (statuses.every((status) => status === 'failed')) return 'failed';
  const terminal = statuses.every((status) => ['delivered', 'cancelled', 'failed'].includes(status));
  if (terminal && statuses.every((status) => status === 'delivered')) return 'completed';
  if (statuses.some((status) => status === 'cancelled')) return 'partially_cancelled';
  if (terminal) return 'completed';
  if (statuses.some((status) => ['out_for_delivery', 'ready', 'preparing'].includes(status))) return 'processing';
  if (statuses.some((status) => status === 'confirmed')) return 'confirmed';
  return 'pending';
}

async function refreshParentOrderStatus(client, orderId, changedBy = null, note = null) {
  const { rows } = await client.query(
    'SELECT seller_order_status FROM seller_orders WHERE order_id=$1 ORDER BY id FOR UPDATE',
    [orderId],
  );
  if (!rows.length) return null;

  const statuses = rows.map((row) => row.seller_order_status);
  const next = calculateParentOrderStatus(statuses);

  const current = await client.query('SELECT order_status FROM orders WHERE id=$1 FOR UPDATE', [orderId]);
  if (!current.rows[0]) throw new ApiError(404, 'Order not found.');
  const old = current.rows[0].order_status;
  if (old !== next) {
    await client.query('UPDATE orders SET order_status=$1, updated_at=NOW() WHERE id=$2', [next, orderId]);
    await client.query(
      `INSERT INTO order_status_history(order_id,changed_by,old_status,new_status,note)
       VALUES($1,$2,$3,$4,$5)`,
      [orderId, changedBy, old, next, note || 'Automatically synchronized from seller orders'],
    );
  }
  return next;
}

async function restoreSellerOrderStock(client, sellerOrderId) {
  const { rows } = await client.query(
    'SELECT product_id, quantity FROM order_items WHERE seller_order_id=$1 AND product_id IS NOT NULL FOR UPDATE',
    [sellerOrderId],
  );
  for (const item of rows) {
    await client.query(
      'UPDATE products SET stock_quantity=stock_quantity+$1, updated_at=NOW() WHERE id=$2',
      [item.quantity, item.product_id],
    );
  }
}

module.exports = {
  SELLER_TRANSITIONS,
  calculateParentOrderStatus,
  DELIVERY_TRANSITIONS,
  refreshParentOrderStatus,
  restoreSellerOrderStock,
};
