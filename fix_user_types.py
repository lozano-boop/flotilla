import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
conn = psycopg2.connect(os.getenv('NEON_DATABASE_URL'))
cur = conn.cursor()

# Check current users table structure
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'")
columns = cur.fetchall()
print("=== ESTRUCTURA ACTUAL DE USERS ===")
for col in columns:
    print(f"{col[0]}: {col[1]}")

# Fix migration with correct UUID types
fix_migration = """
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

-- Create subscriptions table with UUID user_id
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create subscription upgrades table with UUID user_id
CREATE TABLE subscription_upgrades (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
"""

try:
    print("\nEjecutando migración con tipos UUID correctos...")
    cur.execute(fix_migration)
    conn.commit()
    print("✅ Migración ejecutada exitosamente")
    
    # Verify tables
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
    tables = cur.fetchall()
    print("\n=== TABLAS DESPUÉS DE MIGRACIÓN ===")
    for table in tables:
        print(f"- {table[0]}")
    
    # Check plans
    cur.execute("SELECT id, name, price FROM subscription_plans ORDER BY price")
    plans = cur.fetchall()
    print("\n=== PLANES CREADOS ===")
    for plan in plans:
        print(f"ID: {plan[0]}, Nombre: {plan[1]}, Precio: ${plan[2]}")
        
except Exception as e:
    print(f"❌ Error en migración: {e}")
    conn.rollback()
finally:
    cur.close()
    conn.close()
