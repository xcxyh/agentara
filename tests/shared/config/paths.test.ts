import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import { config } from "@/shared";

const { paths } = config;

describe("config.paths", () => {
  test("sessions directory is under home", () => {
    expect(paths.sessions).toBe(join(paths.home, "sessions"));
  });

  test("memory directory is under home", () => {
    expect(paths.memory).toBe(join(paths.home, "memory"));
  });

  test("logs directory is under memory", () => {
    expect(paths.logs).toBe(join(paths.memory, "logs"));
  });

  test("workspace directory is under home", () => {
    expect(paths.workspace).toBe(join(paths.home, "workspace"));
  });

  test("data directory is under home", () => {
    expect(paths.data).toBe(join(paths.home, "data"));
  });

  test("resolveSessionFilePath returns correct path", () => {
    const result = paths.resolveSessionFilePath("abc-123");
    expect(result).toBe(join(paths.sessions, "abc-123.jsonl"));
  });

  test("resolveDailyLogFilePath returns date-formatted path", () => {
    const date = new Date("2025-06-15T12:00:00Z");
    const result = paths.resolveDailyLogFilePath(date);
    expect(result).toMatch(/2025-06-15\.md$/);
    expect(result.startsWith(paths.logs)).toBe(true);
  });

  test("resolveDataFilePath returns correct path", () => {
    const result = paths.resolveDataFilePath("db.sqlite");
    expect(result).toBe(join(paths.data, "db.sqlite"));
  });
});
