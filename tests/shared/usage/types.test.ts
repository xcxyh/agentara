import { describe, expect, test } from "bun:test";

import { CodexUsageRecord, CodexUsageSummary } from "@/shared";

describe("CodexUsageRecord", () => {
  test("parses valid record", () => {
    const now = Date.now();
    const record = CodexUsageRecord.parse({
      id: "usage-1",
      agent_type: "codex",
      session_id: "session-1",
      runner_session_id: "thread-1",
      input_tokens: 12,
      cached_input_tokens: 3,
      output_tokens: 8,
      created_at: now,
    });

    expect(record.agent_type).toBe("codex");
    expect(record.input_tokens).toBe(12);
  });

  test("rejects negative token counts", () => {
    expect(() =>
      CodexUsageRecord.parse({
        id: "usage-1",
        agent_type: "codex",
        session_id: "session-1",
        runner_session_id: null,
        input_tokens: -1,
        cached_input_tokens: 0,
        output_tokens: 0,
        created_at: Date.now(),
      }),
    ).toThrow();
  });
});

describe("CodexUsageSummary", () => {
  test("parses valid summary", () => {
    const now = Date.now();
    const summary = CodexUsageSummary.parse({
      lifetime: {
        input_tokens: 100,
        cached_input_tokens: 20,
        output_tokens: 50,
      },
      recent_7d: {
        input_tokens: 30,
        cached_input_tokens: 10,
        output_tokens: 15,
      },
      last_updated_at: now,
    });

    expect(summary.recent_7d.output_tokens).toBe(15);
    expect(summary.last_updated_at).toBe(now);
  });
});
