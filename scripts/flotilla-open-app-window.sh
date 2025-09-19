#!/usr/bin/env bash
set -euo pipefail

# Ensure stack is up (reuses the start script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/flotilla-start.sh" >/dev/null 2>&1 || true

URL="http://localhost"

# Prefer Chromium/Chrome app window with optimized settings for desktop app experience
if command -v chromium >/dev/null 2>&1; then
  nohup chromium \
    --new-window \
    --app="$URL" \
    --disable-web-security \
    --disable-features=TranslateUI \
    --disable-extensions \
    --disable-plugins \
    --disable-default-apps \
    --no-first-run \
    --window-size=1400,900 \
    --window-position=100,50 \
    >/dev/null 2>&1 &
elif command -v google-chrome >/dev/null 2>&1; then
  nohup google-chrome \
    --new-window \
    --app="$URL" \
    --disable-web-security \
    --disable-features=TranslateUI \
    --disable-extensions \
    --disable-plugins \
    --disable-default-apps \
    --no-first-run \
    --window-size=1400,900 \
    --window-position=100,50 \
    >/dev/null 2>&1 &
elif command -v brave-browser >/dev/null 2>&1; then
  nohup brave-browser \
    --new-window \
    --app="$URL" \
    --disable-web-security \
    --disable-features=TranslateUI \
    --disable-extensions \
    --disable-plugins \
    --disable-default-apps \
    --no-first-run \
    --window-size=1400,900 \
    --window-position=100,50 \
    >/dev/null 2>&1 &
else
  # Fallback to default browser
  if command -v xdg-open >/dev/null 2>&1; then
    nohup xdg-open "$URL" >/dev/null 2>&1 &
  fi
fi

echo "Abriendo FlotillaManager en ventana de aplicación optimizada: $URL"
