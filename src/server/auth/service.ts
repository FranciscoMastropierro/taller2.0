import { createHmac } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../db";
import { appUsers, accessAudit } from "../db/schema";
import { loginSchema, newPasswordSchema, roles } from "../../shared/contracts/auth";
import { dummyHash, hashPassword, verifyPassword } from "./password";
import { AccessError, can, type Permission } from "./permissions";

export async function consumeLoginAttempt(db: Database, username: string, secret: string) {
  const key = createHmac("sha256", secret).update(username).digest("hex");
  // UPSERT serializa intentos del mismo usuario, incluso entre instancias.
  const result = await db.execute(sql`
    INSERT INTO login_limits (key, attempts, window_start) VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN login_limits.window_start <= now() - interval '15 minutes' THEN 1 ELSE least(login_limits.attempts + 1, 9) END,
      window_start = CASE WHEN login_limits.window_start <= now() - interval '15 minutes' THEN now() ELSE login_limits.window_start END
    RETURNING attempts`);
  return Number(result.rows[0].attempts) <= 8;
}

export async function authenticate(db: Database, input: unknown, secret: string) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return null;
  const { username, password } = parsed.data;
  if (!await consumeLoginAttempt(db, username, secret)) return null;
  const [user] = await db.select().from(appUsers).where(eq(appUsers.username, username)).limit(1);
  const valid = await verifyPassword(user?.passwordHash ?? await dummyHash(), password);
  if (!user || !valid || user.active !== 1) return null;
  return { id: user.id, name: user.displayName, sessionVersion: user.sessionVersion };
}

const identitySchema = z.object({ id: z.string().uuid(), sessionVersion: z.number().int().positive() });
export async function authorizeIdentity(db: Database, identity: unknown, permission: Permission = "work:read") {
  const parsed = identitySchema.safeParse(identity);
  if (!parsed.success) throw new AccessError(401);
  const [user] = await db.select({ id: appUsers.id, username: appUsers.username, displayName: appUsers.displayName, role: appUsers.role, active: appUsers.active, sessionVersion: appUsers.sessionVersion })
    .from(appUsers).where(and(eq(appUsers.id, parsed.data.id), eq(appUsers.sessionVersion, parsed.data.sessionVersion), eq(appUsers.active, 1))).limit(1);
  if (!user) throw new AccessError(401);
  if (!can(user.role, permission)) throw new AccessError(403);
  return user;
}

// Comandos administrativos locales. No hay endpoint público ni alta anónima.
export async function createInitialAdmin(db: Database, input: { username: string; password: string; displayName: string }) {
  const username = loginSchema.shape.username.parse(input.username);
  const password = newPasswordSchema.parse(input.password);
  const displayName = z.string().trim().min(1).max(100).parse(input.displayName);
  const passwordHash = await hashPassword(password);
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(74192001)`);
    const existing = await tx.select({ id: appUsers.id }).from(appUsers).limit(1);
    if (existing.length) throw new Error("BOOTSTRAP_ALREADY_COMPLETED");
    const [user] = await tx.insert(appUsers).values({ username, displayName, passwordHash, role: "admin" }).returning({ id: appUsers.id });
    await tx.insert(accessAudit).values({ targetId: user.id, action: "bootstrap" });
    return user;
  });
}

export async function recoverUser(db: Database, usernameInput: string, passwordInput: string) {
  const username = loginSchema.shape.username.parse(usernameInput);
  const passwordHash = await hashPassword(newPasswordSchema.parse(passwordInput));
  return db.transaction(async tx => {
    const [user] = await tx.update(appUsers).set({ passwordHash, sessionVersion: sql`${appUsers.sessionVersion} + 1` }).where(eq(appUsers.username, username)).returning({ id: appUsers.id });
    if (!user) throw new Error("USER_NOT_FOUND");
    await tx.insert(accessAudit).values({ targetId: user.id, action: "local_password_recovery" });
    return user;
  });
}

export async function changeAccess(db: Database, identity: unknown, targetId: string, input: { role: unknown; active: unknown }) {
  const values = z.object({ role: z.enum(roles), active: z.boolean() }).parse(input);
  return db.transaction(async tx => {
    // Bloqueo común impide que dos administradores desactiven al otro simultáneamente.
    await tx.execute(sql`select pg_advisory_xact_lock(74192001)`);
    const actor = await authorizeIdentity(tx as unknown as Database, identity, "users:manage");
    const [target] = await tx.select().from(appUsers).where(eq(appUsers.id, z.string().uuid().parse(targetId))).for("update");
    if (!target) throw new Error("USER_NOT_FOUND");
    if (target.role === "admin" && target.active === 1 && (values.role !== "admin" || !values.active)) {
      const admins = await tx.select({ id: appUsers.id }).from(appUsers).where(and(eq(appUsers.role, "admin"), eq(appUsers.active, 1)));
      if (admins.length <= 1) throw new Error("LAST_ADMIN");
    }
    await tx.update(appUsers).set({ role: values.role, active: values.active ? 1 : 0, sessionVersion: sql`${appUsers.sessionVersion} + 1` }).where(eq(appUsers.id, targetId));
    await tx.insert(accessAudit).values({ actorId: actor.id, targetId, action: "access_changed" });
  });
}
