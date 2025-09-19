#!/usr/bin/env python3
import psycopg2
import os
from datetime import datetime
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de base de datos
DATABASE_URL = os.getenv('NEON_DATABASE_URL')

def upgrade_user_to_premium():
    """Actualiza la suscripción del usuario a Premium directamente"""
    
    # RFC del usuario a actualizar
    rfc = "LOCG901125JBA"
    
    try:
        # Conectar a la base de datos
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("=== UPGRADE A PREMIUM ===")
        print(f"RFC: {rfc}")
        
        # Buscar el usuario
        cur.execute("SELECT id, nombre FROM users WHERE rfc = %s", (rfc,))
        user = cur.fetchone()
        
        if not user:
            print(f"❌ Usuario con RFC {rfc} no encontrado")
            return False
        
        user_id = user[0]
        user_name = user[1]
        
        print(f"✅ Usuario encontrado:")
        print(f"   ID: {user_id}")
        print(f"   Nombre: {user_name}")
        
        # Obtener el plan Premium
        cur.execute("SELECT id, name, price FROM subscription_plans WHERE name = 'Premium'")
        premium_plan = cur.fetchone()
        
        if not premium_plan:
            print("❌ Plan Premium no encontrado")
            return False
        
        premium_plan_id = premium_plan[0]
        premium_price = premium_plan[2]
        
        print(f"✅ Plan Premium encontrado:")
        print(f"   ID: {premium_plan_id}")
        print(f"   Precio: ${premium_price}")
        
        # Verificar suscripción actual
        cur.execute("""
            SELECT s.id, s.plan_id, sp.name, sp.price
            FROM subscriptions s
            JOIN subscription_plans sp ON s.plan_id = sp.id
            WHERE s.user_id = %s
        """, (user_id,))
        
        current_subscription = cur.fetchone()
        
        if current_subscription:
            current_plan_name = current_subscription[2]
            print(f"📋 Suscripción actual: {current_plan_name}")
            
            # Actualizar la suscripción existente
            cur.execute("""
                UPDATE subscriptions 
                SET plan_id = %s, updated_at = %s
                WHERE user_id = %s
            """, (premium_plan_id, datetime.now(), user_id))
            
            print(f"✅ Suscripción actualizada de {current_plan_name} a Premium")
        else:
            # Crear nueva suscripción Premium
            cur.execute("""
                INSERT INTO subscriptions (user_id, plan_id, status, created_at, updated_at)
                VALUES (%s, %s, 'active', %s, %s)
            """, (user_id, premium_plan_id, datetime.now(), datetime.now()))
            
            print(f"✅ Nueva suscripción Premium creada")
        
        # Confirmar cambios
        conn.commit()
        
        # Verificar el upgrade
        cur.execute("""
            SELECT u.id, u.nombre, u.rfc, s.status, sp.name, sp.price, sp.max_records
            FROM users u
            JOIN subscriptions s ON u.id = s.user_id
            JOIN subscription_plans sp ON s.plan_id = sp.id
            WHERE u.rfc = %s
        """, (rfc,))
        
        result = cur.fetchone()
        if result:
            print(f"\n🎉 UPGRADE COMPLETADO:")
            print(f"   Usuario: {result[1]}")
            print(f"   RFC: {result[2]}")
            print(f"   Estado: {result[3]}")
            print(f"   Plan: {result[4]}")
            print(f"   Precio: ${result[5]}")
            print(f"   Registros: {'Ilimitados' if result[6] is None else result[6]}")
            
            # Mostrar características Premium
            print(f"\n🌟 CARACTERÍSTICAS PREMIUM ACTIVADAS:")
            print(f"   ✅ Procesamiento CFDI ilimitado")
            print(f"   ✅ Registros ilimitados")
            print(f"   ✅ Reportes avanzados")
            print(f"   ✅ Soporte 24/7")
            print(f"   ✅ Acceso a API")
            print(f"   ✅ Todas las funcionalidades sin restricciones")
            
        return True
        
    except Exception as e:
        print(f"❌ Error en upgrade: {e}")
        if conn:
            conn.rollback()
        return False
        
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    success = upgrade_user_to_premium()
    if success:
        print(f"\n🎊 UPGRADE A PREMIUM COMPLETADO EXITOSAMENTE")
        print(f"   El usuario GILBERTO MISAEL LOZANO CORONADO")
        print(f"   ahora tiene acceso PREMIUM COMPLETO")
        print(f"   sin restricciones en el sistema.")
    else:
        print("❌ FALLO EN EL UPGRADE")
