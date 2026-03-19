# Local 24x7 Deployment

Run Agentara as a macOS `launchd` service.

## What it does

- Starts Agentara on login
- Restarts it if it exits
- Serves the API on `http://0.0.0.0:1984`
- Serves the built web app from `web/dist` in production mode

## Install

```bash
bun run build:bin
cd web && bun run build:js
cd ..
./scripts/install-launch-agent.sh
```

## Logs

```bash
tail -f .run/launchd/logs/launchd.stdout.log
tail -f .run/launchd/logs/launchd.stderr.log
```

## Restart

```bash
launchctl kickstart -k "gui/$(id -u)/com.agentara.server"
```

## Remove

```bash
./scripts/uninstall-launch-agent.sh
```

## Keep the Mac awake

- Plug the Mac into power
- Disable automatic sleep in macOS settings
- If needed, run `caffeinate -dimsu`

## Notes

- `launchd` starts after user login
- If you want remote access, pair this with Tailscale or a tunnel
- Re-run the install script after changing the plist template
