#!/usr/bin/env bash
set -euo pipefail

# Resolve project root (this script is in scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Ensure .env is loaded if present
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs -d '\n' -I {} echo {}) || true
fi

# Build and start in background
if command -v docker-compose >/dev/null 2>&1; then
  docker-compose up -d --build
else
  docker compose up -d --build
fi

# Wait a bit then open browser
sleep 2
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open http://localhost >/dev/null 2>&1 &
fi

echo "FlotillaManager iniciado. Visita http://localhost"
