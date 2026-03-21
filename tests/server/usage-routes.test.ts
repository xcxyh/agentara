import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, mock, test } from "bun:test";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe("usageRoutes", () => {
  test("returns Codex usage summary", async () => {
    const home = mkdtempSync(join(tmpdir(), "agentara-usage-route-"));
    tempDirs.push(home);
    mkdirSync(join(home, "data"), { recursive: true });
    mkdirSync(join(home, "sessions"), { recursive: true });
    mkdirSync(join(home, "memory", "logs"), { recursive: true });
    writeFileSync(
      join(home, "config.yaml"),
      `
timezone: Asia/Shanghai
agents:
  default:
    type: codex
    model: gpt-5
tasking:
  max_retries: 1
messaging:
  default_channel_id: default
  channels: []
`.trim(),
      "utf-8",
    );
    Bun.env.AGENTARA_HOME = home;

    const { kernel } = await import("@/kernel");
    const { usageRoutes } = await import("@/server/routes");
    const originalQueryCodexUsageSummary =
      kernel.sessionManager.queryCodexUsageSummary.bind(kernel.sessionManager);

    kernel.sessionManager.queryCodexUsageSummary = mock(() => ({
      lifetime: {
        input_tokens: 100,
        cached_input_tokens: 25,
        output_tokens: 50,
      },
      recent_7d: {
        input_tokens: 40,
        cached_input_tokens: 10,
        output_tokens: 20,
      },
      last_updated_at: 123456789,
    }));

    try {
      const response = await usageRoutes.request("http://localhost/codex");
      expect(response.status).toBe(200);

      const json = (await response.json()) as {
        usage: {
          lifetime: { input_tokens: number };
          recent_7d: { output_tokens: number };
          last_updated_at: number | null;
        };
      };

      expect(json.usage.lifetime.input_tokens).toBe(100);
      expect(json.usage.recent_7d.output_tokens).toBe(20);
      expect(json.usage.last_updated_at).toBe(123456789);
    } finally {
      kernel.sessionManager.queryCodexUsageSummary = originalQueryCodexUsageSummary;
    }
  });
});
