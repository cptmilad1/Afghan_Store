const router=require('express').Router();const auth=require('../../middleware/auth.middleware');const {requireRoles}=require('../../middleware/role.middleware');const {query,withTransaction}=require('../../config/db.config');const {id,send,asyncHandler,ApiError}=require('../../utilities/domain');const crypto=require('crypto');const {SELLER_TRANSITIONS,refreshParentOrderStatus,restoreSellerOrderStock}=require('../../utilities/orderState');
router.post('/checkout',auth,requireRoles('customer'),asyncHandler(async(req,res)=>{const addressId=id(req.body.address_id,'address_id');const method=req.body.payment_method||'cash_on_delivery';if(!['cash_on_delivery','bank_transfer','online','other'].includes(method))throw new ApiError(400,'Unsupported payment_method.');const result=await withTransaction(async c=>{const a=await c.query('SELECT * FROM user_addresses WHERE id=$1 AND user_id=$2',[addressId,req.user.id]);if(!a.rows[0])throw new ApiError(400,'Delivery address does not belong to this customer.');const cart=await c.query("SELECT * FROM carts WHERE customer_id=$1 AND cart_status='active' FOR UPDATE",[req.user.id]);if(!cart.rows[0])throw new ApiError(400,'Active cart is empty.');await c.query('SELECT id FROM cart_items WHERE cart_id=$1 FOR UPDATE',[cart.rows[0].id]);const items=await c.query(`SELECT ci.quantity,ci.product_id,ci.service_id,CASE WHEN ci.product_id IS NOT NULL THEN 'product' ELSE 'service' END item_type,COALESCE(p.name,s.name) name,COALESCE(p.description,s.description) description,COALESCE(p.price,s.price) price,COALESCE(p.stock_quantity,0) stock_quantity,COALESCE(p.seller_id,s.seller_id) seller_id,COALESCE(p.listing_status,s.listing_status) listing_status FROM cart_items ci LEFT JOIN products p ON p.id=ci.product_id LEFT JOIN services s ON s.id=ci.service_id WHERE ci.cart_id=$1`,[cart.rows[0].id]);if(!items.rows.length)throw new ApiError(400,'Active cart is empty.');for(const x of items.rows){if(x.listing_status!=='active')throw new ApiError(409,`${x.name} is no longer available.`);if(x.item_type==='product'&&x.quantity>x.stock_quantity)throw new ApiError(409,`Insufficient stock for ${x.name}.`);}const toCents=x=>BigInt(Math.round(Number(x)*100));const subtotalCents=items.rows.reduce((n,x)=>n+toCents(x.price)*BigInt(x.quantity),0n);const subtotal=(Number(subtotalCents)/100).toFixed(2);let coupon=null,discountCents=0n;if(req.body.coupon_code){const cr=await c.query(`SELECT * FROM coupons WHERE UPPER(code)=UPPER($1) AND is_active=TRUE AND starts_at<=NOW() AND expires_at>NOW() FOR UPDATE`,[String(req.body.coupon_code).trim()]);coupon=cr.rows[0];if(!coupon)throw new ApiError(400,'Coupon is invalid or expired.');const usage=await c.query('SELECT COUNT(*)::int n FROM coupon_usages WHERE coupon_id=$1',[coupon.id]);if(coupon.usage_limit&&usage.rows[0].n>=coupon.usage_limit)throw new ApiError(409,'Coupon usage limit reached.');const customerUsage=await c.query('SELECT COUNT(*)::int n FROM coupon_usages WHERE coupon_id=$1 AND customer_id=$2',[coupon.id,req.user.id]);if(customerUsage.rows[0].n>=coupon.per_customer_limit)throw new ApiError(409,'You have already used this coupon the maximum number of times.');const eligible=items.rows.filter(x=>!coupon.seller_id||String(x.seller_id)===String(coupon.seller_id));const eligibleCents=eligible.reduce((n,x)=>n+toCents(x.price)*BigInt(x.quantity),0n);if(eligibleCents<BigInt(Math.round(Number(coupon.minimum_order_amount)*100)))throw new ApiError(400,'Order does not meet the coupon minimum amount.');discountCents=coupon.discount_type==='percentage'?(eligibleCents*BigInt(Math.round(Number(coupon.discount_value)*100))/10000n):toCents(coupon.discount_value);if(coupon.maximum_discount_amount)discountCents=discountCents<toCents(coupon.maximum_discount_amount)?discountCents:toCents(coupon.maximum_discount_amount);if(discountCents>eligibleCents)discountCents=eligibleCents;}const discount=(Number(discountCents)/100).toFixed(2);const total=(Number(subtotalCents-discountCents)/100).toFixed(2);const deliveryFee='0.00';const orderNo=`AC-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;const {rows:or}=await c.query(`INSERT INTO orders(order_number,customer_id,address_id,coupon_id,recipient_name_snapshot,recipient_phone_snapshot,delivery_address_snapshot,subtotal,discount_amount,delivery_fee,total_amount,order_status,payment_status,customer_note) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending','pending',$12) RETURNING *`,[orderNo,req.user.id,addressId,coupon?coupon.id:null,a.rows[0].recipient_name,a.rows[0].recipient_phone,[a.rows[0].province,a.rows[0].city,a.rows[0].district,a.rows[0].street_address,a.rows[0].additional_directions].filter(Boolean).join(', '),subtotal,discount,deliveryFee,total,req.body.customer_note||null]);const order=or[0];if(coupon)await c.query('INSERT INTO coupon_usages(coupon_id,customer_id,order_id,discount_amount) VALUES($1,$2,$3,$4)',[coupon.id,req.user.id,order.id,discount]);const grouped=new Map();for(const x of items.rows){if(!grouped.has(String(x.seller_id)))grouped.set(String(x.seller_id),[]);grouped.get(String(x.seller_id)).push(x);}const sellerOrders=[];for(const [sellerId,lines] of grouped){const subCents=lines.reduce((n,x)=>n+toCents(x.price)*BigInt(x.quantity),0n);const sub=(Number(subCents)/100).toFixed(2);const subNo=`${orderNo}-S${sellerId}`;const so=await c.query(`INSERT INTO seller_orders(order_id,seller_id,seller_order_number,subtotal,delivery_fee) VALUES($1,$2,$3,$4,0) RETURNING *`,[order.id,sellerId,subNo,sub]);const sellerOrder=so.rows[0];await c.query(`INSERT INTO notifications(user_id,notification_type,title,body,related_entity_type,related_entity_id) SELECT user_id,'new_order','New seller order',$2,'seller_order',$3 FROM seller_profiles WHERE id=$1`,[sellerId,`A new order ${sellerOrder.seller_order_number} has been received.`,sellerOrder.id]);for(const x of lines){const line=(Number(toCents(x.price)*BigInt(x.quantity))/100).toFixed(2);await c.query(`INSERT INTO order_items(seller_order_id,product_id,service_id,item_type,item_name_snapshot,item_description_snapshot,unit_price,quantity,line_total,service_requested_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[sellerOrder.id,x.product_id,x.service_id,x.item_type,x.name,x.description,x.price,x.quantity,line,x.service_id&&req.body.service_requested_at_by_id?req.body.service_requested_at_by_id[String(x.service_id)]||null:null]);if(x.item_type==='product'){const upd=await c.query('UPDATE products SET stock_quantity=stock_quantity-$1 WHERE id=$2 AND stock_quantity >= $1',[x.quantity,x.product_id]);if(!upd.rowCount)throw new ApiError(409,`Stock changed during checkout for ${x.name}.`);}}await c.query('INSERT INTO deliveries(seller_order_id,delivery_fee) VALUES($1,0)',[sellerOrder.id]);sellerOrders.push(sellerOrder);}await c.query('INSERT INTO payment_transactions(order_id,payment_method,amount,currency,transaction_status) VALUES($1,$2,$3,$4,$5)',[order.id,method,order.total_amount,order.currency,'pending']);await c.query("INSERT INTO order_status_history(order_id,changed_by,new_status,note) VALUES($1,$2,'pending','Order placed')",[order.id,req.user.id]);await c.query(`INSERT INTO notifications(user_id,notification_type,title,body,related_entity_type,related_entity_id) VALUES($1,'order','Order placed',$2,'order',$3)`,[req.user.id,`Your order ${order.order_number} has been placed.`,order.id]);await c.query("UPDATE carts SET cart_status='converted' WHERE id=$1",[cart.rows[0].id]);await c.query('INSERT INTO carts(customer_id) VALUES($1)',[req.user.id]);return {order,seller_orders:sellerOrders};});send(res,result,'Order placed successfully.',201);}));
router.get('/mine',auth,asyncHandler(async(req,res)=>{let sql='SELECT o.* FROM orders o WHERE o.customer_id=$1 ORDER BY o.placed_at DESC';let vals=[req.user.id];if(req.user.role_name==='admin'){sql='SELECT o.* FROM orders o ORDER BY o.placed_at DESC';vals=[];}const {rows}=await query(sql,vals);send(res,rows);}));
router.get('/admin/all',auth,requireRoles('admin'),asyncHandler(async(req,res)=>{const {rows}=await query(`SELECT o.*,u.full_name customer_name,u.phone customer_phone FROM orders o JOIN users u ON u.id=o.customer_id ORDER BY o.placed_at DESC LIMIT 200`);send(res,rows);}));
router.get('/seller/mine',auth,requireRoles('seller','admin'),asyncHandler(async(req,res)=>{let sql=`SELECT so.*,o.order_number,o.order_status,o.payment_status,o.placed_at,u.full_name customer_name,u.phone customer_phone FROM seller_orders so JOIN orders o ON o.id=so.order_id JOIN users u ON u.id=o.customer_id`;let vals=[];if(req.user.role_name==='seller'){const sp=await query("SELECT id FROM seller_profiles WHERE user_id=$1 AND approval_status='approved'",[req.user.id]);if(!sp.rows[0])throw new ApiError(403,'Approved seller profile required.');vals=[sp.rows[0].id];sql+=' WHERE so.seller_id=$1';}sql+=' ORDER BY so.created_at DESC';const {rows}=await query(sql,vals);send(res,rows);}));
router.get('/:id',auth,asyncHandler(async(req,res)=>{const oid=id(req.params.id);const vals=[oid];let where='o.id=$1';if(req.user.role_name!=='admin'){vals.push(req.user.id);where+=' AND (o.customer_id=$2 OR EXISTS(SELECT 1 FROM seller_orders so JOIN seller_profiles sp ON sp.id=so.seller_id WHERE so.order_id=o.id AND sp.user_id=$2))';}const {rows}=await query(`SELECT o.* FROM orders o WHERE ${where}`,vals);if(!rows[0])throw new ApiError(404,'Order not found.');const subs=await query('SELECT so.*,sp.store_name FROM seller_orders so JOIN seller_profiles sp ON sp.id=so.seller_id WHERE so.order_id=$1',[oid]);const lines=await query(`SELECT oi.* FROM order_items oi JOIN seller_orders so ON so.id=oi.seller_order_id WHERE so.order_id=$1 ORDER BY oi.id`,[oid]);send(res,{...rows[0],seller_orders:subs.rows,items:lines.rows});}));
router.get('/:id/history',auth,asyncHandler(async(req,res)=>{const oid=id(req.params.id);const own=await query(`SELECT id FROM orders o WHERE id=$1 AND (customer_id=$2 OR $3='admin' OR EXISTS(SELECT 1 FROM seller_orders so JOIN seller_profiles sp ON sp.id=so.seller_id WHERE so.order_id=o.id AND sp.user_id=$2))`,[oid,req.user.id,req.user.role_name]);if(!own.rows[0])throw new ApiError(404,'Order not found.');const {rows}=await query('SELECT * FROM order_status_history WHERE order_id=$1 ORDER BY changed_at',[oid]);send(res,rows);}));
router.patch('/seller-orders/:id/status',auth,requireRoles('seller','admin'),asyncHandler(async(req,res)=>{
  const sid=id(req.params.id);
  const status=req.body.seller_order_status;
  if(!Object.hasOwn(SELLER_TRANSITIONS,status))throw new ApiError(400,'Invalid seller_order_status.');
  const updated=await withTransaction(async c=>{
    let sql='SELECT * FROM seller_orders WHERE id=$1',params=[sid];
    if(req.user.role_name==='seller'){
      const sp=await c.query("SELECT id FROM seller_profiles WHERE user_id=$1 AND approval_status='approved'",[req.user.id]);
      if(!sp.rows[0])throw new ApiError(403,'Approved seller profile required.');
      sql='SELECT * FROM seller_orders WHERE id=$1 AND seller_id=$2';params=[sid,sp.rows[0].id];
    }
    const peek=await c.query(sql,params);
    if(!peek.rows[0])throw new ApiError(404,'Seller order not found.');
    // All order workflows lock the parent before a seller sub-order to avoid deadlocks.
    await c.query('SELECT id FROM orders WHERE id=$1 FOR UPDATE',[peek.rows[0].order_id]);
    sql=sql+' FOR UPDATE';
    const current=await c.query(sql,params);
    if(!current.rows[0])throw new ApiError(404,'Seller order not found.');
    const sellerOrder=current.rows[0];
    const old=sellerOrder.seller_order_status;
    if(old===status)return sellerOrder;
    if(!(SELLER_TRANSITIONS[old]||[]).includes(status))throw new ApiError(409,`Cannot change seller order from ${old} to ${status}.`);
    if(status==='cancelled'){
      const delivery=await c.query('SELECT * FROM deliveries WHERE seller_order_id=$1 FOR UPDATE',[sid]);
      if(delivery.rows[0]&&['picked_up','in_transit','delivered'].includes(delivery.rows[0].delivery_status))
        throw new ApiError(409,'This order cannot be cancelled after the courier has picked it up.');
      await restoreSellerOrderStock(c,sid);
      if(delivery.rows[0]){
        await c.query("UPDATE deliveries SET delivery_status='cancelled',updated_at=NOW() WHERE id=$1",[delivery.rows[0].id]);
        if(delivery.rows[0].courier_id){
          await c.query(`UPDATE courier_profiles cp SET availability_status=CASE WHEN EXISTS(
            SELECT 1 FROM deliveries d WHERE d.courier_id=cp.id AND d.id<>$2
            AND d.delivery_status IN ('assigned','accepted','picked_up','in_transit')
          ) THEN 'busy' ELSE 'available' END WHERE cp.id=$1`,[delivery.rows[0].courier_id,delivery.rows[0].id]);
        }
      }
    }
    const result=await c.query('UPDATE seller_orders SET seller_order_status=$1,updated_at=NOW() WHERE id=$2 RETURNING *',[status,sid]);
    await c.query('INSERT INTO order_status_history(order_id,seller_order_id,changed_by,old_status,new_status,note) VALUES($1,$2,$3,$4,$5,$6)',[sellerOrder.order_id,sid,req.user.id,old,status,req.body.note||null]);
    await refreshParentOrderStatus(c,sellerOrder.order_id,req.user.id,`Seller order changed from ${old} to ${status}`);
    await c.query(`INSERT INTO notifications(user_id,notification_type,title,body,related_entity_type,related_entity_id) SELECT customer_id,'order_update','Order status updated',$2,'order',$1 FROM orders WHERE id=$1`,[sellerOrder.order_id,`Your seller order status is now ${status}.`]);
    return result.rows[0];
  });
  send(res,updated);
}));

router.patch('/:id/cancel',auth,asyncHandler(async(req,res)=>{
  const oid=id(req.params.id);
  const result=await withTransaction(async c=>{
    const orderResult=await c.query('SELECT * FROM orders WHERE id=$1 AND customer_id=$2 FOR UPDATE',[oid,req.user.id]);
    if(!orderResult.rows[0])throw new ApiError(404,'Order not found.');
    const order=orderResult.rows[0];
    const subs=await c.query('SELECT * FROM seller_orders WHERE order_id=$1 ORDER BY id FOR UPDATE',[oid]);
    if(!subs.rows.length)throw new ApiError(409,'Order has no seller orders.');
    if(subs.rows.some(x=>x.seller_order_status!=='pending'))
      throw new ApiError(409,'Order can only be cancelled by the customer while every seller order is pending.');

    for(const sub of subs.rows){
      const delivery=await c.query('SELECT * FROM deliveries WHERE seller_order_id=$1 FOR UPDATE',[sub.id]);
      if(delivery.rows[0]&&['picked_up','in_transit','delivered'].includes(delivery.rows[0].delivery_status))
        throw new ApiError(409,'Order cannot be cancelled after delivery has started.');
      await restoreSellerOrderStock(c,sub.id);
      await c.query("UPDATE seller_orders SET seller_order_status='cancelled',updated_at=NOW() WHERE id=$1",[sub.id]);
      if(delivery.rows[0]){
        await c.query("UPDATE deliveries SET delivery_status='cancelled',updated_at=NOW() WHERE id=$1",[delivery.rows[0].id]);
        if(delivery.rows[0].courier_id){
          await c.query(`UPDATE courier_profiles cp SET availability_status=CASE WHEN EXISTS(
            SELECT 1 FROM deliveries d WHERE d.courier_id=cp.id AND d.id<>$2
            AND d.delivery_status IN ('assigned','accepted','picked_up','in_transit')
          ) THEN 'busy' ELSE 'available' END WHERE cp.id=$1`,[delivery.rows[0].courier_id,delivery.rows[0].id]);
        }
      }
    }
    await c.query("UPDATE orders SET order_status='cancelled',payment_status=CASE WHEN payment_status='pending' THEN 'failed' ELSE payment_status END,updated_at=NOW() WHERE id=$1",[oid]);
    await c.query("UPDATE payment_transactions SET transaction_status='failed' WHERE order_id=$1 AND transaction_status='pending'",[oid]);
    await c.query('DELETE FROM coupon_usages WHERE order_id=$1',[oid]);
    await c.query('INSERT INTO order_status_history(order_id,changed_by,old_status,new_status,note) VALUES($1,$2,$3,\'cancelled\',$4)',[oid,req.user.id,order.order_status,req.body.note||'Cancelled by customer']);
    return {...order,order_status:'cancelled',payment_status:order.payment_status==='pending'?'failed':order.payment_status};
  });
  send(res,result,'Order cancelled.');
}));
module.exports=router;
