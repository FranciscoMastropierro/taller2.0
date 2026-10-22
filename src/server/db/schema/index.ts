import { check, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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
