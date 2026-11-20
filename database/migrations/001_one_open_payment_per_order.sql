-- Apply once to databases created from the earlier Afghan Connect schema.
-- First ensure that no order has multiple open payment attempts.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM payment_transactions
    WHERE transaction_status IN ('pending', 'successful')
    GROUP BY order_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot create one-open-payment index: duplicate pending/successful payment transactions exist. Resolve duplicates first.';
  END IF;
END $$;

-- The current backend can mark a parent order failed after all seller orders fail.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (order_status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled', 'partially_cancelled', 'failed'));

CREATE UNIQUE INDEX IF NOT EXISTS one_open_payment_per_order_idx
  ON payment_transactions(order_id)
  WHERE transaction_status IN ('pending', 'successful');
