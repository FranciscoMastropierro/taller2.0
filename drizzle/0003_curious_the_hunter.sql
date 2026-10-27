CREATE TABLE "historical_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"legacy_number" integer NOT NULL,
	"customer_id" uuid,
	"original" jsonb NOT NULL,
	"continued_order_id" uuid,
	CONSTRAINT "historical_orders_legacy_number_unique" UNIQUE("legacy_number"),
	CONSTRAINT "historical_orders_continued_order_id_unique" UNIQUE("continued_order_id")
);
--> statement-breakpoint
CREATE TABLE "import_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"namespace" text NOT NULL,
	"sha256" text NOT NULL,
	"customer_count" integer NOT NULL,
	"order_count" integer NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "import_sources_namespace_unique" UNIQUE("namespace")
);
--> statement-breakpoint
CREATE TABLE "order_sheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"order_version" integer NOT NULL,
	"kind" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sheet_order_version_kind_unique" UNIQUE("order_id","order_version","kind"),
	CONSTRAINT "sheet_kind_valid" CHECK ("order_sheets"."kind" IN ('intake', 'work'))
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "legacy_code" integer;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "legacy_original" jsonb;--> statement-breakpoint
ALTER TABLE "historical_orders" ADD CONSTRAINT "historical_orders_source_id_import_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."import_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_orders" ADD CONSTRAINT "historical_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_orders" ADD CONSTRAINT "historical_orders_continued_order_id_work_orders_id_fk" FOREIGN KEY ("continued_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_sources" ADD CONSTRAINT "import_sources_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_sheets" ADD CONSTRAINT "order_sheets_order_id_work_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_sheets" ADD CONSTRAINT "order_sheets_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "historical_customer_idx" ON "historical_orders" USING btree ("customer_id");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_legacy_code_unique" UNIQUE("legacy_code");