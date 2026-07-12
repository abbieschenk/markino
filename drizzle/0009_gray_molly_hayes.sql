DROP INDEX "watch_entries_watched_year_idx";--> statement-breakpoint
ALTER TABLE "watch_entries" ALTER COLUMN "watched_on" SET DATA TYPE varchar(10) USING "watched_on"::text;--> statement-breakpoint
UPDATE "watch_entries" SET "watched_on" = "watched_year"::text WHERE "watched_on" IS NULL;--> statement-breakpoint
ALTER TABLE "watch_entries" ALTER COLUMN "watched_on" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "watch_entries" DROP COLUMN "watched_year";
