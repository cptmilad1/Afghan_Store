const test=require('node:test');
const assert=require('node:assert/strict');
const {SELLER_TRANSITIONS,DELIVERY_TRANSITIONS,calculateParentOrderStatus}=require('./orderState');

test('seller order workflow does not allow reopening terminal states',()=>{
  assert.deepEqual(SELLER_TRANSITIONS.cancelled,[]);
  assert.deepEqual(SELLER_TRANSITIONS.delivered,[]);
  assert.deepEqual(SELLER_TRANSITIONS.failed,[]);
  assert.ok(SELLER_TRANSITIONS.pending.includes('cancelled'));
  assert.ok(!SELLER_TRANSITIONS.out_for_delivery.includes('cancelled'));
});

test('delivery workflow enforces pickup and transit sequence',()=>{
  assert.deepEqual(DELIVERY_TRANSITIONS.awaiting_assignment,['assigned','accepted','cancelled']);
  assert.ok(DELIVERY_TRANSITIONS.accepted.includes('picked_up'));
  assert.ok(!DELIVERY_TRANSITIONS.accepted.includes('delivered'));
  assert.ok(DELIVERY_TRANSITIONS.in_transit.includes('delivered'));
  assert.deepEqual(DELIVERY_TRANSITIONS.delivered,[]);
});

test('parent order status reflects seller sub-order outcomes',()=>{
  assert.equal(calculateParentOrderStatus(['cancelled','cancelled']),'cancelled');
  assert.equal(calculateParentOrderStatus(['failed','failed']),'failed');
  assert.equal(calculateParentOrderStatus(['delivered','delivered']),'completed');
  assert.equal(calculateParentOrderStatus(['delivered','failed']),'completed');
  assert.equal(calculateParentOrderStatus(['cancelled','delivered']),'partially_cancelled');
  assert.equal(calculateParentOrderStatus(['confirmed','pending']),'confirmed');
  assert.equal(calculateParentOrderStatus(['preparing','pending']),'processing');
});
