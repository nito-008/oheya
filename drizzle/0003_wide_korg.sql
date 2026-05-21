DROP INDEX `profile_public_id_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `profile_public_id_lower_unique` ON `profile` (lower("public_id"));