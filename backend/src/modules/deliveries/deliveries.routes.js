const router=require('express').Router();
const auth=require('../../middleware/auth.middleware');
const {requireRoles}=require('../../middleware/role.middleware');
const {query,withTransaction}=require('../../config/db.config');
const {id,send,asyncHandler,ApiError,getCourierProfile}=require('../../utilities/domain');
const {DELIVERY_TRANSITIONS,refreshParentOrderStatus}=require('../../utilities/orderState');
router.use(auth);

router.get('/available',requireRoles('courier'),asyncHandler(async(req,res)=>{
  const cp=await getCourierProfile(req.user.id);
  if(cp.availability_status!=='available')throw new ApiError(403,'Set courier availability to available before viewing new deliveries.');
  const {rows}=await query(`SELECT d.id,d.seller_order_id,d.delivery_fee,d.delivery_status,so.seller_order_number,o.order_number,o.delivery_address_snapshot,o.recipient_name_snapshot,o.recipient_phone_snapshot
    FROM deliveries d JOIN seller_orders so ON so.id=d.seller_order_id JOIN orders o ON o.id=so.order_id
    WHERE d.delivery_status='awaiting_assignment' AND so.seller_order_status IN ('ready','out_for_delivery') AND o.order_status NOT IN ('cancelled','partially_cancelled','failed') ORDER BY d.created_at`,[]);
  send(res,rows);
}));

router.patch('/:id/claim',requireRoles('courier'),asyncHandler(async(req,res)=>{
  const deliveryId=id(req.params.id);
  const claimed=await withTransaction(async c=>{
    const peek=await c.query('SELECT so.order_id FROM deliveries d JOIN seller_orders so ON so.id=d.seller_order_id WHERE d.id=$1',[deliveryId]);
    if(!peek.rows[0])throw new ApiError(404,'Delivery not found.');
    await c.query('SELECT id FROM orders WHERE id=$1 FOR UPDATE',[peek.rows[0].order_id]);
    await c.query('SELECT id FROM seller_orders WHERE id=(SELECT seller_order_id FROM deliveries WHERE id=$1) FOR UPDATE',[deliveryId]);
    const delivery=await c.query('SELECT * FROM deliveries WHERE id=$1 FOR UPDATE',[deliveryId]);
    if(!delivery.rows[0]||delivery.rows[0].delivery_status!=='awaiting_assignment'||delivery.rows[0].courier_id)
      throw new ApiError(409,'Delivery is no longer available.');
    const sellerReady=await c.query("SELECT seller_order_status FROM seller_orders WHERE id=$1",[delivery.rows[0].seller_order_id]);
    if(!['ready','out_for_delivery'].includes(sellerReady.rows[0]?.seller_order_status))throw new ApiError(409,'Seller must mark the order ready before courier assignment.');
    const cpResult=await c.query('SELECT * FROM courier_profiles WHERE user_id=$1 FOR UPDATE',[req.user.id]);
    const cp=cpResult.rows[0];
    if(!cp)throw new ApiError(404,'Courier profile not found.');
    if(cp.availability_status!=='available')throw new ApiError(403,'Courier must be available to claim a delivery.');
    const result=await c.query("UPDATE deliveries SET courier_id=$1,delivery_status='accepted',assigned_at=NOW(),updated_at=NOW() WHERE id=$2 RETURNING *",[cp.id,deliveryId]);
    await c.query("UPDATE courier_profiles SET availability_status='busy',updated_at=NOW() WHERE id=$1",[cp.id]);
    return result.rows[0];
  });
  send(res,claimed,'Delivery claimed.');
}));

router.get('/mine',asyncHandler(async(req,res)=>{
  let sql,vals;
  if(req.user.role_name==='courier'){
    const cp=await getCourierProfile(req.user.id);
    sql=`SELECT d.*,so.seller_order_number,o.order_number,o.delivery_address_snapshot FROM deliveries d JOIN seller_orders so ON so.id=d.seller_order_id JOIN orders o ON o.id=so.order_id WHERE d.courier_id=$1 ORDER BY d.created_at DESC`;vals=[cp.id];
  }else if(req.user.role_name==='seller'){
    const sp=await query('SELECT id FROM seller_profiles WHERE user_id=$1',[req.user.id]);
    if(!sp.rows[0])throw new ApiError(403,'Seller profile required.');
    sql=`SELECT d.*,so.seller_order_number,o.order_number,o.delivery_address_snapshot FROM deliveries d JOIN seller_orders so ON so.id=d.seller_order_id JOIN orders o ON o.id=so.order_id WHERE so.seller_id=$1 ORDER BY d.created_at DESC`;vals=[sp.rows[0].id];
  }else if(req.user.role_name==='admin'){
    sql=`SELECT d.*,so.seller_order_number,o.order_number,o.delivery_address_snapshot FROM deliveries d JOIN seller_orders so ON so.id=d.seller_order_id JOIN orders o ON o.id=so.order_id ORDER BY d.created_at DESC`;vals=[];
  }else throw new ApiError(403,'Not allowed.');
  const {rows}=await query(sql,vals);send(res,rows);
}));

router.patch('/:id/assign',requireRoles('admin'),asyncHandler(async(req,res)=>{
  const deliveryId=id(req.params.id);const courierId=id(req.body.courier_id,'courier_id');
  const assigned=await withTransaction(async c=>{
    const peek=await c.query('SELECT so.order_id FROM deliveries d JOIN seller_orders so ON so.id=d.seller_order_id WHERE d.id=$1',[deliveryId]);
    if(!peek.rows[0])throw new ApiError(404,'Delivery not found.');
    await c.query('SELECT id FROM orders WHERE id=$1 FOR UPDATE',[peek.rows[0].order_id]);
    await c.query('SELECT id FROM seller_orders WHERE id=(SELECT seller_order_id FROM deliveries WHERE id=$1) FOR UPDATE',[deliveryId]);
    const delivery=await c.query('SELECT * FROM deliveries WHERE id=$1 FOR UPDATE',[deliveryId]);
    if(!delivery.rows[0])throw new ApiError(404,'Delivery not found.');
    if(delivery.rows[0].delivery_status!=='awaiting_assignment'||delivery.rows[0].courier_id)
      throw new ApiError(409,'Delivery has already been assigned or is no longer available.');
    const sellerReady=await c.query('SELECT seller_order_status FROM seller_orders WHERE id=$1',[delivery.rows[0].seller_order_id]);
    if(!['ready','out_for_delivery'].includes(sellerReady.rows[0]?.seller_order_status))throw new ApiError(409,'Seller must mark the order ready before courier assignment.');
    const courier=await c.query('SELECT * FROM courier_profiles WHERE id=$1 FOR UPDATE',[courierId]);
    if(!courier.rows[0]||courier.rows[0].availability_status!=='available')
      throw new ApiError(409,'Courier must be available and have no active delivery.');
    const result=await c.query("UPDATE deliveries SET courier_id=$1,delivery_status='assigned',assigned_at=NOW(),updated_at=NOW() WHERE id=$2 RETURNING *",[courierId,deliveryId]);
    await c.query("UPDATE courier_profiles SET availability_status='busy',updated_at=NOW() WHERE id=$1",[courierId]);
    return result.rows[0];
  });
  send(res,assigned,'Delivery assigned.');
}));

router.patch('/:id/status',requireRoles('courier','admin'),asyncHandler(async(req,res)=>{
  const deliveryId=id(req.params.id);const status=req.body.delivery_status;
  if(!Object.hasOwn(DELIVERY_TRANSITIONS,status))throw new ApiError(400,'Invalid delivery_status.');
  const result=await withTransaction(async c=>{
    const peek=await c.query('SELECT d.courier_id,so.order_id,so.id seller_order_id FROM deliveries d JOIN seller_orders so ON so.id=d.seller_order_id WHERE d.id=$1',[deliveryId]);
    if(!peek.rows[0])throw new ApiError(404,'Delivery not found.');
    await c.query('SELECT id FROM orders WHERE id=$1 FOR UPDATE',[peek.rows[0].order_id]);
    await c.query('SELECT id FROM seller_orders WHERE id=$1 FOR UPDATE',[peek.rows[0].seller_order_id]);
    const delivery=await c.query('SELECT * FROM deliveries WHERE id=$1 FOR UPDATE',[deliveryId]);
    const d=delivery.rows[0];
    if(!d)throw new ApiError(404,'Delivery not found.');
    let courierProfile=null;
    if(req.user.role_name==='courier'){
      courierProfile=await c.query('SELECT * FROM courier_profiles WHERE user_id=$1 FOR UPDATE',[req.user.id]);
      if(!courierProfile.rows[0])throw new ApiError(404,'Courier profile not found.');
      if(String(d.courier_id)!==String(courierProfile.rows[0].id))throw new ApiError(404,'Assigned delivery not found.');
    }else if(d.courier_id){
      courierProfile=await c.query('SELECT * FROM courier_profiles WHERE id=$1 FOR UPDATE',[d.courier_id]);
    }
    if(d.delivery_status===status)return d;
    if(!(DELIVERY_TRANSITIONS[d.delivery_status]||[]).includes(status))
      throw new ApiError(409,`Cannot change delivery from ${d.delivery_status} to ${status}.`);
    if(['delivered','failed'].includes(status)&&!d.courier_id)
      throw new ApiError(409,'A delivery must be assigned to a courier first.');

    const updated=await c.query(`UPDATE deliveries SET delivery_status=$1,
      picked_up_at=CASE WHEN $1='picked_up' THEN COALESCE(picked_up_at,NOW()) ELSE picked_up_at END,
      delivered_at=CASE WHEN $1='delivered' THEN COALESCE(delivered_at,NOW()) ELSE delivered_at END,
      delivery_note=COALESCE($2,delivery_note),updated_at=NOW() WHERE id=$3 RETURNING *`,
      [status,req.body.delivery_note||null,deliveryId]);

    if(['delivered','failed'].includes(status)){
      const so=await c.query('SELECT order_id,seller_order_status FROM seller_orders WHERE id=$1 FOR UPDATE',[d.seller_order_id]);
      if(!so.rows[0])throw new ApiError(404,'Seller order not found.');
      const nextSellerStatus=status==='delivered'?'delivered':'failed';
      await c.query('UPDATE seller_orders SET seller_order_status=$1,updated_at=NOW() WHERE id=$2',[nextSellerStatus,d.seller_order_id]);
      await c.query('INSERT INTO order_status_history(order_id,seller_order_id,changed_by,old_status,new_status,note) VALUES($1,$2,$3,$4,$5,$6)',
        [so.rows[0].order_id,d.seller_order_id,req.user.id,so.rows[0].seller_order_status,nextSellerStatus,req.body.delivery_note||null]);
      await refreshParentOrderStatus(c,so.rows[0].order_id,req.user.id,`Delivery ${status}`);
      await c.query(`UPDATE courier_profiles cp SET availability_status=CASE WHEN EXISTS(
        SELECT 1 FROM deliveries other WHERE other.courier_id=cp.id AND other.id<>$2
        AND other.delivery_status IN ('assigned','accepted','picked_up','in_transit')
      ) THEN 'busy' ELSE 'available' END,updated_at=NOW() WHERE cp.id=$1`,[d.courier_id,deliveryId]);
    }
    return updated.rows[0];
  });
  send(res,result);
}));
module.exports=router;
