-- Migración para sistema de suscripciones
-- Crear tabla de planes de suscripción

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_annual DECIMAL(10,2),
    features JSONB NOT NULL DEFAULT '[]',
    max_monthly_reports INTEGER DEFAULT 0,
    max_annual_reports INTEGER DEFAULT 0,
    has_fleet_management BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de suscripciones de usuarios
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, expired, cancelled, trial
    trial_start_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    monthly_reports_used INTEGER DEFAULT 0,
    annual_reports_used INTEGER DEFAULT 0,
    last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de transacciones de pago
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MXN',
    payment_type VARCHAR(20) NOT NULL, -- monthly, annual, one_time_report
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
    stripe_payment_intent_id VARCHAR(255),
    payment_method VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Insertar planes predefinidos
INSERT INTO subscription_plans (name, description, price_monthly, price_annual, features, max_monthly_reports, max_annual_reports, has_fleet_management) VALUES
('Prueba Gratuita', 'Acceso completo por 1 mes para probar todas las funcionalidades', 0.00, 0.00, 
 '["Gestión completa de flotilla", "1 papel de trabajo mensual", "Procesamiento CFDI", "Declaraciones fiscales"]', 
 1, 0, true),
 
('Plan Mensual', 'Acceso mensual con 1 declaración incluida', 249.99, 0.00,
 '["Gestión completa de flotilla", "1 papel de trabajo mensual", "Procesamiento CFDI", "Declaraciones fiscales", "Soporte técnico"]',
 1, 0, true),
 
('Plan Anual', 'Acceso anual con papeles de trabajo ilimitados', 0.00, 2400.00,
 '["Gestión completa de flotilla", "Papeles de trabajo ilimitados", "Procesamiento CFDI", "Declaraciones fiscales", "Soporte prioritario", "Reportes anuales"]',
 12, 999, true),
 
('Papel de Trabajo Individual', 'Pago único por papel de trabajo anual', 600.00, 0.00,
 '["1 papel de trabajo anual"]',
 0, 1, false);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_updated_at();

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_updated_at();

CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_updated_at();
