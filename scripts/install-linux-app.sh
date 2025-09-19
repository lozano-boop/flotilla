#!/usr/bin/env bash
set -euo pipefail

# This installer registers a desktop launcher and a systemd --user service
# for FlotillaManager that starts the Docker stack and opens the browser.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
APP_NAME="FlotillaManager"
DESKTOP_FILE="$HOME/.local/share/applications/flotilla-manager.desktop"
SYSTEMD_DIR="$HOME/.config/systemd/user"
SERVICE_FILE="$SYSTEMD_DIR/flotilla-manager.service"
START_SCRIPT="$PROJECT_ROOT/scripts/flotilla-start.sh"

mkdir -p "$HOME/.local/share/applications"
mkdir -p "$SYSTEMD_DIR"

# Ensure start script is executable
chmod +x "$START_SCRIPT"

# Create Desktop Entry
cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Type=Application
Name=$APP_NAME
Comment=Inicia FlotillaManager (Docker + Caddy)
Exec=$START_SCRIPT
Icon=utilities-system
Terminal=false
Categories=Utility;Network;
StartupWMClass=FlotillaManager
EOF

# Create systemd --user service (auto-start at login)
cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=$APP_NAME (Docker stack)
After=default.target

[Service]
Type=oneshot
RemainAfterExit=true
WorkingDirectory=$PROJECT_ROOT
ExecStart=/bin/sh -c 'which docker-compose >/dev/null 2>&1 && docker-compose up -d || docker compose up -d'
ExecStop=/bin/sh -c 'which docker-compose >/dev/null 2>&1 && docker-compose down || docker compose down'
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
EOF

# Reload and enable service
systemctl --user daemon-reload
systemctl --user enable --now flotilla-manager.service || true

# Update desktop database (optional)
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$HOME/.local/share/applications" || true
fi

echo "Instalación completada."
echo "- Lanzador: $DESKTOP_FILE"
echo "- Servicio de usuario: $SERVICE_FILE"
echo "Puedes encontrar el app en tu menú de aplicaciones como '$APP_NAME'."
