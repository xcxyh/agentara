import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Persisted token usage records emitted by agent runners.
 */
export const agent_usage_records = sqliteTable(
  "agent_usage_records",
  {
    id: text("id").primaryKey(),
    agent_type: text("agent_type").notNull(),
    session_id: text("session_id").notNull(),
    runner_session_id: text("runner_session_id"),
    input_tokens: integer("input_tokens").notNull(),
    cached_input_tokens: integer("cached_input_tokens").notNull(),
    output_tokens: integer("output_tokens").notNull(),
    created_at: integer("created_at").notNull(),
  },
  (table) => [
    index("idx_agent_usage_records_agent_type").on(table.agent_type),
    index("idx_agent_usage_records_created_at").on(table.created_at),
    index("idx_agent_usage_records_session_id").on(table.session_id),
  ],
);
