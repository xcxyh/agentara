CREATE TABLE `agent_usage_records` (
  `id` text PRIMARY KEY NOT NULL,
  `agent_type` text NOT NULL,
  `session_id` text NOT NULL,
  `runner_session_id` text,
  `input_tokens` integer NOT NULL,
  `cached_input_tokens` integer NOT NULL,
  `output_tokens` integer NOT NULL,
  `created_at` integer NOT NULL
);
CREATE INDEX `idx_agent_usage_records_agent_type` ON `agent_usage_records` (`agent_type`);
CREATE INDEX `idx_agent_usage_records_created_at` ON `agent_usage_records` (`created_at`);
CREATE INDEX `idx_agent_usage_records_session_id` ON `agent_usage_records` (`session_id`);
