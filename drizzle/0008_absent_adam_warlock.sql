CREATE TYPE "public"."watched_date_precision" AS ENUM('day', 'year');--> statement-breakpoint
ALTER TABLE "watch_entries" ALTER COLUMN "watched_on" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "watch_entries" ADD COLUMN "watched_year" integer;--> statement-breakpoint
ALTER TABLE "watch_entries" ADD COLUMN "watched_date_precision" "watched_date_precision" DEFAULT 'day' NOT NULL;--> statement-breakpoint
UPDATE "watch_entries" SET "watched_year" = EXTRACT(YEAR FROM "watched_on")::integer WHERE "watched_year" IS NULL;--> statement-breakpoint
ALTER TABLE "watch_entries" ALTER COLUMN "watched_year" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "watch_entries_watched_year_idx" ON "watch_entries" USING btree ("watched_year");
