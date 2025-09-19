#!/usr/bin/env python3

def show_netlify_dns_values():
    """Mostrar valores DNS correctos para Netlify"""
    
    print("🌐 VALORES DNS PARA NETLIFY - GODADDY")
    print("="*50)
    
    print("\n✅ REGISTRO ELIMINADO CORRECTAMENTE:")
    print("   Tipo: A")
    print("   Valor: 76.76.21.21 (Vercel) ❌ ELIMINADO")
    
    print("\n🎯 VALORES A AGREGAR EN GODADDY:")
    print("="*50)
    
    print("\nOPCIÓN 1 - CNAME (RECOMENDADO):")
    print("   Tipo: CNAME")
    print("   Host: @ (o www)")
    print("   Apunta a: flotilla-manager.netlify.app")
    print("   TTL: 1 hora (3600)")
    
    print("\nOPCIÓN 2 - REGISTROS A (ALTERNATIVO):")
    print("   Registro A #1:")
    print("   - Tipo: A")
    print("   - Host: @")
    print("   - Valor: 13.52.188.95")
    print("   - TTL: 1 hora")
    print("")
    print("   Registro A #2:")
    print("   - Tipo: A") 
    print("   - Host: @")
    print("   - Valor: 52.52.192.191")
    print("   - TTL: 1 hora")
    
    print("\n🔧 PASOS EN GODADDY:")
    print("="*50)
    print("1. Ve a: https://dcc.godaddy.com/manage/dns")
    print("2. Busca tu dominio: tuflotillauber.digital")
    print("3. Clic en 'Administrar' o 'Manage'")
    print("4. En la sección DNS:")
    print("")
    print("   AGREGAR NUEVO REGISTRO:")
    print("   ┌─────────────────────────────────────┐")
    print("   │ Tipo: CNAME                         │")
    print("   │ Host: @                             │")
    print("   │ Apunta a: flotilla-manager.netlify.app │")
    print("   │ TTL: 1 hora                         │")
    print("   └─────────────────────────────────────┘")
    print("")
    print("5. Clic en 'Guardar' o 'Save'")
    print("6. Esperar propagación (30 min - 24 horas)")

def show_verification_commands():
    """Mostrar comandos de verificación"""
    
    print("\n🔍 VERIFICAR CAMBIOS DNS:")
    print("="*50)
    print("Después de guardar en GoDaddy, usa estos comandos:")
    print("")
    print("# Verificar DNS actual:")
    print("nslookup tuflotillauber.digital")
    print("")
    print("# Verificar con script automático:")
    print("python3 verify_migration.py")
    print("")
    print("# Probar acceso directo:")
    print("curl -I https://tuflotillauber.digital")

def show_expected_results():
    """Mostrar resultados esperados"""
    
    print("\n✅ RESULTADOS ESPERADOS:")
    print("="*50)
    print("Cuando el DNS esté actualizado verás:")
    print("")
    print("IP de tuflotillauber.digital:")
    print("   13.52.188.95 o 52.52.192.191")
    print("")
    print("Acceso web:")
    print("   https://tuflotillauber.digital → ✅ 200 OK")
    print("")
    print("Login funcionando:")
    print("   RFC: LOCG901125JBA")
    print("   Contraseña: LOZANO12")
    print("   → ✅ Acceso exitoso")

def main():
    print("🚀 CONFIGURACIÓN DNS NETLIFY PARA GODADDY")
    
    show_netlify_dns_values()
    show_verification_commands() 
    show_expected_results()
    
    print("\n" + "="*50)
    print("📋 RESUMEN:")
    print("1. ✅ Vercel eliminado correctamente")
    print("2. 🔧 Agregar CNAME a Netlify")
    print("3. ⏰ Esperar propagación")
    print("4. ✅ Verificar funcionamiento")
    
    print("\n📱 ACCESO TEMPORAL:")
    print("https://flotilla-manager.netlify.app")

if __name__ == "__main__":
    main()
