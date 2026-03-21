# Local 24x7 Deployment

Run Agentara as a macOS `launchd` service.

## What it does

- Starts Agentara on login
- Restarts it if it exits
- Serves the API on `http://0.0.0.0:1984`
- Starts the frontend Vite dev server on `http://0.0.0.0:8000`

## Install

```bash
bun run service:start
```

## Logs

```bash
tail -f .run/launchd/logs/launchd.stdout.log
tail -f .run/launchd/logs/launchd.stderr.log
tail -f .run/logs/dev-web.log
```

## Restart

```bash
bun run service:restart
```

## Status

```bash
bun run service:status
```

## Pause for local testing

Use this command when you want to stop service mode and run the local stack.

```bash
bun run service:local
```

This command stops the background service first. It does not restore it automatically when the local process exits.

## Remove

```bash
bun run service:stop
./scripts/uninstall-launch-agent.sh
```

## Keep the Mac awake

- Plug the Mac into power
- Disable automatic sleep in macOS settings
- If needed, run `caffeinate -dimsu`

## Notes

- `launchd` starts after user login
- If you want remote access, pair this with Tailscale or a tunnel
- Re-run `bun run service:start` after changing the plist template
