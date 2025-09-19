import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const createUsersTable = `
-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nombre text NOT NULL,
  rfc text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Índice para búsquedas rápidas por RFC
CREATE INDEX IF NOT EXISTS idx_users_rfc ON users(rfc);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

const createSubscriptionTables = `
-- Tabla de planes de suscripción
CREATE TABLE IF NOT EXISTS subscription_plans (
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

-- Tabla de suscripciones de usuarios
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabla de upgrades de suscripción
CREATE TABLE IF NOT EXISTS subscription_upgrades (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertar planes por defecto
INSERT INTO subscription_plans (name, description, price, max_records, features) VALUES
('Gratuito', 'Plan básico para comenzar', 0.00, 5, '["Procesamiento básico CFDI", "5 registros máximo", "Soporte por email"]'),
('Básico', 'Plan para pequeñas empresas', 299.00, 100, '["Procesamiento CFDI completo", "100 registros máximo", "Reportes básicos", "Soporte prioritario"]'),
('Premium', 'Plan completo sin límites', 599.00, NULL, '["Procesamiento CFDI ilimitado", "Registros ilimitados", "Reportes avanzados", "Soporte 24/7", "API access"]')
ON CONFLICT DO NOTHING;

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_upgrades_user_id ON subscription_upgrades(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_upgrades_payment_intent ON subscription_upgrades(payment_intent_id);
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Enable UUID generation
    await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    
    // Create users table
    await pool.query(createUsersTable);
    
    // Create subscription tables
    await pool.query(createSubscriptionTables);
    
    res.json({ 
      message: "Migración ejecutada exitosamente",
      tables: ["users", "subscription_plans", "subscriptions", "subscription_upgrades"]
    });
  } catch (error: any) {
    console.error('Error running migration:', error);
    res.status(500).json({ 
      message: 'Error ejecutando migración',
      error: error.message 
    });
  }
}
