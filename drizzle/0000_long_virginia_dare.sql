CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`category` text DEFAULT 'work' NOT NULL,
	`due_date` text,
	`source_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`completed_at` text,
	CONSTRAINT "tasks_title_check" CHECK(length(trim("tasks"."title")) BETWEEN 1 AND 160),
	CONSTRAINT "tasks_completed_check" CHECK("tasks"."completed" IN (0, 1)),
	CONSTRAINT "tasks_priority_check" CHECK("tasks"."priority" IN ('low', 'medium', 'high')),
	CONSTRAINT "tasks_category_check" CHECK("tasks"."category" IN ('work', 'personal', 'learning'))
);
--> statement-breakpoint
CREATE INDEX `tasks_created_at_idx` ON `tasks` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `tasks_source_url_idx` ON `tasks` (`source_url`);