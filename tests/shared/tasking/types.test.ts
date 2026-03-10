import { describe, expect, test } from "bun:test";

import {
  CronjobTaskPayload,
  InboundMessageTaskPayload,
  Task,
  TaskPayload,
  TaskStatus,
} from "@/shared";

const userMessage = {
  id: "msg-1",
  session_id: "sess-1",
  role: "user" as const,
  content: [{ type: "text" as const, text: "hello" }],
};

describe("TaskStatus", () => {
  test("accepts valid statuses", () => {
    const statuses = ["pending", "running", "completed", "failed"] as const;
    for (const status of statuses) {
      expect(TaskStatus.parse(status)).toBe(status);
    }
  });

  test("rejects invalid status", () => {
    expect(() => TaskStatus.parse("cancelled")).toThrow();
  });
});

describe("InboundMessageTaskPayload", () => {
  test("parses valid payload", () => {
    const input = { type: "inbound_message", message: userMessage };
    const result = InboundMessageTaskPayload.parse(input);
    expect(result.type).toBe("inbound_message");
    expect(result.message.role).toBe("user");
  });

  test("rejects missing message", () => {
    expect(() =>
      InboundMessageTaskPayload.parse({ type: "inbound_message" }),
    ).toThrow();
  });
});

describe("CronjobTaskPayload", () => {
  test("parses valid payload", () => {
    const input = {
      type: "cronjob",
      instruction: "summarize news",
      cron_pattern: "0 9 * * *",
    };
    const result = CronjobTaskPayload.parse(input);
    expect(result.type).toBe("cronjob");
    expect(result.cron_pattern).toBe("0 9 * * *");
  });

  test("rejects missing instruction", () => {
    expect(() =>
      CronjobTaskPayload.parse({ type: "cronjob", cron_pattern: "* * * * *" }),
    ).toThrow();
  });
});

describe("TaskPayload (discriminated union)", () => {
  test("parses inbound_message variant", () => {
    const input = { type: "inbound_message", message: userMessage };
    const result = TaskPayload.parse(input);
    expect(result.type).toBe("inbound_message");
  });

  test("parses cronjob variant", () => {
    const input = {
      type: "cronjob",
      instruction: "run",
      cron_pattern: "0 * * * *",
    };
    const result = TaskPayload.parse(input);
    expect(result.type).toBe("cronjob");
  });

  test("rejects unknown type", () => {
    expect(() => TaskPayload.parse({ type: "webhook" })).toThrow();
  });
});

describe("Task", () => {
  const now = Date.now();

  test("parses valid task", () => {
    const input = {
      id: "task-1",
      session_id: "sess-1",
      type: "inbound_message",
      status: "pending",
      payload: { type: "inbound_message", message: userMessage },
      created_at: now,
      updated_at: now,
    };
    const result = Task.parse(input);
    expect(result.id).toBe("task-1");
    expect(result.status).toBe("pending");
  });

  test("rejects invalid status in task", () => {
    const input = {
      id: "task-1",
      session_id: "sess-1",
      type: "inbound_message",
      status: "cancelled",
      payload: { type: "inbound_message", message: userMessage },
      created_at: now,
      updated_at: now,
    };
    expect(() => Task.parse(input)).toThrow();
  });

  test("rejects missing required fields", () => {
    expect(() => Task.parse({ id: "task-1" })).toThrow();
  });
});
