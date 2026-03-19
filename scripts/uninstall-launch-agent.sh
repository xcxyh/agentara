#!/usr/bin/env bash
set -euo pipefail

PLIST_TARGET="$HOME/Library/LaunchAgents/com.agentara.server.plist"

if [ -f "$PLIST_TARGET" ]; then
  launchctl unload "$PLIST_TARGET" >/dev/null 2>&1 || true
  rm -f "$PLIST_TARGET"
  echo "Removed launch agent: $PLIST_TARGET"
else
  echo "Launch agent not installed: $PLIST_TARGET"
fi
