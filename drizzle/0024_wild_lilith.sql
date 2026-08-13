CREATE TABLE `user_email_quota` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`quota` integer DEFAULT 0 NOT NULL,
	`expiry_days` integer DEFAULT 30 NOT NULL,
	`source_code_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_code_id`) REFERENCES `activation_code`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `user_email_quota_user_id_idx` ON `user_email_quota` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_email_quota_source_code_id_idx` ON `user_email_quota` (`source_code_id`);--> statement-breakpoint
ALTER TABLE `activation_code` ADD `email_expiry_days` integer DEFAULT 30 NOT NULL;