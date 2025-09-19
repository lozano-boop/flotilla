#!/usr/bin/env python3
import requests
import json

# Configuración - Probando diferentes URLs
urls_to_test = [
    "https://flotilla-manager-a395al66o-lozanos-projects-1f482492.vercel.app/api/auth/login",
    "https://tuflotillauber.digital/api/auth/login",
    "https://flotilla-manager.vercel.app/api/auth/login"
]

# Datos del usuario
login_data = {
    "rfc": "LOCG901125JBA",
    "password": "LOZANO12"
}

print("=== DIAGNÓSTICO DE CONEXIÓN LOGIN ===")
print(f"RFC: {login_data['rfc']}")
print(f"Contraseña: {login_data['password']}")

for i, url in enumerate(urls_to_test, 1):
    print(f"\n--- PRUEBA {i}: {url} ---")
    
    try:
        response = requests.post(
            url,
            headers={'Content-Type': 'application/json'},
            json=login_data,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ LOGIN EXITOSO")
            print(f"Response: {json.dumps(data, indent=2)}")
            break
        else:
            print(f"❌ Error: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT - La conexión tardó demasiado")
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR - No se pudo conectar")
    except requests.exceptions.RequestException as e:
        print(f"❌ REQUEST ERROR: {e}")
    except Exception as e:
        print(f"❌ ERROR GENERAL: {e}")

# Verificar si el problema es CORS
print(f"\n=== VERIFICACIÓN CORS ===")
try:
    # Hacer una petición OPTIONS para verificar CORS
    response = requests.options(
        "https://flotilla-manager-a395al66o-lozanos-projects-1f482492.vercel.app/api/auth/login",
        headers={
            'Origin': 'https://tuflotillauber.digital',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        },
        timeout=10
    )
    
    print(f"OPTIONS Status: {response.status_code}")
    print(f"CORS Headers: {dict(response.headers)}")
    
except Exception as e:
    print(f"❌ Error en verificación CORS: {e}")

print(f"\n=== RECOMENDACIONES ===")
print("1. Verificar que el dominio personalizado tenga acceso a las APIs")
print("2. Revisar configuración CORS en Vercel")
print("3. Verificar que las funciones serverless estén activas")
print("4. Considerar usar proxy interno para las APIs")
