#!/bin/bash
# start-production.sh
# Script para iniciar el servidor en modo producción

set -e

# Carga variables de entorno si existe el archivo
if [ -f .env.production ]; then
  export $(cat .env.production | grep -v "^#" | xargs)
fi

# Inicia el servidor
npm run start
