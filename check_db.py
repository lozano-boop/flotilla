import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
conn = psycopg2.connect(os.getenv('NEON_DATABASE_URL'))
cur = conn.cursor()

# Check if tables exist
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
tables = cur.fetchall()
print("=== TABLAS EXISTENTES ===")
for table in tables:
    print(f"- {table[0]}")

# Check users
try:
    cur.execute("SELECT id, nombre, rfc, created_at FROM users ORDER BY created_at DESC")
    users = cur.fetchall()
    
    print("\n=== USUARIOS REGISTRADOS ===")
    if users:
        for user in users:
            print(f"ID: {user[0]}, Nombre: {user[1]}, RFC: {user[2]}, Creado: {user[3]}")
    else:
        print("No hay usuarios registrados")
        
except Exception as e:
    print(f"Error consultando usuarios: {e}")

# Check subscriptions if table exists
try:
    cur.execute("""
        SELECT u.nombre, u.rfc, s.status, sp.name as plan_name 
        FROM users u 
        LEFT JOIN subscriptions s ON u.id = s.user_id 
        LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    """)
    subs = cur.fetchall()
    
    print("\n=== SUSCRIPCIONES ===")
    if subs:
        for sub in subs:
            print(f"Usuario: {sub[0]}, RFC: {sub[1]}, Estado: {sub[2]}, Plan: {sub[3]}")
    else:
        print("No hay suscripciones")
        
except Exception as e:
    print(f"Error consultando suscripciones: {e}")

# Check subscription plans
try:
    cur.execute("SELECT id, name, price, max_records FROM subscription_plans ORDER BY price")
    plans = cur.fetchall()
    
    print("\n=== PLANES DISPONIBLES ===")
    if plans:
        for plan in plans:
            print(f"ID: {plan[0]}, Nombre: {plan[1]}, Precio: ${plan[2]}, Max Records: {plan[3]}")
    else:
        print("No hay planes configurados")
        
except Exception as e:
    print(f"Error consultando planes: {e}")

cur.close()
conn.close()
