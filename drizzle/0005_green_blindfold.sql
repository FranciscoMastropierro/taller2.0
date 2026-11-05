CREATE TABLE "application_batches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"customer_id" uuid NOT NULL,
	"payload_hash" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"credit_id" uuid NOT NULL,
	"debt_id" uuid NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	CONSTRAINT "application_batch_pair" UNIQUE("batch_id","credit_id","debt_id"),
	CONSTRAINT "application_positive" CHECK ("credit_applications"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "payment_components" (
	"id" uuid PRIMARY KEY NOT NULL,
	"receipt_id" uuid NOT NULL,
	"credit_id" uuid NOT NULL,
	"method" text NOT NULL,
	CONSTRAINT "payment_components_credit_id_unique" UNIQUE("credit_id")
);
--> statement-breakpoint
CREATE TABLE "payment_receipts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"number" integer GENERATED ALWAYS AS IDENTITY (sequence name "payment_receipts_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"customer_id" uuid NOT NULL,
	"payload_hash" text NOT NULL,
	"total" numeric(18, 2) NOT NULL,
	"business_date" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_receipts_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "account_entries" DROP CONSTRAINT "account_kind_valid";--> statement-breakpoint
ALTER TABLE "application_batches" ADD CONSTRAINT "application_batches_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_batches" ADD CONSTRAINT "application_batches_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_applications" ADD CONSTRAINT "credit_applications_batch_id_application_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."application_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_applications" ADD CONSTRAINT "credit_applications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_applications" ADD CONSTRAINT "credit_applications_credit_id_account_entries_id_fk" FOREIGN KEY ("credit_id") REFERENCES "public"."account_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_applications" ADD CONSTRAINT "credit_applications_debt_id_account_entries_id_fk" FOREIGN KEY ("debt_id") REFERENCES "public"."account_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_components" ADD CONSTRAINT "payment_components_receipt_id_payment_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."payment_receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_components" ADD CONSTRAINT "payment_components_credit_id_account_entries_id_fk" FOREIGN KEY ("credit_id") REFERENCES "public"."account_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "application_credit_idx" ON "credit_applications" USING btree ("credit_id");--> statement-breakpoint
CREATE INDEX "application_debt_idx" ON "credit_applications" USING btree ("debt_id");--> statement-breakpoint
ALTER TABLE "account_entries" ADD CONSTRAINT "account_kind_valid" CHECK ("account_entries"."kind" IN ('opening_debt', 'opening_credit', 'payment_credit'));