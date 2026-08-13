ALTER TABLE `role` ADD `display_name` text;--> statement-breakpoint
ALTER TABLE `role` ADD `icon` text DEFAULT 'User2' NOT NULL;--> statement-breakpoint
ALTER TABLE `role` ADD `permissions` text;--> statement-breakpoint
ALTER TABLE `role` ADD `daily_limit` integer;--> statement-breakpoint
ALTER TABLE `role` ADD `sort_order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `role` ADD `is_system` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `role` SET `icon` = 'Crown', `sort_order` = 0, `is_system` = 1 WHERE `name` = 'emperor';--> statement-breakpoint
UPDATE `role` SET `icon` = 'Gem', `sort_order` = 1, `is_system` = 1 WHERE `name` = 'duke';--> statement-breakpoint
UPDATE `role` SET `icon` = 'Sword', `sort_order` = 2, `is_system` = 1 WHERE `name` = 'knight';--> statement-breakpoint
UPDATE `role` SET `icon` = 'User2', `sort_order` = 3, `is_system` = 1 WHERE `name` = 'civilian';
