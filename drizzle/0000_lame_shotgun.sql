CREATE TYPE "public"."app_role" AS ENUM('admin', 'reception', 'technician', 'readonly');--> statement-breakpoint
CREATE TABLE "access_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"target_id" uuid NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "app_role" NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"session_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_users_username_unique" UNIQUE("username"),
	CONSTRAINT "username_normalized" CHECK ("app_users"."username" = lower(trim("app_users"."username")) AND "app_users"."username" ~ '^[a-z0-9._@-]{3,80}$'),
	CONSTRAINT "active_boolean" CHECK ("app_users"."active" in (0,1)),
	CONSTRAINT "session_version_positive" CHECK ("app_users"."session_version" > 0)
);
--> statement-breakpoint
CREATE TABLE "login_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"attempts" integer NOT NULL,
	"window_start" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "access_audit" ADD CONSTRAINT "access_audit_actor_id_app_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_audit" ADD CONSTRAINT "access_audit_target_id_app_users_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;