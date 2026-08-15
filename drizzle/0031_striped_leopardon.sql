DROP TABLE IF EXISTS `email_slot`;
--> statement-breakpoint
CREATE TABLE `email_slot` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email_id` text,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `email_slot_user_id_idx` ON `email_slot` (`user_id`);--> statement-breakpoint
CREATE INDEX `email_slot_expires_at_idx` ON `email_slot` (`expires_at`);
--> statement-breakpoint
INSERT INTO `email_slot` (`id`, `user_id`, `email_id`, `expires_at`, `created_at`)
SELECT lower(hex(randomblob(16))), `userId`, `id`, `expires_at`, `created_at`
FROM `email`
WHERE `expires_at` > (unixepoch() * 1000);
