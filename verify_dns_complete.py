#!/usr/bin/env python3
import requests
import socket
import subprocess
import time

def check_dns_propagation():
    """Verificar propagación DNS completa"""
    domain = "tuflotillauber.digital"
    
    print("=== VERIFICACIÓN COMPLETA DE DNS ===")
    print(f"Dominio: {domain}")
    
    try:
        # 1. Verificar resolución DNS
        print(f"\n🔍 1. RESOLUCIÓN DNS:")
        ip = socket.gethostbyname(domain)
        print(f"   IP actual: {ip}")
        
        # 2. Verificar con diferentes servidores DNS
        dns_servers = ['8.8.8.8', '1.1.1.1', '208.67.222.222']
        print(f"\n🌐 2. VERIFICACIÓN EN MÚLTIPLES DNS:")
        
        for dns in dns_servers:
            try:
                result = subprocess.run(['nslookup', domain, dns], 
                                      capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    print(f"   ✅ {dns}: Resuelve correctamente")
                else:
                    print(f"   ❌ {dns}: No resuelve")
            except:
                print(f"   ⚠️  {dns}: Timeout")
        
        # 3. Verificar acceso HTTP
        print(f"\n🌍 3. VERIFICACIÓN HTTP:")
        try:
            response = requests.get(f"http://{domain}", timeout=15, allow_redirects=True)
            print(f"   Status Code: {response.status_code}")
            print(f"   URL final: {response.url}")
            
            if response.status_code == 200:
                print(f"   ✅ HTTP funcionando correctamente")
            else:
                print(f"   ⚠️  HTTP responde con código {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Error HTTP: {e}")
        
        # 4. Verificar acceso HTTPS
        print(f"\n🔒 4. VERIFICACIÓN HTTPS:")
        try:
            response = requests.get(f"https://{domain}", timeout=15, allow_redirects=True)
            print(f"   Status Code: {response.status_code}")
            print(f"   URL final: {response.url}")
            
            if response.status_code == 200:
                print(f"   ✅ HTTPS funcionando correctamente")
                print(f"   🔐 SSL configurado automáticamente")
            else:
                print(f"   ⚠️  HTTPS responde con código {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Error HTTPS: {e}")
            print(f"   💡 SSL aún configurándose (normal en primeros minutos)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en verificación DNS: {e}")
        return False

def test_api_endpoints():
    """Probar endpoints de API con dominio personalizado"""
    domain = "tuflotillauber.digital"
    
    print(f"\n🔧 5. VERIFICACIÓN DE APIs:")
    
    # Test login endpoint
    login_data = {
        "rfc": "LOCG901125JBA",
        "password": "LOZANO12"
    }
    
    try:
        # Probar con HTTP primero
        response = requests.post(
            f"http://{domain}/api/auth-login",
            headers={'Content-Type': 'application/json'},
            json=login_data,
            timeout=30
        )
        
        print(f"   Login API Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Login API funcionando")
            print(f"   👤 Usuario: {data.get('user', {}).get('nombre', 'N/A')}")
            return True
        else:
            print(f"   ❌ Login API error: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error probando API: {e}")
        return False

def check_netlify_status():
    """Verificar estado en Netlify"""
    print(f"\n📊 6. ESTADO EN NETLIFY:")
    
    try:
        # Verificar que el sitio responda desde Netlify
        response = requests.get("https://flotilla-manager.netlify.app", timeout=10)
        print(f"   Netlify URL Status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"   ✅ Sitio Netlify funcionando")
        else:
            print(f"   ❌ Problema en Netlify")
            
    except Exception as e:
        print(f"   ❌ Error verificando Netlify: {e}")

if __name__ == "__main__":
    print("🚀 VERIFICACIÓN COMPLETA DE CONFIGURACIÓN DNS")
    
    # Verificar DNS
    dns_ok = check_dns_propagation()
    
    # Verificar APIs
    if dns_ok:
        api_ok = test_api_endpoints()
    else:
        api_ok = False
    
    # Verificar Netlify
    check_netlify_status()
    
    print(f"\n" + "="*50)
    print(f"📋 RESUMEN DE VERIFICACIÓN:")
    print(f"   DNS: {'✅ OK' if dns_ok else '❌ PROBLEMA'}")
    print(f"   APIs: {'✅ OK' if api_ok else '❌ PROBLEMA'}")
    
    if dns_ok and api_ok:
        print(f"\n🎉 TODO CONFIGURADO CORRECTAMENTE")
        print(f"🌐 Acceso: https://tuflotillauber.digital")
        print(f"🔑 Credenciales: RFC LOCG901125JBA / Contraseña LOZANO12")
        print(f"🎯 Sistema completamente funcional en dominio personalizado")
    else:
        print(f"\n⚠️  CONFIGURACIÓN EN PROCESO")
        print(f"💡 DNS puede tardar hasta 24 horas en propagarse completamente")
        print(f"📱 Usa mientras tanto: https://flotilla-manager.netlify.app")
