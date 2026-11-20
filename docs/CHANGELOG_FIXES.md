# Afghan Connect - consistency fixes

This update keeps the existing project structure and frontend placeholder. It focuses on backend consistency only.

## Fixed

1. Parent order status now synchronizes with seller sub-order statuses and writes status history.
2. Customer cancellation is accepted only while all seller sub-orders are still pending.
3. Seller cancellation and customer cancellation restore product stock inside a transaction and cannot restore the same sub-order stock twice.
4. Seller sub-orders and delivery records use explicit transition maps; terminal states cannot be reopened.
5. A delivery is not visible/claimable until the seller has marked its sub-order ready.
6. Courier assignment and self-claim are transactional and set courier availability to busy.
7. Courier availability is released after delivery completion/failure only when no other active delivery exists.
8. Payment creation/status updates and the parent order payment status now change in one transaction.
9. A second pending/successful payment for the same order is blocked in application logic and by a partial unique database index.
10. Checkout now creates the order with `payment_status='pending'`, matching the pending payment transaction created in the same checkout.
11. Added the terminal parent order status `failed` and a migration for existing databases.

## Validation performed

- `node --check` passed for all JavaScript files under `backend/src`.
- Focused state-transition tests passed: 3 tests.
- Full existing test suite could not complete in this environment because dependencies (including `pg`) were not installed. An install attempt timed out.
- PostgreSQL integration tests were not run because no PostgreSQL server/database was available in this environment.

## Existing database

For an existing database, first check and resolve duplicate pending/successful payment rows per order, then run:

`database/migrations/001_one_open_payment_per_order.sql`

For a new database, use the updated `database/schema.sql` instead.
