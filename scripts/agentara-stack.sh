#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="$PROJECT_DIR/.run"
LOG_DIR="$RUN_DIR/logs"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_TEMPLATE="$PROJECT_DIR/scripts/com.agentara.server.plist"
PLIST_TARGET="$LAUNCH_AGENTS_DIR/com.agentara.server.plist"
SERVICE_LABEL="com.agentara.server"
SERVICE_TARGET="gui/$(id -u)/$SERVICE_LABEL"
BACKEND_PORT="${AGENTARA_SERVICE_PORT:-1984}"
FRONTEND_PORT="${AGENTARA_WEB_PORT:-8000}"
FRONTEND_PID_FILE="$RUN_DIR/dev-web.pid"
FRONTEND_LOG_FILE="$LOG_DIR/dev-web.log"
FRONTEND_HOST="${AGENTARA_WEB_HOST:-0.0.0.0}"

mkdir -p "$RUN_DIR" "$LOG_DIR" "$LAUNCH_AGENTS_DIR"

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

  echo "bun was not found in PATH." >&2
  return 1
}

is_port_in_use() {
  lsof -ti "tcp:$1" >/dev/null 2>&1
}

wait_for_port_release() {
  local port="$1"
  local attempts="${2:-20}"

  for _ in $(seq 1 "$attempts"); do
    if ! is_port_in_use "$port"; then
      return 0
    fi
    sleep 0.5
  done

  echo "Timed out waiting for port $port to be released." >&2
  return 1
}

is_backend_running() {
  launchctl print "$SERVICE_TARGET" >/dev/null 2>&1
}

ensure_launch_agent() {
  sed "s#__PROJECT_DIR__#$PROJECT_DIR#g" "$PLIST_TEMPLATE" > "$PLIST_TARGET"
}

load_backend_service() {
  ensure_launch_agent
  launchctl unload "$PLIST_TARGET" >/dev/null 2>&1 || true
  launchctl load "$PLIST_TARGET"
  launchctl kickstart -k "$SERVICE_TARGET" >/dev/null 2>&1 || true
}

stop_backend_service() {
  if [ ! -f "$PLIST_TARGET" ]; then
    return 0
  fi

  launchctl unload "$PLIST_TARGET" >/dev/null 2>&1 || true
  wait_for_port_release "$BACKEND_PORT"
}

read_frontend_pid() {
  if [ ! -f "$FRONTEND_PID_FILE" ]; then
    return 1
  fi

  local pid
  pid="$(cat "$FRONTEND_PID_FILE" 2>/dev/null || true)"
  if [ -z "$pid" ]; then
    rm -f "$FRONTEND_PID_FILE"
    return 1
  fi

  echo "$pid"
}

is_managed_frontend_pid() {
  local pid="$1"
  local cwd

  if ! kill -0 "$pid" 2>/dev/null; then
    return 1
  fi

  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1)"
  [ "$cwd" = "$PROJECT_DIR/web" ]
}

frontend_pid_if_running() {
  local pid
  pid="$(read_frontend_pid || true)"
  if [ -z "$pid" ]; then
    return 1
  fi

  if is_managed_frontend_pid "$pid"; then
    echo "$pid"
    return 0
  fi

  rm -f "$FRONTEND_PID_FILE"
  return 1
}

start_frontend() {
  local existing_pid
  existing_pid="$(frontend_pid_if_running || true)"
  if [ -n "$existing_pid" ]; then
    echo "Frontend dev server already running (PID: $existing_pid)."
    return 0
  fi

  local bun_bin
  bun_bin="$(resolve_bun)"

  nohup bash -lc 'cd "$1" && exec "$2" run dev -- --host "$3" --port "$4"' bash "$PROJECT_DIR/web" "$bun_bin" "$FRONTEND_HOST" "$FRONTEND_PORT" >"$FRONTEND_LOG_FILE" 2>&1 &
  local pid=$!
  echo "$pid" > "$FRONTEND_PID_FILE"

  sleep 1
  if ! is_managed_frontend_pid "$pid"; then
    rm -f "$FRONTEND_PID_FILE"
    echo "Frontend dev server failed to start. Check $FRONTEND_LOG_FILE" >&2
    return 1
  fi

  echo "Frontend dev server started (PID: $pid)."
}

stop_frontend() {
  local pid
  pid="$(frontend_pid_if_running || true)"

  if [ -z "$pid" ]; then
    echo "Frontend dev server is not running."
    rm -f "$FRONTEND_PID_FILE"
    return 0
  fi

  kill "$pid" >/dev/null 2>&1 || true

  for _ in $(seq 1 20); do
    if ! kill -0 "$pid" 2>/dev/null; then
      break
    fi
    sleep 0.5
  done

  if kill -0 "$pid" 2>/dev/null; then
    kill -9 "$pid" >/dev/null 2>&1 || true
    sleep 0.5
  fi

  rm -f "$FRONTEND_PID_FILE"
  wait_for_port_release "$FRONTEND_PORT" 10 || true

  if kill -0 "$pid" 2>/dev/null; then
    echo "Failed to stop frontend dev server (PID: $pid)." >&2
    return 1
  fi

  echo "Frontend dev server stopped."
}

print_logs() {
  echo "Logs:"
  echo "  backend stdout: $PROJECT_DIR/.run/launchd/logs/launchd.stdout.log"
  echo "  backend stderr: $PROJECT_DIR/.run/launchd/logs/launchd.stderr.log"
  echo "  frontend: $FRONTEND_LOG_FILE"
}

start_stack() {
  load_backend_service
  echo "Backend service started."
  start_frontend
  print_logs
}

stop_stack() {
  stop_backend_service
  echo "Backend service stopped."
  stop_frontend
}

run_local() {
  stop_stack
  wait_for_port_release "$BACKEND_PORT"
  wait_for_port_release "$FRONTEND_PORT"
  echo "Starting local test mode with bun run dev."
  cd "$PROJECT_DIR"
  exec "$(resolve_bun)" run dev
}

print_status() {
  local backend_status="stopped"
  local frontend_status="stopped"
  local frontend_pid=""

  if is_backend_running; then
    backend_status="running"
  fi

  frontend_pid="$(frontend_pid_if_running || true)"
  if [ -n "$frontend_pid" ]; then
    frontend_status="running (PID: $frontend_pid)"
  fi

  echo "Backend service: $backend_status"
  echo "Frontend dev server: $frontend_status"
  print_logs
}

usage() {
  cat <<EOF
Usage: $0 <command>

Commands:
  start    Start backend service and frontend dev server
  stop     Stop backend service and frontend dev server
  restart  Restart backend service and frontend dev server
  local    Stop service mode and run bun run dev in foreground
  status   Show backend/frontend status
EOF
}

add_to_path "$HOME/.bun/bin"
add_to_path "/opt/homebrew/bin"
add_to_path "/usr/local/bin"
export PATH

case "${1:-}" in
  start)
    start_stack
    ;;
  stop)
    stop_stack
    ;;
  restart)
    stop_stack
    start_stack
    ;;
  local)
    run_local
    ;;
  status)
    print_status
    ;;
  *)
    usage >&2
    exit 1
    ;;
esac
