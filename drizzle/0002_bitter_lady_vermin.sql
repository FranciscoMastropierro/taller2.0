CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"actor_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"before" jsonb,
	"after" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_event_version_unique" UNIQUE("order_id","version"),
	CONSTRAINT "order_event_kind_valid" CHECK ("order_events"."kind" IN ('created', 'edited', 'technical', 'status', 'correction'))
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"number" integer GENERATED ALWAYS AS IDENTITY (sequence name "work_orders_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"customer_id" uuid NOT NULL,
	"equipment" text NOT NULL,
	"brand" text DEFAULT '' NOT NULL,
	"model" text DEFAULT '' NOT NULL,
	"serial_number" text DEFAULT '' NOT NULL,
	"intake" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"assigned_to" uuid,
	"diagnosis" text DEFAULT '' NOT NULL,
	"work_done" text DEFAULT '' NOT NULL,
	"worked_minutes" integer DEFAULT 0 NOT NULL,
	"budget" numeric(14, 2),
	"approval" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"creation_hash" text NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_orders_number_unique" UNIQUE("number"),
	CONSTRAINT "order_status_valid" CHECK ("work_orders"."status" IN ('queued', 'completed', 'delivered')),
	CONSTRAINT "order_version_positive" CHECK ("work_orders"."version" > 0),
	CONSTRAINT "order_minutes_valid" CHECK ("work_orders"."worked_minutes" BETWEEN 0 AND 10000000),
	CONSTRAINT "order_budget_positive" CHECK ("work_orders"."budget" IS NULL OR "work_orders"."budget" >= 0),
	CONSTRAINT "order_required_text" CHECK (length(trim("work_orders"."equipment")) BETWEEN 2 AND 160 AND length(trim("work_orders"."intake")) BETWEEN 3 AND 4000)
);
--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_work_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_actor_id_app_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assigned_to_app_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_updated_by_app_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_customer_idx" ON "work_orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "order_assignee_idx" ON "work_orders" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "work_orders" USING btree ("status");