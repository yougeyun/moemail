ALTER TABLE `activation_code` ADD `role_id` text REFERENCES role(id);--> statement-breakpoint
ALTER TABLE `activation_code` ADD `role_duration_days` integer DEFAULT 0 NOT NULL;