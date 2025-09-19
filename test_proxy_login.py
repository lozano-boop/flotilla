#!/usr/bin/env python3
import requests
import json

# Configuración - Probando el nuevo proxy
PROXY_URL = "https://tuflotillauber.digital/api/proxy/auth?action=login"

# Datos del usuario
login_data = {
    "rfc": "LOCG901125JBA",
    "password": "LOZANO12"
}

print("=== PROBANDO PROXY DE AUTENTICACIÓN ===")
print(f"URL: {PROXY_URL}")
print(f"RFC: {login_data['rfc']}")
print(f"Contraseña: {login_data['password']}")

try:
    response = requests.post(
        PROXY_URL,
        headers={'Content-Type': 'application/json'},
        json=login_data,
        timeout=30
    )
    
    print(f"\n📡 Status Code: {response.status_code}")
    print(f"📄 Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ LOGIN EXITOSO VIA PROXY")
        print(f"🎉 ACCESO COMPLETO OTORGADO")
        print(f"   Usuario ID: {data.get('user', {}).get('id', 'N/A')}")
        print(f"   Nombre: {data.get('user', {}).get('nombre', 'N/A')}")
        print(f"   RFC: {data.get('user', {}).get('rfc', 'N/A')}")
        
        # Verificar token de acceso
        if 'token' in data:
            print(f"   Token: ✅ Generado")
        else:
            print(f"   Token: ❌ No encontrado")
            
    else:
        print("❌ LOGIN FALLÓ VIA PROXY")
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"❌ Error en la prueba de login via proxy: {e}")

print(f"\n🌐 El proxy debería resolver el problema de conexión")
print(f"📋 Ahora puedes intentar login en: https://tuflotillauber.digital")
print(f"   RFC: LOCG901125JBA")
print(f"   Contraseña: LOZANO12")
