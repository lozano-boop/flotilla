#!/usr/bin/env python3
import requests
import json

# Configuración
BASE_URL = "https://flotilla-manager-a395al66o-lozanos-projects-1f482492.vercel.app"
LOGIN_URL = f"{BASE_URL}/api/auth/login"

# Datos del usuario registrado
login_data = {
    "rfc": "LOCG901125JBA",
    "password": "LOZANO12"
}

print("=== PROBANDO LOGIN DEL USUARIO REGISTRADO ===")
print(f"RFC: {login_data['rfc']}")
print(f"Contraseña: {login_data['password']}")

try:
    # Test login
    response = requests.post(
        LOGIN_URL,
        headers={'Content-Type': 'application/json'},
        json=login_data,
        timeout=30
    )
    
    print(f"\n📡 Status Code: {response.status_code}")
    print(f"📄 Response: {response.text}")
    
    if response.status_code == 200:
        response_data = response.json()
        print("✅ LOGIN EXITOSO")
        print(f"🎉 ACCESO COMPLETO OTORGADO")
        print(f"   Usuario ID: {response_data.get('user', {}).get('id', 'N/A')}")
        print(f"   Nombre: {response_data.get('user', {}).get('nombre', 'N/A')}")
        print(f"   RFC: {response_data.get('user', {}).get('rfc', 'N/A')}")
        
        # Verificar token de acceso
        if 'token' in response_data:
            print(f"   Token: ✅ Generado")
        else:
            print(f"   Token: ❌ No encontrado")
            
    else:
        print("❌ LOGIN FALLÓ")
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"❌ Error en la prueba de login: {e}")

print(f"\n🌐 Puedes acceder al sistema en: https://tuflotillauber.digital")
print(f"📋 Usa las credenciales:")
print(f"   RFC: LOCG901125JBA")
print(f"   Contraseña: LOZANO12")
