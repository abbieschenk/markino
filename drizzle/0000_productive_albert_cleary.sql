CREATE TYPE "public"."watch_status" AS ENUM('watched', 'dnf', 'dns');--> statement-breakpoint
CREATE TABLE "movie_rankings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"movie_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"release_year" integer,
	"original_language" varchar(32),
	"tmdb_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handle" varchar(32) NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watch_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"movie_id" uuid NOT NULL,
	"watched_on" date NOT NULL,
	"language_watched" varchar(32) NOT NULL,
	"status" "watch_status" DEFAULT 'watched' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watch_entry_participants" (
	"watch_entry_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watch_entry_participants_pk" PRIMARY KEY("watch_entry_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "movie_rankings" ADD CONSTRAINT "movie_rankings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_rankings" ADD CONSTRAINT "movie_rankings_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_entries" ADD CONSTRAINT "watch_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_entries" ADD CONSTRAINT "watch_entries_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_entry_participants" ADD CONSTRAINT "watch_entry_participants_watch_entry_id_watch_entries_id_fk" FOREIGN KEY ("watch_entry_id") REFERENCES "public"."watch_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_entry_participants" ADD CONSTRAINT "watch_entry_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "movie_rankings_user_movie_unique" ON "movie_rankings" USING btree ("user_id","movie_id");--> statement-breakpoint
CREATE UNIQUE INDEX "movie_rankings_user_rank_unique" ON "movie_rankings" USING btree ("user_id","rank");--> statement-breakpoint
CREATE INDEX "movie_rankings_movie_id_idx" ON "movie_rankings" USING btree ("movie_id");--> statement-breakpoint
CREATE UNIQUE INDEX "movies_tmdb_id_unique" ON "movies" USING btree ("tmdb_id");--> statement-breakpoint
CREATE INDEX "movies_title_idx" ON "movies" USING btree ("title");--> statement-breakpoint
CREATE UNIQUE INDEX "users_handle_unique" ON "users" USING btree ("handle");--> statement-breakpoint
CREATE INDEX "watch_entries_user_id_idx" ON "watch_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "watch_entries_movie_id_idx" ON "watch_entries" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX "watch_entries_watched_on_idx" ON "watch_entries" USING btree ("watched_on");--> statement-breakpoint
CREATE INDEX "watch_entry_participants_user_id_idx" ON "watch_entry_participants" USING btree ("user_id");