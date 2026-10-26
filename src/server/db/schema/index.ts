import { check, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { roles } from "../../../shared/contracts/auth";
export const appRole = pgEnum("app_role", roles);
export const appUsers = pgTable("app_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: appRole("role").notNull(),
  active: integer("active").default(1).notNull(),
  sessionVersion: integer("session_version").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, t => [check("username_normalized", sql`${t.username} = lower(trim(${t.username})) AND ${t.username} ~ '^[a-z0-9._@-]{3,80}$'`), check("active_boolean", sql`${t.active} in (0,1)`), check("session_version_positive", sql`${t.sessionVersion} > 0`)]);
export const loginLimits = pgTable("login_limits", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
});
export const accessAudit = pgTable("access_audit", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => appUsers.id),
  targetId: uuid("target_id").references(() => appUsers.id).notNull(),
  action: text("action").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: integer("code").generatedAlwaysAsIdentity().notNull().unique(),
  name: text("name").notNull(),
  document: text("document").default("").notNull(),
  phone: text("phone").default("").notNull(),
  email: text("email").default("").notNull(),
  address: text("address").default("").notNull(),
  notes: text("notes").default("").notNull(),
  version: integer("version").default(1).notNull(),
  createdBy: uuid("created_by").references(() => appUsers.id).notNull(),
  updatedBy: uuid("updated_by").references(() => appUsers.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, t => [check("customer_name_length", sql`length(trim(${t.name})) BETWEEN 2 AND 160`), check("customer_version_positive", sql`${t.version} > 0`)]);

export const workOrders = pgTable("work_orders", {
  id: uuid("id").primaryKey(),
  number: integer("number").generatedAlwaysAsIdentity().notNull().unique(),
  customerId: uuid("customer_id").references(() => customers.id).notNull(),
  equipment: text("equipment").notNull(),
  brand: text("brand").default("").notNull(),
  model: text("model").default("").notNull(),
  serialNumber: text("serial_number").default("").notNull(),
  intake: text("intake").notNull(),
  notes: text("notes").default("").notNull(),
  location: text("location").default("").notNull(),
  assignedTo: uuid("assigned_to").references(() => appUsers.id),
  diagnosis: text("diagnosis").default("").notNull(),
  workDone: text("work_done").default("").notNull(),
  workedMinutes: integer("worked_minutes").default(0).notNull(),
  budget: numeric("budget", { precision: 14, scale: 2 }),
  approval: text("approval").default("").notNull(),
  status: text("status", { enum: ["queued", "completed", "delivered"] }).default("queued").notNull(),
  version: integer("version").default(1).notNull(),
  creationHash: text("creation_hash").notNull(),
  createdBy: uuid("created_by").references(() => appUsers.id).notNull(),
  updatedBy: uuid("updated_by").references(() => appUsers.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, t => [
  check("order_status_valid", sql`${t.status} IN ('queued', 'completed', 'delivered')`),
  check("order_version_positive", sql`${t.version} > 0`),
  check("order_minutes_valid", sql`${t.workedMinutes} BETWEEN 0 AND 10000000`),
  check("order_budget_positive", sql`${t.budget} IS NULL OR ${t.budget} >= 0`),
  check("order_required_text", sql`length(trim(${t.equipment})) BETWEEN 2 AND 160 AND length(trim(${t.intake})) BETWEEN 3 AND 4000`),
  index("order_customer_idx").on(t.customerId), index("order_assignee_idx").on(t.assignedTo), index("order_status_idx").on(t.status),
]);

export const orderEvents = pgTable("order_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => workOrders.id).notNull(),
  version: integer("version").notNull(),
  actorId: uuid("actor_id").references(() => appUsers.id).notNull(),
  kind: text("kind", { enum: ["created", "edited", "technical", "status", "correction"] }).notNull(),
  reason: text("reason").default("").notNull(),
  before: jsonb("before").$type<Record<string, unknown> | null>(),
  after: jsonb("after").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, t => [unique("order_event_version_unique").on(t.orderId, t.version), check("order_event_kind_valid", sql`${t.kind} IN ('created', 'edited', 'technical', 'status', 'correction')`)]);
