ALTER TABLE `activation_code` ADD `email_expiry` integer DEFAULT 86400000 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_email_quota` ADD `expiry` integer DEFAULT 86400000 NOT NULL;