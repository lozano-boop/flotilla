# FlotillaManager - Guía de Configuración

## Requisitos del Sistema

### Node.js y npm
- Node.js 18+ 
- npm 8+

### Python
- Python 3.12+
- Entorno virtual configurado

### Base de Datos
- PostgreSQL (para producción)
- SQLite (para desarrollo)

## Instalación

### 1. Clonar e instalar dependencias
```bash
cd FlotillaManager
npm install
```

### 2. Configurar entorno virtual Python
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configurar variables de entorno
Crear archivo `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/flotilla"
USER_RFC="XAXX010101000"
NODE_ENV="development"
```

### 4. Configurar base de datos
```bash
npm run db:push
```

### 5. Crear directorio de uploads
```bash
mkdir -p server/uploads
```

## Ejecutar el Proyecto

### Modo Desarrollo
```bash
npm run dev
```

### Modo Producción
```bash
npm run build
npm start
```

## Funcionalidades CFDI

### Scripts Python Disponibles
- `cfdi_to_cedula.py` - Procesamiento principal CFDI
- `cedula_iva.py` - Cálculos IVA
- `crear_tablas_isr.py` - Tablas ISR 2024
- `crear_papel_trabajo_anual.py` - Papel de trabajo anual
- `mejorar_papel_trabajo_fisco.py` - Fundamentos legales
- `procesar_retenciones.py` - Retenciones plataformas

### Uso de la Interfaz Web
1. Ir a "Papel de Trabajo" en el menú
2. Usar pestaña "Procesamiento CFDI" para subir XMLs/ZIPs
3. Configurar RFC del usuario
4. Ver resultados en pestaña "Cédula Fiscal"
5. Generar papel de trabajo anual

## Estructura de Archivos

```
FlotillaManager/
├── client/                 # Frontend React
├── server/                 # Backend Express
│   ├── services/
│   │   └── cfdi-processor.ts
│   └── routes.ts
├── scripts/               # Scripts Python
├── venv/                  # Entorno virtual Python
├── requirements.txt       # Dependencias Python
└── package.json          # Dependencias Node.js
```

## Solución de Problemas

### Error: "externally-managed-environment"
Usar entorno virtual Python:
```bash
python3 -m venv venv
source venv/bin/activate
```

### Error: Scripts Python no encontrados
Verificar que los scripts estén en `scripts/` y tengan permisos de ejecución.

### Error: Dependencias faltantes
```bash
npm install
source venv/bin/activate
pip install -r requirements.txt
```
