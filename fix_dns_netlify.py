#!/usr/bin/env python3
import requests
import socket

def get_netlify_info():
    """Obtener información de Netlify para configuración DNS"""
    
    print("=== CONFIGURACIÓN DNS PARA NETLIFY ===")
    
    # Información del sitio Netlify
    site_url = "flotilla-manager.netlify.app"
    custom_domain = "tuflotillauber.digital"
    
    print(f"🎯 Sitio Netlify: {site_url}")
    print(f"🌐 Dominio personalizado: {custom_domain}")
    
    try:
        # Obtener IP de Netlify
        netlify_ip = socket.gethostbyname(site_url)
        print(f"📍 IP de Netlify: {netlify_ip}")
        
        # Estado actual del dominio
        current_ip = socket.gethostbyname(custom_domain)
        print(f"📍 IP actual del dominio: {current_ip}")
        
        if current_ip != netlify_ip:
            print(f"\n❌ PROBLEMA IDENTIFICADO:")
            print(f"   El dominio apunta a: {current_ip} (Vercel)")
            print(f"   Debe apuntar a: {netlify_ip} (Netlify)")
            
            print(f"\n🔧 SOLUCIÓN - ACTUALIZAR DNS:")
            print(f"En tu proveedor DNS (donde compraste {custom_domain}):")
            print(f"")
            print(f"OPCIÓN 1 - Registro A:")
            print(f"   Tipo: A")
            print(f"   Nombre: @ (o raíz)")
            print(f"   Valor: {netlify_ip}")
            print(f"   TTL: 3600")
            print(f"")
            print(f"OPCIÓN 2 - Registro CNAME (RECOMENDADO):")
            print(f"   Tipo: CNAME")
            print(f"   Nombre: @ (o www)")
            print(f"   Valor: {site_url}")
            print(f"   TTL: 3600")
            
        else:
            print(f"✅ DNS configurado correctamente")
            
    except Exception as e:
        print(f"❌ Error obteniendo información: {e}")

def check_netlify_deployment():
    """Verificar estado del deployment en Netlify"""
    
    print(f"\n🚀 VERIFICANDO DEPLOYMENT NETLIFY:")
    
    try:
        # Verificar si el sitio existe en Netlify
        response = requests.get("https://flotilla-manager.netlify.app", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 404:
            print(f"   ❌ Sitio no encontrado en Netlify")
            print(f"   💡 Posibles causas:")
            print(f"      - Deployment falló")
            print(f"      - Sitio no publicado")
            print(f"      - URL incorrecta")
            
            print(f"\n🔧 VERIFICAR EN NETLIFY:")
            print(f"   1. Ve a: https://app.netlify.com/projects/flotilla-manager")
            print(f"   2. Verifica que el sitio esté desplegado")
            print(f"   3. Revisa los logs de deployment")
            print(f"   4. Asegúrate que esté publicado")
            
        else:
            print(f"   ✅ Sitio funcionando en Netlify")
            
    except Exception as e:
        print(f"   ❌ Error verificando Netlify: {e}")

def provide_complete_solution():
    """Proporcionar solución completa"""
    
    print(f"\n" + "="*60)
    print(f"🎯 PLAN DE ACCIÓN COMPLETO:")
    print(f"")
    print(f"PASO 1 - VERIFICAR NETLIFY:")
    print(f"   • Ve a https://app.netlify.com/projects/flotilla-manager")
    print(f"   • Verifica que el sitio esté desplegado y funcionando")
    print(f"   • Si no está desplegado, hacer nuevo deploy")
    print(f"")
    print(f"PASO 2 - CONFIGURAR DOMINIO EN NETLIFY:")
    print(f"   • En Netlify panel → Domain settings")
    print(f"   • Add custom domain: tuflotillauber.digital")
    print(f"   • Netlify te dará instrucciones DNS específicas")
    print(f"")
    print(f"PASO 3 - ACTUALIZAR DNS:")
    print(f"   • En tu proveedor DNS cambiar:")
    print(f"   • De: A record → 76.76.21.21 (Vercel)")
    print(f"   • A: CNAME → flotilla-manager.netlify.app")
    print(f"")
    print(f"PASO 4 - ESPERAR PROPAGACIÓN:")
    print(f"   • DNS puede tardar 1-24 horas")
    print(f"   • Verificar con: nslookup tuflotillauber.digital")
    print(f"")
    print(f"🎉 RESULTADO FINAL:")
    print(f"   • tuflotillauber.digital → Netlify")
    print(f"   • APIs funcionando correctamente")
    print(f"   • Login sin problemas de conexión")

if __name__ == "__main__":
    print("🔍 DIAGNÓSTICO Y SOLUCIÓN DNS NETLIFY")
    
    get_netlify_info()
    check_netlify_deployment()
    provide_complete_solution()
