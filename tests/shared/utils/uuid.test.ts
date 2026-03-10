import { describe, expect, test } from "bun:test";

import { uuid } from "@/shared";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("uuid", () => {
  test("returns a valid UUID v4 string", () => {
    const id = uuid();
    expect(id).toMatch(UUID_V4_REGEX);
  });

  test("returns unique values across multiple calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => uuid()));
    expect(ids.size).toBe(100);
  });
});
