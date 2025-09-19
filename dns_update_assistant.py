#!/usr/bin/env python3
import webbrowser
import time

def open_netlify_panel():
    """Abrir panel de Netlify para configurar dominio"""
    print("🚀 ABRIENDO PANEL DE NETLIFY...")
    
    netlify_url = "https://app.netlify.com/projects/flotilla-manager"
    
    try:
        webbrowser.open(netlify_url)
        print(f"✅ Panel abierto en navegador: {netlify_url}")
        return True
    except Exception as e:
        print(f"❌ Error abriendo navegador: {e}")
        print(f"📋 Abre manualmente: {netlify_url}")
        return False

def show_netlify_steps():
    """Mostrar pasos específicos en Netlify"""
    print("\n" + "="*60)
    print("📋 PASOS EN PANEL DE NETLIFY")
    print("="*60)
    
    steps = [
        "1. Busca 'Domain settings' en el menú lateral izquierdo",
        "2. Clic en 'Add custom domain' (botón verde)",
        "3. Ingresa exactamente: tuflotillauber.digital",
        "4. Clic en 'Verify' para verificar el dominio",
        "5. Clic en 'Add domain' para confirmar",
        "6. Netlify mostrará instrucciones DNS específicas",
        "7. Copia las instrucciones DNS que te muestre"
    ]
    
    for step in steps:
        print(f"   {step}")
        
    print(f"\n💡 IMPORTANTE:")
    print(f"   • Netlify detectará que el dominio ya existe")
    print(f"   • Te pedirá confirmar que eres el propietario")
    print(f"   • Te dará instrucciones DNS específicas para tu caso")

def show_dns_providers_guide():
    """Mostrar guía detallada por proveedor DNS"""
    print(f"\n🌐 GUÍA DETALLADA POR PROVEEDOR DNS")
    print("="*60)
    
    providers = {
        "GoDaddy": {
            "url": "https://dcc.godaddy.com/manage/dns",
            "steps": [
                "1. Ve a GoDaddy.com → Iniciar sesión",
                "2. Mi cuenta → Mis productos → Dominios",
                "3. Busca 'tuflotillauber.digital' → Administrar",
                "4. Pestaña 'DNS' → Administrar zonas DNS",
                "5. ELIMINAR registro A existente (76.76.21.21)",
                "6. AGREGAR nuevo CNAME:",
                "   - Tipo: CNAME",
                "   - Host: @ (o www)",
                "   - Apunta a: flotilla-manager.netlify.app",
                "   - TTL: 1 hora",
                "7. Guardar cambios"
            ]
        },
        "Cloudflare": {
            "url": "https://dash.cloudflare.com",
            "steps": [
                "1. Ve a Cloudflare.com → Iniciar sesión",
                "2. Selecciona dominio 'tuflotillauber.digital'",
                "3. Pestaña 'DNS' → Registros DNS",
                "4. ELIMINAR registro A existente (76.76.21.21)",
                "5. AGREGAR nuevo CNAME:",
                "   - Tipo: CNAME",
                "   - Nombre: @ (o www)",
                "   - Destino: flotilla-manager.netlify.app",
                "   - Proxy: Desactivado (nube gris)",
                "   - TTL: Auto",
                "6. Guardar"
            ]
        },
        "Namecheap": {
            "url": "https://ap.www.namecheap.com/domains/list",
            "steps": [
                "1. Ve a Namecheap.com → Iniciar sesión",
                "2. Domain List → Busca tu dominio",
                "3. Clic en 'Manage' → Advanced DNS",
                "4. ELIMINAR registro A existente",
                "5. AGREGAR nuevo CNAME:",
                "   - Tipo: CNAME Record",
                "   - Host: @ (o www)",
                "   - Value: flotilla-manager.netlify.app",
                "   - TTL: Automatic",
                "6. Guardar todos los cambios"
            ]
        }
    }
    
    for provider, info in providers.items():
        print(f"\n🏢 {provider.upper()}:")
        print(f"   URL: {info['url']}")
        for step in info['steps']:
            print(f"   {step}")

def create_verification_checklist():
    """Crear checklist de verificación"""
    print(f"\n✅ CHECKLIST DE VERIFICACIÓN")
    print("="*60)
    
    checklist = [
        "□ Configuré dominio en panel de Netlify",
        "□ Eliminé registro A de Vercel (76.76.21.21)",
        "□ Agregué CNAME a Netlify (flotilla-manager.netlify.app)",
        "□ Guardé cambios en proveedor DNS",
        "□ Esperé al menos 30 minutos",
        "□ Verifiqué con: python3 verify_migration.py",
        "□ Probé acceso: https://tuflotillauber.digital",
        "□ Probé login con credenciales"
    ]
    
    for item in checklist:
        print(f"   {item}")
    
    print(f"\n⏰ TIEMPO ESTIMADO:")
    print(f"   • Configuración: 10-15 minutos")
    print(f"   • Propagación DNS: 30 minutos - 24 horas")
    print(f"   • Verificación: 5 minutos")

def main():
    print("🔄 ASISTENTE DE MIGRACIÓN DNS - VERCEL → NETLIFY")
    print("="*60)
    
    print(f"\n📊 ESTADO ACTUAL:")
    print(f"   • Netlify: ✅ Funcionando (https://flotilla-manager.netlify.app)")
    print(f"   • DNS actual: 🔴 Apunta a Vercel (76.76.21.21)")
    print(f"   • Objetivo: 🎯 Cambiar a Netlify")
    
    # Abrir panel de Netlify
    print(f"\n🚀 PASO 1: CONFIGURAR EN NETLIFY")
    open_netlify_panel()
    
    # Mostrar pasos en Netlify
    show_netlify_steps()
    
    # Esperar confirmación del usuario
    print(f"\n⏸️  PAUSA: Completa la configuración en Netlify")
    input("Presiona ENTER cuando hayas configurado el dominio en Netlify...")
    
    # Mostrar guía DNS
    print(f"\n🚀 PASO 2: ACTUALIZAR DNS")
    show_dns_providers_guide()
    
    # Mostrar checklist
    create_verification_checklist()
    
    print(f"\n🎯 PRÓXIMOS PASOS:")
    print(f"1. Completa la configuración DNS")
    print(f"2. Ejecuta: python3 verify_migration.py")
    print(f"3. Espera la propagación DNS")
    print(f"4. ¡Disfruta tu sitio en Netlify!")
    
    print(f"\n📱 ACCESO TEMPORAL:")
    print(f"URL: https://flotilla-manager.netlify.app")
    print(f"Usuario: LOCG901125JBA / Contraseña: LOZANO12")

if __name__ == "__main__":
    main()
