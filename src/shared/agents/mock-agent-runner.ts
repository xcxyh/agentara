import type {
  AssistantMessage,
  Message,
  SystemMessage,
  ToolMessage,
} from "../messaging";

import type { AgentRunner } from "./agent-runner";

export class MockAgentRunner implements AgentRunner {
  readonly type = "mock";
  private _messages: Message[] = [];

  constructor(
    // eslint-disable-next-line no-unused-vars
    readonly filename: string,
    // eslint-disable-next-line no-unused-vars
    readonly options: {
      delay: number;
    } = {
      delay: 1000,
    },
  ) {}

  private async _loadMessages() {
    const jsonl = (await Bun.file(this.filename).text()).trim();
    this._messages = jsonl.split("\n").map((line) => JSON.parse(line));
  }

  async *stream(): AsyncIterableIterator<{
    type: "message";
    message: SystemMessage | AssistantMessage | ToolMessage;
  }> {
    await this._loadMessages();
    for (const message of this._messages) {
      if (message.role !== "user") {
        await Bun.sleep(this.options.delay);
        yield {
          type: "message",
          message: message as SystemMessage | AssistantMessage | ToolMessage,
        };
      }
    }
  }
}
