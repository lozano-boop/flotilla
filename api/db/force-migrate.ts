import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const dropAndCreateTables = `
-- Drop existing tables if they exist
DROP TABLE IF EXISTS subscription_upgrades CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;

-- Create subscription plans table
CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  max_records INTEGER,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create subscription upgrades table
CREATE TABLE subscription_upgrades (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, max_records, features) VALUES
('Gratuito', 'Plan básico para comenzar', 0.00, 5, '["Procesamiento básico CFDI", "5 registros máximo", "Soporte por email"]'),
('Básico', 'Plan para pequeñas empresas', 299.00, 100, '["Procesamiento CFDI completo", "100 registros máximo", "Reportes básicos", "Soporte prioritario"]'),
('Premium', 'Plan completo sin límites', 599.00, NULL, '["Procesamiento CFDI ilimitado", "Registros ilimitados", "Reportes avanzados", "Soporte 24/7", "API access"]');

-- Create indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscription_upgrades_user_id ON subscription_upgrades(user_id);
CREATE INDEX idx_subscription_upgrades_payment_intent ON subscription_upgrades(payment_intent_id);
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Execute the migration
    await pool.query(dropAndCreateTables);
    
    res.json({ 
      message: "Migración forzada ejecutada exitosamente",
      tables: ["subscription_plans", "subscriptions", "subscription_upgrades"],
      plans_created: 3
    });
  } catch (error: any) {
    console.error('Error running force migration:', error);
    res.status(500).json({ 
      message: 'Error ejecutando migración forzada',
      error: error.message 
    });
  }
}
