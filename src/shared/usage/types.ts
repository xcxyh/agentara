import { z } from "zod";

/**
 * Token usage captured from a completed Codex turn.
 */
export const CodexUsageRecord = z.object({
  id: z.string(),
  agent_type: z.literal("codex"),
  session_id: z.string(),
  runner_session_id: z.string().optional().nullable(),
  input_tokens: z.number().int().nonnegative(),
  cached_input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  created_at: z.number().int().nonnegative(),
});
export interface CodexUsageRecord extends z.infer<typeof CodexUsageRecord> {}

/**
 * Aggregated token usage for a time window.
 */
export const CodexUsageTotals = z.object({
  input_tokens: z.number().int().nonnegative(),
  cached_input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
});
export interface CodexUsageTotals extends z.infer<typeof CodexUsageTotals> {}

/**
 * Summary data returned by the Codex usage API.
 */
export const CodexUsageSummary = z.object({
  lifetime: CodexUsageTotals,
  recent_7d: CodexUsageTotals,
  last_updated_at: z.number().int().nonnegative().nullable(),
});
export interface CodexUsageSummary extends z.infer<typeof CodexUsageSummary> {}
