CREATE TABLE `music` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`track_id` text NOT NULL,
	`title` text NOT NULL,
	`artist` text NOT NULL,
	`artwork_url` text,
	`preview_url` text,
	`track_view_url` text,
	`position` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `music_user_id_position_unique` ON `music` (`user_id`,`position`);--> statement-breakpoint
CREATE INDEX `music_user_id_idx` ON `music` (`user_id`);--> statement-breakpoint
INSERT INTO `music` (
	`id`,
	`user_id`,
	`track_id`,
	`title`,
	`artist`,
	`artwork_url`,
	`preview_url`,
	`track_view_url`,
	`position`,
	`created_at`
)
SELECT
	lower(hex(randomblob(16))),
	`user_id`,
	`music_track_id`,
	`music_title`,
	`music_artist`,
	`music_artwork_url`,
	`music_preview_url`,
	`music_track_view_url`,
	0,
	CAST(strftime('%s', 'now') AS integer) * 1000
FROM `profile`
WHERE `music_track_id` IS NOT NULL
	AND `music_title` IS NOT NULL
	AND `music_artist` IS NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` DROP COLUMN `music_track_id`;--> statement-breakpoint
ALTER TABLE `profile` DROP COLUMN `music_title`;--> statement-breakpoint
ALTER TABLE `profile` DROP COLUMN `music_artist`;--> statement-breakpoint
ALTER TABLE `profile` DROP COLUMN `music_artwork_url`;--> statement-breakpoint
ALTER TABLE `profile` DROP COLUMN `music_preview_url`;--> statement-breakpoint
ALTER TABLE `profile` DROP COLUMN `music_track_view_url`;
