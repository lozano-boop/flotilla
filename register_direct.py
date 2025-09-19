#!/usr/bin/env python3
import psycopg2
import bcrypt
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de base de datos
DATABASE_URL = os.getenv('NEON_DATABASE_URL')

def register_user_direct():
    """Registra usuario directamente en la base de datos"""
    
    # Datos del usuario
    nombre = "GILBERTO MISAEL LOZANO CORONADO"
    rfc = "LOCG901125JBA"
    password = "LOZANO12"
    
    try:
        # Conectar a la base de datos
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("=== REGISTRO DIRECTO EN BASE DE DATOS ===")
        print(f"Nombre: {nombre}")
        print(f"RFC: {rfc}")
        print(f"Contraseña: {password}")
        
        # Verificar si el usuario ya existe
        cur.execute("SELECT id FROM users WHERE rfc = %s", (rfc,))
        existing_user = cur.fetchone()
        
        if existing_user:
            print(f"⚠️  Usuario con RFC {rfc} ya existe con ID: {existing_user[0]}")
            return existing_user[0]
        
        # Hash de la contraseña
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Generar UUID para el usuario
        user_id = str(uuid.uuid4())
        
        # Insertar usuario
        cur.execute("""
            INSERT INTO users (id, nombre, rfc, password_hash, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, nombre, rfc
        """, (user_id, nombre, rfc, password_hash, datetime.now(), datetime.now()))
        
        user = cur.fetchone()
        print(f"✅ Usuario creado exitosamente:")
        print(f"   ID: {user[0]}")
        print(f"   Nombre: {user[1]}")
        print(f"   RFC: {user[2]}")
        
        # Crear suscripción gratuita automáticamente
        cur.execute("SELECT id FROM subscription_plans WHERE name = 'Gratuito'")
        free_plan = cur.fetchone()
        
        if free_plan:
            cur.execute("""
                INSERT INTO subscriptions (user_id, plan_id, status, created_at, updated_at)
                VALUES (%s, %s, 'active', %s, %s)
            """, (user_id, free_plan[0], datetime.now(), datetime.now()))
            
            print(f"✅ Suscripción gratuita creada exitosamente")
        
        # Confirmar cambios
        conn.commit()
        
        # Verificar registro completo
        cur.execute("""
            SELECT u.id, u.nombre, u.rfc, s.status, sp.name, sp.price
            FROM users u
            LEFT JOIN subscriptions s ON u.id = s.user_id
            LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
            WHERE u.rfc = %s
        """, (rfc,))
        
        result = cur.fetchone()
        if result:
            print(f"\n🎉 REGISTRO COMPLETO VERIFICADO:")
            print(f"   Usuario ID: {result[0]}")
            print(f"   Nombre: {result[1]}")
            print(f"   RFC: {result[2]}")
            print(f"   Estado Suscripción: {result[3]}")
            print(f"   Plan: {result[4]}")
            print(f"   Precio: ${result[5]}")
            
        return user_id
        
    except Exception as e:
        print(f"❌ Error en registro directo: {e}")
        if conn:
            conn.rollback()
        return None
        
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    user_id = register_user_direct()
    if user_id:
        print(f"\n✅ USUARIO REGISTRADO CON ACCESO COMPLETO")
        print(f"   ID: {user_id}")
        print(f"   RFC: LOCG901125JBA")
        print(f"   Contraseña: LOZANO12")
        print(f"   Acceso: COMPLETO AL SISTEMA")
    else:
        print("❌ FALLO EN EL REGISTRO")
