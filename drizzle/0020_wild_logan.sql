CREATE TABLE `role_order` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	`role_name` text NOT NULL,
	`role_display_name` text,
	`price` integer NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `role_order_user_id_idx` ON `role_order` (`user_id`);--> statement-breakpoint
CREATE INDEX `role_order_created_at_idx` ON `role_order` (`created_at`);--> statement-breakpoint
ALTER TABLE `role` ADD `allowed_domains` text;--> statement-breakpoint
ALTER TABLE `role` ADD `allowed_expiries` text;--> statement-breakpoint
ALTER TABLE `role` ADD `default_expiry` integer;--> statement-breakpoint
ALTER TABLE `role` ADD `price` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `role` ADD `purchasable` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `points` integer DEFAULT 0 NOT NULL;