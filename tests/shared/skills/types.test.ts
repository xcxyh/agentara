import { describe, expect, test } from "bun:test";

import { Skill } from "@/shared";

describe("Skill", () => {
  test("parses valid skill without license", () => {
    const input = {
      slug: "frontend-design",
      name: "Frontend Design",
      description: "Creates frontend interfaces",
    };
    const result = Skill.parse(input);
    expect(result.slug).toBe("frontend-design");
    expect(result.license).toBeUndefined();
  });

  test("parses valid skill with license", () => {
    const input = {
      slug: "my-skill",
      name: "My Skill",
      description: "Does things",
      license: "MIT",
    };
    const result = Skill.parse(input);
    expect(result.license).toBe("MIT");
  });

  test("rejects missing required fields", () => {
    expect(() => Skill.parse({ slug: "x" })).toThrow();
  });

  test("rejects invalid type for name", () => {
    expect(() =>
      Skill.parse({ slug: "x", name: 42, description: "d" }),
    ).toThrow();
  });
});
