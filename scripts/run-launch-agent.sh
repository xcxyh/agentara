#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="$PROJECT_DIR/.run/launchd"
LOG_DIR="$RUN_DIR/logs"
SERVER_BIN="$PROJECT_DIR/dist/bin/agentara"
BUN_BIN="${BUN_BIN:-}"

mkdir -p "$RUN_DIR" "$LOG_DIR"

add_to_path() {
  local candidate="$1"
  if [ -n "$candidate" ] && [ -d "$candidate" ]; then
    case ":$PATH:" in
      *":$candidate:"*) ;;
      *) PATH="$candidate:$PATH" ;;
    esac
  fi
}

for nvm_bin in "$HOME"/.nvm/versions/node/*/bin; do
  add_to_path "$nvm_bin"
done
add_to_path "$HOME/.bun/bin"
add_to_path "/opt/homebrew/bin"
add_to_path "/usr/local/bin"
export PATH

cd "$PROJECT_DIR"

if [ -z "$BUN_BIN" ]; then
  for candidate in \
    "$HOME/.bun/bin/bun" \
    "/opt/homebrew/bin/bun" \
    "/usr/local/bin/bun" \
    "$(command -v bun 2>/dev/null || true)"
  do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then
      BUN_BIN="$candidate"
      break
    fi
  done
fi

# The backend can run independently. Do not block startup on web asset builds.
# If you want static frontend hosting in production, build `web/dist` separately.

if [ -n "$BUN_BIN" ] && [ -x "$BUN_BIN" ]; then
  exec "$BUN_BIN" run index.ts
fi

if [ -x "$SERVER_BIN" ]; then
  exec "$SERVER_BIN"
fi

echo "No runnable Agentara server found."
echo "Install bun or build dist/bin/agentara first."
exit 1
