---
name: claude-usage
description: >
  Check current Claude usage limits (session and weekly) with ASCII progress bars.
  Trigger when the user asks about usage, quota, limits, rate limits, how much Claude
  they've used, remaining capacity, or phrases like "check usage", "usage status",
  "how much quota left", "am I close to the limit", "用量", "额度", "配额".
---

# Usage — Claude Usage Monitor

Show the user their current Claude plan usage with ASCII progress bars.

## Workflow

### 1. Fetch usage data

```bash
curl -s http://localhost:1984/api/usage/claude
```

Parse the JSON response. The shape is:

```json
{
  "usage": {
    "five_hour": { "utilization": 9, "resets_at": "2026-03-15T12:00:00Z" },
    "seven_day": { "utilization": 40, "resets_at": "2026-03-20T14:00:00Z" },
    "extra_usage": { "is_enabled": false, ... }
  }
}
```

### 2. Build ASCII progress bar

For a given utilization percentage, render a 20-char wide bar:

- Filled char: `█`
- Empty char: `░`
- Formula: filled = round(utilization / 5), empty = 20 - filled

Example for 40%: `████████░░░░░░░░░░░░ 40%`

### 3. Format reset time

- For `five_hour.resets_at`: show relative time like "Resets in 3 hr 6 min"
- For `seven_day.resets_at`: show absolute time like "Resets Fri 2:00 PM"

### 4. Output

Present the result in this exact format:

```
Claude Usage

Session (5h rolling)
Resets in X hr Y min
████░░░░░░░░░░░░░░░░  20%

Weekly (7d rolling)
Resets Fri 2:00 PM
████████░░░░░░░░░░░░  40%

Extra usage: OFF
```

If extra usage is enabled, show `Extra usage: ON` instead.

### 5. Rules

- Keep output compact — no extra commentary unless the user asks.
- If utilization >= 80%, add a warning: `⚠ Running low!`
- If utilization >= 95%, add: `🚨 Almost depleted!`
- If the API call fails, tell the user the service is unreachable and suggest checking if the backend is running.
