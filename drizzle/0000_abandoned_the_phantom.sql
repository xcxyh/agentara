CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_type` text NOT NULL,
	`cwd` text NOT NULL,
	`last_message_created_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_session_id` ON `tasks` (`session_id`);
