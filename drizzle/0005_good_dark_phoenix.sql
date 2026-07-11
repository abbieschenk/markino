ALTER TABLE "movie_production_countries" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "movie_spoken_languages" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "movie_studios" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "production_countries" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "spoken_languages" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "watch_entry_participants" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "movie_production_countries_movie_country_unique" ON "movie_production_countries" USING btree ("movie_id","country_code");--> statement-breakpoint
CREATE UNIQUE INDEX "movie_spoken_languages_movie_language_unique" ON "movie_spoken_languages" USING btree ("movie_id","language_code");--> statement-breakpoint
CREATE UNIQUE INDEX "movie_studios_movie_studio_unique" ON "movie_studios" USING btree ("movie_id","studio_id");--> statement-breakpoint
CREATE UNIQUE INDEX "production_countries_iso_code_unique" ON "production_countries" USING btree ("iso_code");--> statement-breakpoint
CREATE UNIQUE INDEX "spoken_languages_iso_code_unique" ON "spoken_languages" USING btree ("iso_code");--> statement-breakpoint
CREATE UNIQUE INDEX "watch_entry_participants_entry_user_unique" ON "watch_entry_participants" USING btree ("watch_entry_id","user_id");--> statement-breakpoint
ALTER TABLE "movie_production_countries" DROP CONSTRAINT "movie_production_countries_country_code_production_countries_iso_code_fk";--> statement-breakpoint
ALTER TABLE "movie_spoken_languages" DROP CONSTRAINT "movie_spoken_languages_language_code_spoken_languages_iso_code_fk";--> statement-breakpoint
ALTER TABLE "movie_production_countries" DROP CONSTRAINT "movie_production_countries_pk";--> statement-breakpoint
ALTER TABLE "movie_spoken_languages" DROP CONSTRAINT "movie_spoken_languages_pk";--> statement-breakpoint
ALTER TABLE "movie_studios" DROP CONSTRAINT "movie_studios_pk";--> statement-breakpoint
ALTER TABLE "production_countries" DROP CONSTRAINT "production_countries_pkey";--> statement-breakpoint
ALTER TABLE "spoken_languages" DROP CONSTRAINT "spoken_languages_pkey";--> statement-breakpoint
ALTER TABLE "watch_entry_participants" DROP CONSTRAINT "watch_entry_participants_pk";--> statement-breakpoint
ALTER TABLE "movie_production_countries" ADD CONSTRAINT "movie_production_countries_pkey" PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "movie_spoken_languages" ADD CONSTRAINT "movie_spoken_languages_pkey" PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "movie_studios" ADD CONSTRAINT "movie_studios_pkey" PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "production_countries" ADD CONSTRAINT "production_countries_pkey" PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "spoken_languages" ADD CONSTRAINT "spoken_languages_pkey" PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "watch_entry_participants" ADD CONSTRAINT "watch_entry_participants_pkey" PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "movie_production_countries" ADD CONSTRAINT "movie_production_countries_country_code_production_countries_iso_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."production_countries"("iso_code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_spoken_languages" ADD CONSTRAINT "movie_spoken_languages_language_code_spoken_languages_iso_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."spoken_languages"("iso_code") ON DELETE cascade ON UPDATE no action;
