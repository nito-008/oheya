ALTER TABLE `user` ADD `public_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `user_public_id_unique` ON `user` (`public_id`);