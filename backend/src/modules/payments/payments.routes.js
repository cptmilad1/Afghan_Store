const router=require('express').Router();
const auth=require('../../middleware/auth.middleware');
const {requireRoles}=require('../../middleware/role.middleware');
const {query,withTransaction}=require('../../config/db.config');
const {id,send,asyncHandler,ApiError}=require('../../utilities/domain');
router.use(auth);

router.get('/orders/:orderId',asyncHandler(async(req,res)=>{
  const oid=id(req.params.orderId);
  const access=await query('SELECT id FROM orders WHERE id=$1 AND (customer_id=$2 OR $3=\'admin\')',[oid,req.user.id,req.user.role_name]);
  if(!access.rows[0])throw new ApiError(404,'Order not found.');
  const {rows}=await query('SELECT id,order_id,payment_method,transaction_reference,amount,currency,transaction_status,paid_at,created_at FROM payment_transactions WHERE order_id=$1 ORDER BY created_at DESC',[oid]);
  send(res,rows);
}));

router.post('/orders/:orderId/transactions',requireRoles('customer'),asyncHandler(async(req,res)=>{
  const oid=id(req.params.orderId);
  const method=req.body.payment_method;
  if(!['cash_on_delivery','bank_transfer','online','other'].includes(method))throw new ApiError(400,'Invalid payment_method.');
  const created=await withTransaction(async c=>{
    const {rows:o}=await c.query('SELECT id,total_amount,currency,order_status,payment_status FROM orders WHERE id=$1 AND customer_id=$2 FOR UPDATE',[oid,req.user.id]);
    if(!o[0])throw new ApiError(404,'Order not found.');
    if(['cancelled','partially_cancelled','failed'].includes(o[0].order_status))throw new ApiError(409,'A cancelled order cannot receive a new payment.');
    if(o[0].payment_status==='paid'||o[0].payment_status==='refunded')throw new ApiError(409,'This order is already paid or refunded.');
    const existing=await c.query("SELECT id,transaction_status FROM payment_transactions WHERE order_id=$1 AND transaction_status IN ('pending','successful') FOR UPDATE",[oid]);
    if(existing.rows.some(x=>x.transaction_status==='successful'))throw new ApiError(409,'A successful payment already exists for this order.');
    if(existing.rows.some(x=>x.transaction_status==='pending'))throw new ApiError(409,'A payment is already pending for this order.');
    const {rows}=await c.query(`INSERT INTO payment_transactions(order_id,payment_method,amount,currency,transaction_status)
      VALUES($1,$2,$3,$4,'pending') RETURNING id,order_id,payment_method,amount,currency,transaction_status,created_at`,
      [oid,method,o[0].total_amount,o[0].currency]);
    await c.query("UPDATE orders SET payment_status='pending',updated_at=NOW() WHERE id=$1",[oid]);
    return rows[0];
  });
  send(res,created,'Payment transaction created as pending.',201);
}));

router.patch('/:id/status',requireRoles('admin'),asyncHandler(async(req,res)=>{
  const transactionId=id(req.params.id);
  const requested=req.body.transaction_status;
  if(!['successful','failed','refunded'].includes(requested))throw new ApiError(400,'Invalid transaction_status.');
  const updated=await withTransaction(async c=>{
    const found=await c.query('SELECT * FROM payment_transactions WHERE id=$1',[transactionId]);
    if(!found.rows[0])throw new ApiError(404,'Payment transaction not found.');
    const orderId=found.rows[0].order_id;
    // Keep lock order consistent: parent order first, then payment transaction.
    const orderResult=await c.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[orderId]);
    if(!orderResult.rows[0])throw new ApiError(404,'Order not found.');
    const locked=await c.query('SELECT * FROM payment_transactions WHERE id=$1 FOR UPDATE',[transactionId]);
    const tx=locked.rows[0];
    if(tx.transaction_status===requested)return tx;
    const allowed={pending:['successful','failed'],successful:['refunded'],failed:[],refunded:[]};
    if(!(allowed[tx.transaction_status]||[]).includes(requested))
      throw new ApiError(409,`Cannot change payment from ${tx.transaction_status} to ${requested}.`);
    if(requested==='successful'){
      if(['cancelled','partially_cancelled','failed'].includes(orderResult.rows[0].order_status))
        throw new ApiError(409,'Payment cannot be marked successful for a cancelled order.');
      const other=await c.query("SELECT id FROM payment_transactions WHERE order_id=$1 AND id<>$2 AND transaction_status='successful'",[orderId,transactionId]);
      if(other.rows.length)throw new ApiError(409,'Another successful payment already exists for this order.');
    }
    const result=await c.query(`UPDATE payment_transactions SET transaction_status=$1,
      paid_at=CASE WHEN $1='successful' THEN COALESCE(paid_at,NOW()) ELSE paid_at END
      WHERE id=$2 RETURNING *`,[requested,transactionId]);

    let paymentStatus;
    if(requested==='successful')paymentStatus='paid';
    else if(requested==='refunded')paymentStatus='refunded';
    else {
      const otherPending=await c.query("SELECT id FROM payment_transactions WHERE order_id=$1 AND id<>$2 AND transaction_status='pending'",[orderId,transactionId]);
      const otherSuccessful=await c.query("SELECT id FROM payment_transactions WHERE order_id=$1 AND id<>$2 AND transaction_status='successful'",[orderId,transactionId]);
      paymentStatus=otherSuccessful.rows.length?'paid':otherPending.rows.length?'pending':'failed';
    }
    await c.query('UPDATE orders SET payment_status=$1,updated_at=NOW() WHERE id=$2',[paymentStatus,orderId]);
    return result.rows[0];
  });
  send(res,updated);
}));
module.exports=router;
