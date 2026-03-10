import { describe, expect, test } from "bun:test";

import {
  containsThinking,
  containsToolUse,
  extractTextContent,
  isPureTextMessage,
} from "@/shared";
import type { Message } from "@/shared";

const base = { id: "msg-1", session_id: "sess-1" } as const;

describe("isPureTextMessage", () => {
  test("returns true for user message with only text content", () => {
    const msg: Message = {
      ...base,
      role: "user",
      content: [{ type: "text", text: "hello" }],
    };
    expect(isPureTextMessage(msg)).toBe(true);
  });

  test("returns true for assistant message with only text content", () => {
    const msg: Message = {
      ...base,
      role: "assistant",
      content: [{ type: "text", text: "hi" }],
    };
    expect(isPureTextMessage(msg)).toBe(true);
  });

  test("returns false for assistant message with tool_use", () => {
    const msg: Message = {
      ...base,
      role: "assistant",
      content: [
        { type: "text", text: "let me check" },
        { type: "tool_use", name: "Read", id: "tu-1", input: { file_path: "/a" } },
      ],
    };
    expect(isPureTextMessage(msg)).toBe(false);
  });

  test("returns false for assistant message with thinking", () => {
    const msg: Message = {
      ...base,
      role: "assistant",
      content: [{ type: "thinking", thinking: "hmm" }],
    };
    expect(isPureTextMessage(msg)).toBe(false);
  });

  test("returns false for user message with image_url", () => {
    const msg: Message = {
      ...base,
      role: "user",
      content: [{ type: "image_url", image_url: "https://example.com/img.png" }],
    };
    expect(isPureTextMessage(msg)).toBe(false);
  });

  test("returns false for system message", () => {
    const msg: Message = { ...base, role: "system", subtype: "info" };
    expect(isPureTextMessage(msg)).toBe(false);
  });

  test("returns false for tool message", () => {
    const msg: Message = {
      ...base,
      role: "tool",
      content: [{ type: "tool_result", tool_use_id: "tu-1", content: "ok" }],
    };
    expect(isPureTextMessage(msg)).toBe(false);
  });
});

describe("containsThinking", () => {
  test("returns true for assistant message with thinking block", () => {
    const msg: Message = {
      ...base,
      role: "assistant",
      content: [
        { type: "thinking", thinking: "reasoning..." },
        { type: "text", text: "answer" },
      ],
    };
    expect(containsThinking(msg)).toBe(true);
  });

  test("returns false for assistant message without thinking", () => {
    const msg: Message = {
      ...base,
      role: "assistant",
      content: [{ type: "text", text: "answer" }],
    };
    expect(containsThinking(msg)).toBe(false);
  });

  test("returns false for non-assistant message", () => {
    const msg: Message = {
      ...base,
      role: "user",
      content: [{ type: "text", text: "hello" }],
    };
    expect(containsThinking(msg)).toBe(false);
  });
});

describe("containsToolUse", () => {
  test("returns true for assistant message with tool_use", () => {
    const msg: Message = {
      ...base,
      role: "assistant",
      content: [
        { type: "tool_use", name: "Bash", id: "tu-1", input: { command: "ls" } },
      ],
    };
    expect(containsToolUse(msg)).toBe(true);
  });

  test("returns false for assistant message without tool_use", () => {
    const msg: Message = {
      ...base,
      role: "assistant",
      content: [{ type: "text", text: "hi" }],
    };
    expect(containsToolUse(msg)).toBe(false);
  });

  test("returns false for non-assistant message", () => {
    const msg: Message = {
      ...base,
      role: "user",
      content: [{ type: "text", text: "hello" }],
    };
    expect(containsToolUse(msg)).toBe(false);
  });
});

describe("extractTextContent", () => {
  test("extracts text from user message", () => {
    const msg: Message = {
      ...base,
      role: "user",
      content: [
        { type: "text", text: "first" },
        { type: "text", text: "second" },
      ],
    };
    expect(extractTextContent(msg)).toBe("first\n\nsecond");
  });

  test("extracts text from assistant message ignoring thinking by default", () => {
    const msg: Message = {
      ...base,
      role: "assistant",
      content: [
        { type: "thinking", thinking: "secret" },
        { type: "text", text: "answer" },
      ],
    };
    expect(extractTextContent(msg)).toBe("answer");
  });

  test("includes thinking when option is set", () => {
    const msg: Message = {
      ...base,
      role: "assistant",
      content: [
        { type: "thinking", thinking: "secret" },
        { type: "text", text: "answer" },
      ],
    };
    const result = extractTextContent(msg, { includeThinking: true });
    expect(result).toContain("Think> secret");
    expect(result).toContain("answer");
  });

  test("includes tool_use when option is set", () => {
    const msg: Message = {
      ...base,
      role: "assistant",
      content: [
        { type: "tool_use", name: "Bash", id: "tu-1", input: { command: "ls" } },
        { type: "text", text: "done" },
      ],
    };
    const result = extractTextContent(msg, { includeToolUse: true });
    expect(result).toContain("<Bash> ls");
    expect(result).toContain("done");
  });

  test("includes tool_result from tool message when includeToolUse is set", () => {
    const msg: Message = {
      ...base,
      role: "tool",
      content: [{ type: "tool_result", tool_use_id: "tu-1", content: "file list" }],
    };
    const result = extractTextContent(msg, { includeToolUse: true });
    expect(result).toBe("file list");
  });

  test("renders image_url as markdown image", () => {
    const msg: Message = {
      ...base,
      role: "user",
      content: [{ type: "image_url", image_url: "https://example.com/img.png" }],
    };
    expect(extractTextContent(msg)).toBe("![](https://example.com/img.png)");
  });

  test("returns empty string for system message", () => {
    const msg: Message = { ...base, role: "system", subtype: "info" };
    expect(extractTextContent(msg)).toBe("");
  });
});
