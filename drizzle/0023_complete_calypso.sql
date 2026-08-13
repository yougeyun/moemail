CREATE TABLE `activation_code` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`email_quota` integer DEFAULT 0 NOT NULL,
	`send_quota` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`used_by` text,
	`used_at` integer,
	`created_at` integer NOT NULL,
	`expires_at` integer,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`used_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activation_code_code_unique` ON `activation_code` (`code`);--> statement-breakpoint
CREATE INDEX `activation_code_code_idx` ON `activation_code` (`code`);--> statement-breakpoint
CREATE INDEX `activation_code_used_by_idx` ON `activation_code` (`used_by`);--> statement-breakpoint
ALTER TABLE `user` ADD `redeemed_email_quota` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `redeemed_send_quota` integer DEFAULT 0 NOT NULL;