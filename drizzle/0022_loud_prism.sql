ALTER TABLE `role_order` ADD `duration_days` integer;--> statement-breakpoint
ALTER TABLE `role_order` ADD `expires_at` integer;--> statement-breakpoint
ALTER TABLE `role_order` ADD `payment_method` text;--> statement-breakpoint
ALTER TABLE `role` ADD `duration_options` text;--> statement-breakpoint
ALTER TABLE `role` ADD `show_upper_domains` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user_role` ADD `expires_at` integer;