#!/usr/bin/env python3
import socket
import subprocess
import time
import requests

def check_dns_status():
    """Verificar estado actual del DNS"""
    domain = "tuflotillauber.digital"
    
    print("🔍 VERIFICANDO PROPAGACIÓN DNS")
    print("="*50)
    print(f"Dominio: {domain}")
    print(f"Hora: {time.strftime('%H:%M:%S')}")
    
    # 1. Verificar con nslookup
    print(f"\n📡 1. VERIFICACIÓN NSLOOKUP:")
    try:
        result = subprocess.run(['nslookup', domain], capture_output=True, text=True, timeout=10)
        if "NXDOMAIN" in result.stdout or "can't find" in result.stdout:
            print("   ⏳ DNS aún propagándose (NXDOMAIN)")
        elif "Address:" in result.stdout:
            lines = result.stdout.split('\n')
            for line in lines:
                if "Address:" in line and not "#53" in line:
                    ip = line.split("Address:")[-1].strip()
                    print(f"   ✅ Resuelve a IP: {ip}")
                    
                    # Verificar si es Netlify
                    if ip in ["13.52.188.95", "52.52.192.191"]:
                        print("   🎉 ¡APUNTA A NETLIFY!")
                        return True
                    else:
                        print("   ⚠️  IP no es de Netlify")
        else:
            print("   ⏳ Sin respuesta DNS aún")
    except Exception as e:
        print(f"   ❌ Error nslookup: {e}")
    
    # 2. Verificar con dig
    print(f"\n🔧 2. VERIFICACIÓN DIG:")
    try:
        result = subprocess.run(['dig', '+short', domain], capture_output=True, text=True, timeout=10)
        if result.stdout.strip():
            ips = result.stdout.strip().split('\n')
            for ip in ips:
                if ip:
                    print(f"   IP: {ip}")
                    if ip in ["13.52.188.95", "52.52.192.191"]:
                        print("   🎉 ¡NETLIFY DETECTADO!")
                        return True
        else:
            print("   ⏳ Sin respuesta dig")
    except Exception as e:
        print(f"   ❌ Error dig: {e}")
    
    # 3. Verificar con diferentes DNS servers
    print(f"\n🌐 3. VERIFICACIÓN MÚLTIPLES DNS:")
    dns_servers = ['8.8.8.8', '1.1.1.1', '208.67.222.222']
    
    for dns_server in dns_servers:
        try:
            result = subprocess.run(['nslookup', domain, dns_server], 
                                  capture_output=True, text=True, timeout=10)
            if "Address:" in result.stdout:
                print(f"   {dns_server}: ✅ Resuelve")
            else:
                print(f"   {dns_server}: ⏳ Propagando")
        except:
            print(f"   {dns_server}: ❌ Error")
    
    return False

def test_web_access():
    """Probar acceso web cuando DNS esté listo"""
    domain = "tuflotillauber.digital"
    
    print(f"\n🌍 4. PRUEBA DE ACCESO WEB:")
    
    # Probar HTTP
    try:
        response = requests.get(f"http://{domain}", timeout=15, allow_redirects=True)
        print(f"   HTTP Status: {response.status_code}")
        print(f"   URL final: {response.url}")
        
        if response.status_code == 200:
            print("   ✅ Sitio web accesible")
            
            # Probar HTTPS
            try:
                https_response = requests.get(f"https://{domain}", timeout=15)
                if https_response.status_code == 200:
                    print("   ✅ HTTPS funcionando")
                    
                    # Probar login API
                    login_data = {"rfc": "LOCG901125JBA", "password": "LOZANO12"}
                    api_response = requests.post(
                        f"https://{domain}/api/auth-login",
                        json=login_data,
                        timeout=15
                    )
                    
                    if api_response.status_code == 200:
                        user_data = api_response.json()
                        print("   ✅ Login API funcionando")
                        print(f"   👤 Usuario: {user_data.get('user', {}).get('nombre', 'N/A')}")
                        return True
                    else:
                        print("   ⚠️  Login API no responde correctamente")
                        
            except Exception as e:
                print(f"   ⚠️  HTTPS/API error: {e}")
        else:
            print(f"   ⚠️  Sitio responde con código {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error acceso web: {e}")
    
    return False

def show_next_steps(dns_ready):
    """Mostrar próximos pasos según estado"""
    
    print(f"\n" + "="*50)
    
    if dns_ready:
        print("🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!")
        print("="*50)
        print("✅ DNS propagado correctamente")
        print("✅ Sitio web funcionando")
        print("✅ APIs operativas")
        print("✅ Login funcionando")
        
        print(f"\n🌐 ACCESO FINAL:")
        print("URL: https://tuflotillauber.digital")
        print("Usuario: LOCG901125JBA")
        print("Contraseña: LOZANO12")
        
        print(f"\n🎯 MIGRACIÓN VERCEL → NETLIFY: COMPLETADA")
        
    else:
        print("⏳ PROPAGACIÓN DNS EN PROCESO")
        print("="*50)
        print("📋 Estado actual:")
        print("   ✅ Registro CNAME configurado en GoDaddy")
        print("   ⏳ DNS propagándose (normal hasta 24 horas)")
        print("   ⏳ Esperando resolución completa")
        
        print(f"\n🔄 PRÓXIMOS PASOS:")
        print("1. Esperar 30-60 minutos más")
        print("2. Ejecutar: python3 check_dns_propagation.py")
        print("3. Repetir hasta que DNS esté listo")
        
        print(f"\n📱 ACCESO TEMPORAL:")
        print("URL: https://flotilla-manager.netlify.app")
        print("Usuario: LOCG901125JBA")
        print("Contraseña: LOZANO12")
        
        print(f"\n💡 TIEMPO ESTIMADO RESTANTE:")
        print("   • Mínimo: 30 minutos")
        print("   • Máximo: 24 horas")
        print("   • Promedio: 2-4 horas")

def main():
    print("🚀 VERIFICADOR DE PROPAGACIÓN DNS - NETLIFY")
    
    # Verificar DNS
    dns_ready = check_dns_status()
    
    # Si DNS está listo, probar acceso web
    if dns_ready:
        web_ready = test_web_access()
        dns_ready = dns_ready and web_ready
    
    # Mostrar próximos pasos
    show_next_steps(dns_ready)

if __name__ == "__main__":
    main()
