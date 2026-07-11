CREATE TABLE "user_default_watch_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"participant_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_default_watch_participants" ADD CONSTRAINT "user_default_watch_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_default_watch_participants" ADD CONSTRAINT "user_default_watch_participants_participant_user_id_users_id_fk" FOREIGN KEY ("participant_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_default_watch_participants_user_participant_unique" ON "user_default_watch_participants" USING btree ("user_id","participant_user_id");--> statement-breakpoint
CREATE INDEX "user_default_watch_participants_participant_user_id_idx" ON "user_default_watch_participants" USING btree ("participant_user_id");