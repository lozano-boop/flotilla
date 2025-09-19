const { Pool } = require('pg');

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const migrations = [
  // Migration 1: Create users table
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    rfc TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,
  
  // Migration 2: Create subscription_plans table
  `CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    max_records INTEGER,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,
  
  // Migration 3: Create subscriptions table
  `CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    trial_ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
  )`,
  
  // Migration 4: Create subscription_upgrades table
  `CREATE TABLE IF NOT EXISTS subscription_upgrades (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`
];

const defaultPlans = `
INSERT INTO subscription_plans (name, description, price, max_records, features) VALUES
('Gratuito', 'Plan básico para comenzar', 0.00, 5, '["Procesamiento básico CFDI", "5 registros máximo", "Soporte por email"]'),
('Básico', 'Plan para pequeñas empresas', 299.00, 100, '["Procesamiento CFDI completo", "100 registros máximo", "Reportes básicos", "Soporte prioritario"]'),
('Premium', 'Plan completo sin límites', 599.00, NULL, '["Procesamiento CFDI ilimitado", "Registros ilimitados", "Reportes avanzados", "Soporte 24/7", "API access"]')
ON CONFLICT DO NOTHING
`;

const indexes = [
  'CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_subscription_upgrades_user_id ON subscription_upgrades(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_subscription_upgrades_payment_intent ON subscription_upgrades(payment_intent_id)'
];

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    // Run migrations
    for (const migration of migrations) {
      await pool.query(migration);
    }

    // Insert default plans
    await pool.query(defaultPlans);

    // Create indexes
    for (const index of indexes) {
      await pool.query(index);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: "Database migrated successfully",
        migrations: migrations.length,
        indexes: indexes.length
      })
    };
  } catch (error) {
    console.error('Migration error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Migration failed',
        error: error.message
      })
    };
  }
};
