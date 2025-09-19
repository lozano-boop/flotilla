#!/usr/bin/env python3
import requests
import json

# Configuración - Probando Netlify deployment
NETLIFY_URL = "https://flotilla-manager.netlify.app/api/auth-login"

# Datos del usuario
login_data = {
    "rfc": "LOCG901125JBA",
    "password": "LOZANO12"
}

print("=== PROBANDO LOGIN EN NETLIFY ===")
print(f"URL: {NETLIFY_URL}")
print(f"RFC: {login_data['rfc']}")
print(f"Contraseña: {login_data['password']}")

try:
    response = requests.post(
        NETLIFY_URL,
        headers={'Content-Type': 'application/json'},
        json=login_data,
        timeout=30
    )
    
    print(f"\n📡 Status Code: {response.status_code}")
    print(f"📄 Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ LOGIN EXITOSO EN NETLIFY")
        print(f"🎉 MIGRACIÓN COMPLETADA")
        print(f"   Usuario ID: {data.get('user', {}).get('id', 'N/A')}")
        print(f"   Nombre: {data.get('user', {}).get('nombre', 'N/A')}")
        print(f"   RFC: {data.get('user', {}).get('rfc', 'N/A')}")
        
    else:
        print("❌ LOGIN FALLÓ EN NETLIFY")
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"❌ Error en la prueba de login en Netlify: {e}")

print(f"\n🌐 FlotillaManager ahora está en Netlify:")
print(f"   URL: https://flotilla-manager.netlify.app")
print(f"   Credenciales: RFC LOCG901125JBA / Contraseña LOZANO12")
