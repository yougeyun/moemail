CREATE TABLE `ad_reward_record` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`quota` integer DEFAULT 0 NOT NULL,
	`expiry_days` integer DEFAULT 30 NOT NULL,
	`expiry` integer DEFAULT 86400000 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ad_reward_record_user_id_idx` ON `ad_reward_record` (`user_id`);--> statement-breakpoint
CREATE INDEX `ad_reward_record_created_at_idx` ON `ad_reward_record` (`created_at`);--> statement-breakpoint
CREATE TABLE `wechat_subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`openid` text NOT NULL,
	`template_id` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `wechat_subscription_user_id_idx` ON `wechat_subscription` (`user_id`);--> statement-breakpoint
CREATE INDEX `wechat_subscription_openid_idx` ON `wechat_subscription` (`openid`);--> statement-breakpoint
ALTER TABLE `user_email_quota` ADD `source_type` text DEFAULT 'activation_code' NOT NULL;--> statement-breakpoint
ALTER TABLE `user_email_quota` ADD `source_id` text;