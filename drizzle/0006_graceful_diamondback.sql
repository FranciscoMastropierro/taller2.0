CREATE TABLE "cheque_movements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"cheque_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"action" text NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"business_date" text NOT NULL,
	"reason" text NOT NULL,
	"payload_hash" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cheque_movement_version_unique" UNIQUE("cheque_id","version")
);
--> statement-breakpoint
CREATE TABLE "credit_reversals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"credit_id" uuid NOT NULL,
	"cheque_id" uuid NOT NULL,
	"movement_id" uuid NOT NULL,
	CONSTRAINT "credit_reversals_credit_id_unique" UNIQUE("credit_id"),
	CONSTRAINT "credit_reversals_cheque_id_unique" UNIQUE("cheque_id"),
	CONSTRAINT "credit_reversals_movement_id_unique" UNIQUE("movement_id")
);
--> statement-breakpoint
CREATE TABLE "third_party_cheques" (
	"id" uuid PRIMARY KEY NOT NULL,
	"customer_id" uuid NOT NULL,
	"credit_id" uuid NOT NULL,
	"identity_hash" text NOT NULL,
	"bank" text NOT NULL,
	"account" text NOT NULL,
	"number" text NOT NULL,
	"delivered_by" text NOT NULL,
	"issued_on" text NOT NULL,
	"payable_on" text NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "third_party_cheques_credit_id_unique" UNIQUE("credit_id"),
	CONSTRAINT "third_party_cheques_identity_hash_unique" UNIQUE("identity_hash"),
	CONSTRAINT "cheque_status_valid" CHECK ("third_party_cheques"."status" IN ('received','deposited','credited','rejected'))
);
--> statement-breakpoint
ALTER TABLE "account_entries" DROP CONSTRAINT "account_kind_valid";--> statement-breakpoint
ALTER TABLE "cheque_movements" ADD CONSTRAINT "cheque_movements_cheque_id_third_party_cheques_id_fk" FOREIGN KEY ("cheque_id") REFERENCES "public"."third_party_cheques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cheque_movements" ADD CONSTRAINT "cheque_movements_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_reversals" ADD CONSTRAINT "credit_reversals_id_account_entries_id_fk" FOREIGN KEY ("id") REFERENCES "public"."account_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_reversals" ADD CONSTRAINT "credit_reversals_credit_id_account_entries_id_fk" FOREIGN KEY ("credit_id") REFERENCES "public"."account_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_reversals" ADD CONSTRAINT "credit_reversals_cheque_id_third_party_cheques_id_fk" FOREIGN KEY ("cheque_id") REFERENCES "public"."third_party_cheques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_reversals" ADD CONSTRAINT "credit_reversals_movement_id_cheque_movements_id_fk" FOREIGN KEY ("movement_id") REFERENCES "public"."cheque_movements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "third_party_cheques" ADD CONSTRAINT "third_party_cheques_id_payment_components_id_fk" FOREIGN KEY ("id") REFERENCES "public"."payment_components"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "third_party_cheques" ADD CONSTRAINT "third_party_cheques_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "third_party_cheques" ADD CONSTRAINT "third_party_cheques_credit_id_account_entries_id_fk" FOREIGN KEY ("credit_id") REFERENCES "public"."account_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cheque_customer_idx" ON "third_party_cheques" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "cheque_status_idx" ON "third_party_cheques" USING btree ("status");--> statement-breakpoint
ALTER TABLE "account_entries" ADD CONSTRAINT "account_kind_valid" CHECK ("account_entries"."kind" IN ('opening_debt', 'opening_credit', 'payment_credit', 'credit_reversal'));