-- Migration: Create subscription_upgrades table
-- This table tracks payment attempts and subscription upgrades

CREATE TABLE IF NOT EXISTS subscription_upgrades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_upgrades_user_id ON subscription_upgrades(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_upgrades_payment_intent ON subscription_upgrades(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_subscription_upgrades_status ON subscription_upgrades(status);

-- Add comments for documentation
COMMENT ON TABLE subscription_upgrades IS 'Tracks subscription upgrade attempts and payments';
COMMENT ON COLUMN subscription_upgrades.payment_intent_id IS 'Stripe payment intent ID for tracking payments';
COMMENT ON COLUMN subscription_upgrades.status IS 'Payment status: pending, completed, failed, cancelled';
