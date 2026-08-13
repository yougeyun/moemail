CREATE TABLE `email_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`code` text,
	`token` text,
	`purpose` text NOT NULL,
	`user_id` text,
	`meta` text,
	`expires_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `email_verification_email_idx` ON `email_verification` (`email`);--> statement-breakpoint
CREATE INDEX `email_verification_token_idx` ON `email_verification` (`token`);