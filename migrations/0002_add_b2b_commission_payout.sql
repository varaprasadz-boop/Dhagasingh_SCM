-- Commission payout tracking on B2B orders
ALTER TABLE b2b_orders ADD COLUMN IF NOT EXISTS commission_paid_at TIMESTAMP;
ALTER TABLE b2b_orders ADD COLUMN IF NOT EXISTS commission_paid_by VARCHAR REFERENCES users(id);
