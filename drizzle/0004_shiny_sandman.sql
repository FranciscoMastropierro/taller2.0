CREATE TABLE "account_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"customer_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"source_key" text NOT NULL,
	"reference" text NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"business_date" text NOT NULL,
	"evidence" text NOT NULL,
	"payload_hash" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_entries_source_key_unique" UNIQUE("source_key"),
	CONSTRAINT "account_amount_positive" CHECK ("account_entries"."amount" > 0),
	CONSTRAINT "account_kind_valid" CHECK ("account_entries"."kind" IN ('opening_debt', 'opening_credit'))
);
--> statement-breakpoint
ALTER TABLE "account_entries" ADD CONSTRAINT "account_entries_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_entries" ADD CONSTRAINT "account_entries_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_customer_idx" ON "account_entries" USING btree ("customer_id");