#!/usr/bin/env python3
import requests
import socket
import subprocess
import time

def get_current_dns_info():
    """Obtener información actual del DNS"""
    domain = "tuflotillauber.digital"
    
    print("=== INFORMACIÓN ACTUAL DEL DNS ===")
    print(f"Dominio: {domain}")
    
    try:
        # IP actual
        current_ip = socket.gethostbyname(domain)
        print(f"IP actual: {current_ip}")
        
        # Verificar si es Vercel o Netlify
        if current_ip == "76.76.21.21":
            print("🔴 Apunta a: VERCEL")
        elif current_ip == "13.52.188.95":
            print("🟢 Apunta a: NETLIFY")
        else:
            print(f"⚠️  Apunta a: IP desconocida ({current_ip})")
            
        # Verificar registros DNS
        try:
            result = subprocess.run(['nslookup', domain], capture_output=True, text=True)
            print(f"\nRegistros DNS actuales:")
            print(result.stdout)
        except:
            pass
            
    except Exception as e:
        print(f"❌ Error obteniendo DNS: {e}")

def show_netlify_setup_guide():
    """Mostrar guía paso a paso para configurar Netlify"""
    
    print("\n" + "="*60)
    print("🚀 GUÍA PASO A PASO - MIGRACIÓN VERCEL → NETLIFY")
    print("="*60)
    
    print("\n📋 PASO 1: CONFIGURAR DOMINIO EN NETLIFY")
    print("─" * 50)
    print("1. Ve a: https://app.netlify.com/projects/flotilla-manager")
    print("2. Clic en 'Domain settings' en el menú lateral")
    print("3. Clic en 'Add custom domain'")
    print("4. Ingresa: tuflotillauber.digital")
    print("5. Clic en 'Verify' y luego 'Add domain'")
    print("6. Netlify te mostrará las instrucciones DNS específicas")
    
    print("\n🌐 PASO 2: ACTUALIZAR REGISTROS DNS")
    print("─" * 50)
    print("Ve a tu proveedor DNS (donde compraste tuflotillauber.digital)")
    print("Busca la sección 'DNS Management' o 'Manage DNS'")
    print("")
    print("ELIMINAR registro actual:")
    print("   Tipo: A")
    print("   Nombre: @")
    print("   Valor: 76.76.21.21 (Vercel) ❌ ELIMINAR")
    print("")
    print("AGREGAR nuevo registro:")
    print("   Tipo: CNAME")
    print("   Nombre: @ (o www)")
    print("   Valor: flotilla-manager.netlify.app")
    print("   TTL: 3600 (1 hora)")
    
    print("\n⏰ PASO 3: ESPERAR PROPAGACIÓN")
    print("─" * 50)
    print("• DNS puede tardar 1-24 horas en propagarse")
    print("• Puedes verificar con: nslookup tuflotillauber.digital")
    print("• Cuando funcione, verás IP de Netlify: 13.52.188.95")

def create_verification_script():
    """Crear script para verificar el cambio"""
    
    script_content = '''#!/usr/bin/env python3
import socket
import time
import requests

def check_dns_change():
    domain = "tuflotillauber.digital"
    netlify_ip = "13.52.188.95"
    
    print(f"🔍 Verificando DNS para {domain}...")
    
    try:
        current_ip = socket.gethostbyname(domain)
        print(f"IP actual: {current_ip}")
        
        if current_ip == netlify_ip:
            print("✅ DNS actualizado correctamente - apunta a Netlify")
            
            # Probar acceso
            try:
                response = requests.get(f"https://{domain}", timeout=10)
                if response.status_code == 200:
                    print("✅ Sitio web funcionando")
                    
                    # Probar API
                    login_response = requests.post(
                        f"https://{domain}/api/auth-login",
                        json={"rfc": "LOCG901125JBA", "password": "LOZANO12"},
                        timeout=10
                    )
                    
                    if login_response.status_code == 200:
                        print("✅ APIs funcionando correctamente")
                        print("🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE")
                        return True
                    else:
                        print("❌ APIs no funcionan aún")
                else:
                    print("❌ Sitio web no responde correctamente")
            except Exception as e:
                print(f"❌ Error probando acceso: {e}")
                
        else:
            print("⏳ DNS aún no actualizado, sigue apuntando a Vercel")
            print("💡 Espera más tiempo para la propagación")
            
    except Exception as e:
        print(f"❌ Error verificando DNS: {e}")
    
    return False

if __name__ == "__main__":
    print("🔄 VERIFICADOR DE MIGRACIÓN DNS")
    print("Ejecuta este script cada 30 minutos para verificar el cambio")
    check_dns_change()
'''
    
    with open('/home/lozano/Desktop/bots/fleet_manage/FlotillaManager/verify_migration.py', 'w') as f:
        f.write(script_content)
    
    print(f"\n📝 SCRIPT DE VERIFICACIÓN CREADO")
    print(f"Archivo: verify_migration.py")
    print(f"Uso: python3 verify_migration.py")

def show_provider_specific_guides():
    """Mostrar guías específicas por proveedor DNS"""
    
    print(f"\n🏢 GUÍAS POR PROVEEDOR DNS COMÚN")
    print("─" * 50)
    
    print("GODADDY:")
    print("1. Ve a godaddy.com → Mi cuenta → Dominios")
    print("2. Clic en tu dominio → Administrar DNS")
    print("3. Elimina el registro A existente")
    print("4. Agrega CNAME: @ → flotilla-manager.netlify.app")
    
    print("\nCLOUDFLARE:")
    print("1. Ve a cloudflare.com → Dashboard")
    print("2. Selecciona tu dominio → DNS")
    print("3. Elimina el registro A existente")
    print("4. Agrega CNAME: @ → flotilla-manager.netlify.app")
    
    print("\nNAMECHEAP:")
    print("1. Ve a namecheap.com → Domain List")
    print("2. Clic en Manage → Advanced DNS")
    print("3. Elimina el registro A existente")
    print("4. Agrega CNAME: @ → flotilla-manager.netlify.app")

def main():
    print("🔄 ASISTENTE DE MIGRACIÓN VERCEL → NETLIFY")
    
    # Mostrar información actual
    get_current_dns_info()
    
    # Mostrar guía completa
    show_netlify_setup_guide()
    
    # Crear script de verificación
    create_verification_script()
    
    # Mostrar guías por proveedor
    show_provider_specific_guides()
    
    print(f"\n" + "="*60)
    print("🎯 RESUMEN DE ACCIONES REQUERIDAS:")
    print("1. ✅ Netlify ya está configurado y funcionando")
    print("2. 🔧 Configurar dominio en panel de Netlify")
    print("3. 🌐 Actualizar DNS de Vercel a Netlify")
    print("4. ⏰ Esperar propagación (1-24 horas)")
    print("5. ✅ Verificar con verify_migration.py")
    
    print(f"\n📱 ACCESO TEMPORAL:")
    print("URL: https://flotilla-manager.netlify.app")
    print("Credenciales: RFC LOCG901125JBA / Contraseña LOZANO12")

if __name__ == "__main__":
    main()
