ALTER TABLE "auth_accounts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_verifications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "auth_accounts" CASCADE;--> statement-breakpoint
DROP TABLE "auth_sessions" CASCADE;--> statement-breakpoint
DROP TABLE "auth_verifications" CASCADE;--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email_verified";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "image";