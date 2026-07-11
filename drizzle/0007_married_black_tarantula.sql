CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tmdb_genre_id" integer NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movie_genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"movie_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "original_title" text;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "overview" text;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "release_date" date;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "runtime_minutes" integer;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "origin_countries" jsonb;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "imdb_id" varchar(32);--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "poster_path" text;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "budget" bigint;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "revenue" bigint;--> statement-breakpoint
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "genres_tmdb_genre_id_unique" ON "genres" USING btree ("tmdb_genre_id");--> statement-breakpoint
CREATE UNIQUE INDEX "movie_genres_movie_genre_unique" ON "movie_genres" USING btree ("movie_id","genre_id");--> statement-breakpoint
CREATE INDEX "movie_genres_genre_id_idx" ON "movie_genres" USING btree ("genre_id");