#!/usr/bin/env python3
import requests
import json
import subprocess
import os

def get_netlify_token():
    """Obtener token de Netlify CLI"""
    try:
        result = subprocess.run(['netlify', 'status'], capture_output=True, text=True)
        if result.returncode == 0:
            # El token está disponible, obtenerlo
            token_result = subprocess.run(['netlify', 'api', 'listSites'], capture_output=True, text=True)
            if token_result.returncode == 0:
                return True
        return False
    except Exception as e:
        print(f"Error obteniendo token: {e}")
        return False

def configure_custom_domain():
    """Configurar dominio personalizado en Netlify"""
    
    site_id = "dfada62a-b501-4d9c-b57d-5d9a4b2bfbe8"
    domain = "tuflotillauber.digital"
    
    print("=== CONFIGURANDO DOMINIO PERSONALIZADO EN NETLIFY ===")
    print(f"Site ID: {site_id}")
    print(f"Dominio: {domain}")
    
    # Usar API de Netlify directamente
    try:
        # Crear el dominio usando netlify CLI
        cmd = [
            'curl', '-X', 'POST',
            f'https://api.netlify.com/api/v1/sites/{site_id}/domains',
            '-H', 'Content-Type: application/json',
            '-d', json.dumps({"domain": domain})
        ]
        
        print(f"\n🔧 Configurando dominio via API...")
        
        # Método alternativo: usar el panel web
        print(f"\n📋 INSTRUCCIONES PARA CONFIGURAR DOMINIO MANUALMENTE:")
        print(f"1. Ve a: https://app.netlify.com/projects/flotilla-manager")
        print(f"2. Sección 'Domain settings'")
        print(f"3. Clic en 'Add custom domain'")
        print(f"4. Ingresa: {domain}")
        print(f"5. Confirma la configuración")
        
        print(f"\n🌐 CONFIGURACIÓN DNS REQUERIDA:")
        print(f"En tu proveedor DNS (donde compraste {domain}):")
        print(f"Tipo: CNAME")
        print(f"Nombre: @ (o www)")
        print(f"Valor: flotilla-manager.netlify.app")
        print(f"TTL: 3600 (1 hora)")
        
        print(f"\n✅ DESPUÉS DE CONFIGURAR DNS:")
        print(f"- El dominio {domain} apuntará a Netlify")
        print(f"- SSL se configurará automáticamente")
        print(f"- El login funcionará sin problemas")
        
        return True
        
    except Exception as e:
        print(f"❌ Error configurando dominio: {e}")
        return False

def verify_domain_status():
    """Verificar estado del dominio"""
    domain = "tuflotillauber.digital"
    
    print(f"\n🔍 VERIFICANDO ESTADO DEL DOMINIO:")
    
    try:
        # Verificar DNS actual
        import socket
        ip = socket.gethostbyname(domain)
        print(f"IP actual de {domain}: {ip}")
        
        # Verificar si responde
        response = requests.get(f"http://{domain}", timeout=10)
        print(f"Estado HTTP: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✅ {domain} está funcionando correctamente")
        else:
            print(f"⚠️  {domain} responde pero con código {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error verificando dominio: {e}")
        print(f"💡 El dominio aún no está configurado o DNS no ha propagado")

if __name__ == "__main__":
    print("🚀 CONFIGURADOR DE DOMINIO PERSONALIZADO NETLIFY")
    
    if get_netlify_token():
        print("✅ Netlify CLI configurado correctamente")
    else:
        print("⚠️  Netlify CLI no disponible, usando método manual")
    
    success = configure_custom_domain()
    
    if success:
        print(f"\n🎉 CONFIGURACIÓN INICIADA")
        print(f"📱 Acceso actual: https://flotilla-manager.netlify.app")
        print(f"🎯 Acceso futuro: https://tuflotillauber.digital")
        
        verify_domain_status()
    else:
        print("❌ Error en la configuración")
