#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLIST_TEMPLATE="$PROJECT_DIR/scripts/com.agentara.server.plist"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_TARGET="$LAUNCH_AGENTS_DIR/com.agentara.server.plist"
SERVER_BIN="$PROJECT_DIR/dist/bin/agentara"

mkdir -p "$LAUNCH_AGENTS_DIR"

sed "s#__PROJECT_DIR__#$PROJECT_DIR#g" "$PLIST_TEMPLATE" > "$PLIST_TARGET"

launchctl unload "$PLIST_TARGET" >/dev/null 2>&1 || true
launchctl load "$PLIST_TARGET"

if [ -x "$SERVER_BIN" ]; then
  launchctl kickstart -k "gui/$(id -u)/com.agentara.server"
  echo "Service started."
else
  echo "Launch agent installed, but service was not started yet."
  echo "Build $SERVER_BIN first, then run:"
  echo "  launchctl kickstart -k gui/$(id -u)/com.agentara.server"
fi

echo "Installed launch agent: $PLIST_TARGET"
echo "Logs:"
echo "  stdout: $PROJECT_DIR/.run/launchd/logs/launchd.stdout.log"
echo "  stderr: $PROJECT_DIR/.run/launchd/logs/launchd.stderr.log"
