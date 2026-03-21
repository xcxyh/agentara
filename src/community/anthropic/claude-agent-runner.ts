import {
  config,
  extractTextContent,
  type MessageContent,
  type AgentRunnerEvent,
  type AgentRunner,
  type AgentRunOptions,
  type AssistantMessage,
  type SystemMessage,
  type ToolMessage,
  type UserMessage,
} from "@/shared";

/**
 * The agent runner for Claude Code CLI.
 */
export class ClaudeAgentRunner implements AgentRunner {
  readonly type = "claude";

  async *stream(
    message: UserMessage,
    options: AgentRunOptions,
  ): AsyncIterableIterator<AgentRunnerEvent> {
    const sessionId = message.session_id;
    const textContentOfUserMessage = JSON.stringify(
      extractTextContent(message),
    );

    const isNew = options?.isNewSession ?? false;
    const attemptModes: Array<"new" | "resume"> = [isNew ? "new" : "resume"];

    // Recover from a locally persisted session whose Claude-side conversation
    // was never created (for example when the first launch failed before the
    // CLI could start). In that case, retry once as a fresh session.
    if (!isNew) {
      attemptModes.push("new");
    }

    let lastError: Error | undefined;
    for (const mode of attemptModes) {
      const result = await this._runClaude(mode, sessionId, textContentOfUserMessage, options.cwd);

      for (const parsed of result.messages) {
        yield { type: "message", message: parsed };
      }

      if (!result.error) {
        return;
      }

      lastError = result.error;
      if (
        mode === "resume" &&
        this._isMissingConversationError(result.stdoutRaw, result.stderrText)
      ) {
        continue;
      }
      throw result.error;
    }

    throw lastError ?? new Error("Claude Code execution failed");
  }

  private async _runClaude(
    mode: "new" | "resume",
    sessionId: string,
    prompt: string,
    cwd: string,
  ): Promise<{
    messages: Array<SystemMessage | AssistantMessage | ToolMessage>;
    stdoutRaw: string;
    stderrText: string;
    error?: Error;
  }> {
    const args = [
      "claude",
      ...(mode === "resume"
        ? ["--resume", sessionId]
        : ["--session-id", sessionId]),
      ...["--model", config.agents.default.model],
      ...["--output-format", "stream-json"],
      "--print",
      "--verbose",
      prompt,
    ];
    const proc = Bun.spawn(args, {
      cwd,
      env: buildSpawnEnv({
        ...Bun.env,
        ANTHROPIC_API_KEY: "",
      }),
      stderr: "pipe",
    });
    const decoder = new TextDecoder();
    const stderrChunks: Uint8Array[] = [];
    const stderrPipe = proc.stderr.pipeTo(
      new WritableStream({
        write(chunk) {
          stderrChunks.push(chunk);
        },
      }),
    );
    const messages: Array<SystemMessage | AssistantMessage | ToolMessage> = [];
    let buffer = "";
    let stdoutRaw = "";
    for await (const chunk of iterateReadableStream(proc.stdout)) {
      const decoded = decoder.decode(chunk, { stream: true });
      buffer += decoded;
      stdoutRaw += decoded;
      const lines = buffer.split("\n");
      buffer = lines.pop()!;
      for (const line of lines) {
        if (line.trim()) {
          const parsed = this._parseStreamLine(line.trim(), sessionId);
          if (parsed) {
            messages.push(parsed);
          }
        }
      }
    }
    if (buffer.trim()) {
      const parsed = this._parseStreamLine(buffer.trim(), sessionId);
      if (parsed) {
        messages.push(parsed);
      }
    }
    const exitCode = await proc.exited;
    await stderrPipe;
    const stderrText =
      stderrChunks.length > 0
        ? decoder.decode(Bun.concatArrayBuffers(stderrChunks))
        : "";

    if (exitCode === 0) {
      return { messages, stdoutRaw, stderrText };
    }

    const parts: string[] = [];
    if (stdoutRaw.trim()) {
      parts.push(`Stdout:\n${stdoutRaw.trim()}`);
    }
    if (stderrText.trim()) {
      parts.push(`Stderr:\n${stderrText.trim()}`);
    }
    const detail = parts.length > 0 ? `\n\n${parts.join("\n\n")}` : "";

    return {
      messages,
      stdoutRaw,
      stderrText,
      error: new Error(`Claude Code exited with code ${exitCode}${detail}`),
    };
  }

  private _isMissingConversationError(
    stdoutRaw: string,
    stderrText: string,
  ): boolean {
    const combined = `${stdoutRaw}\n${stderrText}`;
    return combined.includes("No conversation found with session ID");
  }

  private _parseStreamLine(
    line: string,
    sessionId: string,
  ): AssistantMessage | ToolMessage | SystemMessage | null {
    try {
      const obj = JSON.parse(line);
      if (obj.type === "system") {
        const message: SystemMessage = {
          id: obj.uuid,
          session_id: obj.session_id,
          role: "system",
          subtype: obj.subtype,
        };
        return message;
      } else if (obj.type === "assistant" || obj.type === "user") {
        let role: "assistant" | "tool" = "assistant";
        if (obj.type === "user" && containsToolResult(obj.message)) {
          role = "tool";
        } else {
          role = "assistant";
        }
        const message: AssistantMessage | ToolMessage = {
          id: obj.uuid,
          session_id: sessionId,
          role,
          content: obj.message.content,
        };
        return message;
      }
      return null;
    } catch {
      return null;
    }
  }
}

function containsToolResult(message: { content: MessageContent[] }): boolean {
  return message.content.some((content) => content.type === "tool_result");
}

function buildSpawnEnv(
  env: Record<string, string | boolean | undefined>,
): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(env).map(([key, value]) => [key, value?.toString()]),
  );
}

async function* iterateReadableStream(
  stream: ReadableStream<Uint8Array>,
): AsyncIterableIterator<Uint8Array> {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        yield value;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
