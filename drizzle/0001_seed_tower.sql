INSERT INTO `tower` (`id`, `name`, `next_floor`, `created_at`)
VALUES (1, 'Tower 1', 1, CAST(strftime('%s', 'now') AS INTEGER) * 1000);
--> statement-breakpoint
