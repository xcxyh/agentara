import { z } from "zod";

import {
  AssistantMessage,
  SystemMessage,
  ToolMessage,
  type UserMessage,
} from "../messaging";
import { CodexUsageRecord } from "../usage";

/**
 * The options for the agent runner.
 */
export const AgentRunOptions = z.object({
  /**
   * Whether to start a new session.
   */
  isNewSession: z.boolean(),

  /**
   * The current working directory.
   */
  cwd: z.string(),

  /**
   * Runner-specific session/thread id used by some providers for true resume.
   */
  runnerSessionId: z.string().optional(),
});
export interface AgentRunOptions extends z.infer<typeof AgentRunOptions> {}

/**
 * A streamed agent event carrying a normal message.
 */
export const AgentMessageEvent = z.object({
  type: z.literal("message"),
  message: z.union([SystemMessage, AssistantMessage, ToolMessage]),
});
export interface AgentMessageEvent extends z.infer<typeof AgentMessageEvent> {}

/**
 * A streamed agent event carrying token usage.
 */
export const AgentUsageEvent = z.object({
  type: z.literal("usage"),
  usage: CodexUsageRecord.omit({ id: true, created_at: true }),
});
export interface AgentUsageEvent extends z.infer<typeof AgentUsageEvent> {}

/**
 * Streamed events produced by agent runners.
 */
export type AgentRunnerEvent = AgentMessageEvent | AgentUsageEvent;

/**
 * A wrapper of the real agent behind.
 * Used to interact with Agent, supporting streaming output
 */
export interface AgentRunner {
  /**
   * The type of the agent runner.
   */
  readonly type: string;

  /**
   * Streams the chunking messages from the agent.
   */
  stream(
    // eslint-disable-next-line no-unused-vars
    userMessage: UserMessage,
    // eslint-disable-next-line no-unused-vars
    options: AgentRunOptions,
  ): AsyncIterableIterator<AgentRunnerEvent>;
}
