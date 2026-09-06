CREATE INDEX "movie_credits_movie_type_job_idx" ON "movie_credits" USING btree ("movie_id","credit_type","job");--> statement-breakpoint
CREATE INDEX "movie_credits_movie_type_order_idx" ON "movie_credits" USING btree ("movie_id","credit_type","credit_order");--> statement-breakpoint
CREATE INDEX "watch_entries_user_watched_on_idx" ON "watch_entries" USING btree ("user_id","watched_on");--> statement-breakpoint
CREATE INDEX "watch_entry_participants_user_entry_idx" ON "watch_entry_participants" USING btree ("user_id","watch_entry_id");