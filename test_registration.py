import requests
import json

# Configuración
BASE_URL = "https://flotilla-manager-a395al66o-lozanos-projects-1f482492.vercel.app"
REGISTER_URL = f"{BASE_URL}/api/auth/register"
LOGIN_URL = f"{BASE_URL}/api/auth/login"

# Datos de prueba - USUARIO CON ACCESO COMPLETO
test_user = {
    "nombre": "GILBERTO MISAEL LOZANO CORONADO",
    "rfc": "LOCG901125JBA", 
    "password": "LOZANO12"
}

print("=== PROBANDO REGISTRO DE USUARIO ===")
print(f"Nombre: {test_user['nombre']}")
print(f"RFC: {test_user['rfc']}")
print(f"Contraseña: {test_user['password']}")

try:
    # Test registration
    response = requests.post(
        'https://flotilla-manager-a395al66o-lozanos-projects-1f482492.vercel.app/api/auth/register',
        headers={'Content-Type': 'application/json'},
        json=test_user,
        timeout=30
    )
    
    print(f"\n📡 Status Code: {response.status_code}")
    print(f"📄 Response: {response.text}")
    
    if response.status_code == 200:
        print("✅ REGISTRO EXITOSO")
        
        # Test login
        print("\n=== PROBANDO LOGIN ===")
        login_data = {
            "rfc": test_user['rfc'],
            "password": test_user['password']
        }
        
        login_response = requests.post(
            'https://flotilla-manager-a395al66o-lozanos-projects-1f482492.vercel.app/api/auth/login',
            headers={'Content-Type': 'application/json'},
            json=login_data,
            timeout=30
        )
        
        print(f"📡 Login Status: {login_response.status_code}")
        print(f"📄 Login Response: {login_response.text}")
        
        if login_response.status_code == 200:
            print("✅ LOGIN EXITOSO")
        else:
            print("❌ LOGIN FALLÓ")
    else:
        print("❌ REGISTRO FALLÓ")
        
except Exception as e:
    print(f"❌ Error en la prueba: {e}")
