CREATE TYPE "public"."movie_credit_type" AS ENUM('cast', 'crew');--> statement-breakpoint
CREATE TABLE "movie_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"movie_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"credit_type" "movie_credit_type" NOT NULL,
	"department" text,
	"job" text,
	"character" text,
	"credit_order" integer
);
--> statement-breakpoint
CREATE TABLE "movie_production_countries" (
	"movie_id" uuid NOT NULL,
	"country_code" varchar(8) NOT NULL,
	CONSTRAINT "movie_production_countries_pk" PRIMARY KEY("movie_id","country_code")
);
--> statement-breakpoint
CREATE TABLE "movie_spoken_languages" (
	"movie_id" uuid NOT NULL,
	"language_code" varchar(16) NOT NULL,
	CONSTRAINT "movie_spoken_languages_pk" PRIMARY KEY("movie_id","language_code")
);
--> statement-breakpoint
CREATE TABLE "movie_studios" (
	"movie_id" uuid NOT NULL,
	"studio_id" uuid NOT NULL,
	CONSTRAINT "movie_studios_pk" PRIMARY KEY("movie_id","studio_id")
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tmdb_person_id" integer NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_countries" (
	"iso_code" varchar(8) PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spoken_languages" (
	"iso_code" varchar(16) PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tmdb_company_id" integer NOT NULL,
	"name" text NOT NULL,
	"origin_country" varchar(8)
);
--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "tagline" text;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "director" text;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "writer" text;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "editor" text;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "metadata_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "movie_credits" ADD CONSTRAINT "movie_credits_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_credits" ADD CONSTRAINT "movie_credits_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_production_countries" ADD CONSTRAINT "movie_production_countries_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_production_countries" ADD CONSTRAINT "movie_production_countries_country_code_production_countries_iso_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."production_countries"("iso_code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_spoken_languages" ADD CONSTRAINT "movie_spoken_languages_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_spoken_languages" ADD CONSTRAINT "movie_spoken_languages_language_code_spoken_languages_iso_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."spoken_languages"("iso_code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_studios" ADD CONSTRAINT "movie_studios_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_studios" ADD CONSTRAINT "movie_studios_studio_id_studios_id_fk" FOREIGN KEY ("studio_id") REFERENCES "public"."studios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "movie_credits_movie_id_idx" ON "movie_credits" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX "movie_credits_person_id_idx" ON "movie_credits" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "movie_production_countries_country_code_idx" ON "movie_production_countries" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "movie_spoken_languages_language_code_idx" ON "movie_spoken_languages" USING btree ("language_code");--> statement-breakpoint
CREATE INDEX "movie_studios_studio_id_idx" ON "movie_studios" USING btree ("studio_id");--> statement-breakpoint
CREATE UNIQUE INDEX "people_tmdb_person_id_unique" ON "people" USING btree ("tmdb_person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "studios_tmdb_company_id_unique" ON "studios" USING btree ("tmdb_company_id");