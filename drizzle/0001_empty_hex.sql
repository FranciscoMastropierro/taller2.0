CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" integer GENERATED ALWAYS AS IDENTITY (sequence name "customers_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"document" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_code_unique" UNIQUE("code"),
	CONSTRAINT "customer_name_length" CHECK (length(trim("customers"."name")) BETWEEN 2 AND 160),
	CONSTRAINT "customer_version_positive" CHECK ("customers"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_updated_by_app_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;