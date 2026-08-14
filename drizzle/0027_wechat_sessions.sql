CREATE TABLE `mini_session` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`user_id` text,
	`openid` text NOT NULL,
	`expires_at` integer NOT NULL,
	`last_used_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mini_session_token_hash_unique` ON `mini_session` (`token_hash`);--> statement-breakpoint
CREATE INDEX `mini_session_user_id_idx` ON `mini_session` (`user_id`);--> statement-breakpoint
CREATE INDEX `mini_session_openid_idx` ON `mini_session` (`openid`);