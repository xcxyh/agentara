#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <command> [args...]"
  exit 1
fi

PLIST_TARGET="$HOME/Library/LaunchAgents/com.agentara.server.plist"
SERVICE_LABEL="com.agentara.server"
SERVICE_TARGET="gui/$(id -u)/$SERVICE_LABEL"
SERVICE_WAS_RUNNING=false
SERVER_PORT="${AGENTARA_SERVICE_PORT:-1984}"

add_to_path() {
  local candidate="$1"
  if [ -n "$candidate" ] && [ -d "$candidate" ]; then
    case ":$PATH:" in
      *":$candidate:"*) ;;
      *) PATH="$candidate:$PATH" ;;
    esac
  fi
}

resolve_bun() {
  for candidate in \
    "$HOME/.bun/bin/bun" \
    "/opt/homebrew/bin/bun" \
    "/usr/local/bin/bun" \
    "$(command -v bun 2>/dev/null || true)"
  do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then
      echo "$candidate"
      return 0
    fi
  done

  return 1
}

add_to_path "$HOME/.bun/bin"
add_to_path "/opt/homebrew/bin"
add_to_path "/usr/local/bin"
export PATH

is_service_running() {
  launchctl print "$SERVICE_TARGET" >/dev/null 2>&1
}

is_port_in_use() {
  lsof -ti "tcp:$1" >/dev/null 2>&1
}

wait_for_port_release() {
  local port="$1"
  local attempts=20

  for _ in $(seq 1 "$attempts"); do
    if ! is_port_in_use "$port"; then
      return 0
    fi
    sleep 0.5
  done

  echo "Timed out waiting for port $port to be released."
  return 1
}

pause_service() {
  if [ ! -f "$PLIST_TARGET" ]; then
    return
  fi

  if ! is_service_running; then
    return
  fi

  echo "Pausing launchd service: $SERVICE_LABEL"
  launchctl unload "$PLIST_TARGET" >/dev/null 2>&1 || true
  SERVICE_WAS_RUNNING=true
  wait_for_port_release "$SERVER_PORT"
}

resume_service() {
  if [ "$SERVICE_WAS_RUNNING" != true ]; then
    return
  fi

  if [ ! -f "$PLIST_TARGET" ]; then
    return
  fi

  echo "Resuming launchd service: $SERVICE_LABEL"
  launchctl load "$PLIST_TARGET" >/dev/null 2>&1 || true
  launchctl kickstart -k "$SERVICE_TARGET" >/dev/null 2>&1 || true
}

cleanup() {
  local exit_code=$?
  resume_service
  exit "$exit_code"
}

trap cleanup EXIT INT TERM

pause_service

if [ "${1:-}" = "bun" ]; then
  BUN_BIN="$(resolve_bun || true)"
  if [ -z "${BUN_BIN:-}" ]; then
    echo "bun was not found in PATH."
    exit 1
  fi
  shift
  set -- "$BUN_BIN" "$@"
fi

echo "Running local command: $*"
"$@"
