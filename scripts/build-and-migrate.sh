#!/bin/bash
# build-and-migrate.sh
# Script para construir el proyecto y aplicar migraciones en producción

set -e

# 1. Instala dependencias
npm install

# 2. Construye el frontend y backend
npm run build

# 3. Aplica migraciones a la base de datos Neon
npx drizzle-kit migrate:pg

echo "Build y migraciones completadas. Listo para producción."
