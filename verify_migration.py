#!/usr/bin/env python3
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
