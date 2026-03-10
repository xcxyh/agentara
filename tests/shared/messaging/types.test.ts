import { describe, expect, test } from "bun:test";

import {
  AssistantMessage,
  Message,
  MessageRole,
  SystemMessage,
  TextMessageContent,
  ToolMessage,
  UserMessage,
} from "@/shared";

const base = { id: "msg-1", session_id: "sess-1" };

describe("MessageRole", () => {
  test("accepts valid roles", () => {
    const roles = ["system", "user", "assistant", "tool"] as const;
    for (const role of roles) {
      expect(MessageRole.parse(role)).toBe(role);
    }
  });

  test("rejects invalid role", () => {
    expect(() => MessageRole.parse("admin")).toThrow();
  });
});

describe("TextMessageContent", () => {
  test("parses valid text content", () => {
    const result = TextMessageContent.parse({ type: "text", text: "hello" });
    expect(result).toEqual({ type: "text", text: "hello" });
  });

  test("rejects missing text field", () => {
    expect(() => TextMessageContent.parse({ type: "text" })).toThrow();
  });
});

describe("UserMessage", () => {
  test("parses valid user message", () => {
    const input = {
      ...base,
      role: "user",
      content: [{ type: "text", text: "hi" }],
    };
    const result = UserMessage.parse(input);
    expect(result.role).toBe("user");
    expect(result.content).toHaveLength(1);
  });

  test("rejects user message with thinking content", () => {
    const input = {
      ...base,
      role: "user",
      content: [{ type: "thinking", thinking: "hmm" }],
    };
    expect(() => UserMessage.parse(input)).toThrow();
  });
});

describe("AssistantMessage", () => {
  test("parses assistant message with text and tool_use", () => {
    const input = {
      ...base,
      role: "assistant",
      content: [
        { type: "text", text: "sure" },
        { type: "tool_use", name: "Read", id: "tu-1", input: { file_path: "/a" } },
      ],
    };
    const result = AssistantMessage.parse(input);
    expect(result.content).toHaveLength(2);
  });

  test("parses assistant message with thinking", () => {
    const input = {
      ...base,
      role: "assistant",
      content: [{ type: "thinking", thinking: "let me think" }],
    };
    expect(AssistantMessage.parse(input).content[0]!.type).toBe("thinking");
  });
});

describe("SystemMessage", () => {
  test("parses valid system message", () => {
    const input = { ...base, role: "system", subtype: "info" };
    const result = SystemMessage.parse(input);
    expect(result.subtype).toBe("info");
  });

  test("rejects system message without subtype", () => {
    expect(() => SystemMessage.parse({ ...base, role: "system" })).toThrow();
  });
});

describe("ToolMessage", () => {
  test("parses valid tool message", () => {
    const input = {
      ...base,
      role: "tool",
      content: [{ type: "tool_result", tool_use_id: "tu-1", content: "ok" }],
    };
    const result = ToolMessage.parse(input);
    expect(result.content[0]!.type).toBe("tool_result");
  });
});

describe("Message (discriminated union)", () => {
  test("parses user message via discriminator", () => {
    const input = {
      ...base,
      role: "user",
      content: [{ type: "text", text: "hello" }],
    };
    const result = Message.parse(input);
    expect(result.role).toBe("user");
  });

  test("parses assistant message via discriminator", () => {
    const input = {
      ...base,
      role: "assistant",
      content: [{ type: "text", text: "hi" }],
    };
    const result = Message.parse(input);
    expect(result.role).toBe("assistant");
  });

  test("parses system message via discriminator", () => {
    const input = { ...base, role: "system", subtype: "error" };
    const result = Message.parse(input);
    expect(result.role).toBe("system");
  });

  test("parses tool message via discriminator", () => {
    const input = {
      ...base,
      role: "tool",
      content: [{ type: "tool_result", tool_use_id: "tu-1", content: "done" }],
    };
    const result = Message.parse(input);
    expect(result.role).toBe("tool");
  });

  test("rejects invalid role", () => {
    const input = { ...base, role: "unknown", content: [] };
    expect(() => Message.parse(input)).toThrow();
  });
});
