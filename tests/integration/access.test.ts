import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { eq, sql } from "drizzle-orm";
import * as schema from "../../src/server/db/schema";
import { getDatabaseUrl } from "../../src/server/env";
import { authenticate, authorizeIdentity, changeAccess, consumeLoginAttempt, createInitialAdmin, recoverUser } from "../../src/server/auth/service";
import { hashPassword } from "../../src/server/auth/password";
config({ path: ".env.local", quiet: true });
// Una DB nombrada explícitamente para pruebas. Nunca resetear esquemas compartidos.
const url = getDatabaseUrl("TEST_DATABASE_URL");
if (!new URL(url).pathname.endsWith("_test")) throw new Error("TEST_DATABASE_URL debe apuntar a base terminada en _test");
const pool = new Pool({ connectionString: url, max: 8 });
const db = drizzle(pool, { schema });
const secret = "synthetic-integration-test-secret-123456";
const suffix = randomUUID().slice(0, 8);
let admin: { id: string; sessionVersion: number };
let tech: { id: string; sessionVersion: number };
let passwordHash: string;
function permissionDenied(error: unknown) {
  const value = error as { code?: string; cause?: { code?: string } };
  return value.code === "42501" || value.cause?.code === "42501";
}
before(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" });
  await db.execute(sql`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'galante_runtime') THEN CREATE ROLE galante_runtime NOLOGIN; END IF; END $$`);
  await pool.query(await readFile("scripts/runtime-grants.sql", "utf8"));
  // Ejecución de integración en DB vacía: bootstrap no destructivo y repetible.
  const existing = await db.select().from(schema.appUsers).where(eq(schema.appUsers.username, "test.admin"));
  if (!existing.length) await createInitialAdmin(db, { username: "test.admin", displayName: "Administrador sintético", password: "synthetic-admin-password" });
  const [owner] = await db.select().from(schema.appUsers).where(eq(schema.appUsers.username, "test.admin"));
  admin = { id: owner.id, sessionVersion: owner.sessionVersion };
  passwordHash = await hashPassword("synthetic-tech-password");
  const [technician] = await db.insert(schema.appUsers).values({ username: `tech.${suffix}`, displayName: "Técnico sintético", passwordHash, role: "technician" }).returning();
  tech = { id: technician.id, sessionVersion: technician.sessionVersion };
});
after(async () => { await pool.end(); });
test("bootstrap no puede recrearse y migración es repetible", async () => {
  await migrate(db, { migrationsFolder: "./drizzle" });
  await assert.rejects(createInitialAdmin(db, { username: "second.admin", displayName: "Otro", password: "synthetic-new-password" }), /BOOTSTRAP_ALREADY_COMPLETED/);
});
test("rol runtime consulta pero no puede crear tablas ni borrar usuarios", async () => {
  await db.transaction(async tx => {
    await tx.execute(sql`SET LOCAL ROLE galante_runtime`);
    const rows = await tx.select({ id: schema.appUsers.id }).from(schema.appUsers).limit(1);
    assert.ok(rows.length);
  });
  await assert.rejects(db.transaction(async tx => {
    await tx.execute(sql`SET LOCAL ROLE galante_runtime`);
    await tx.execute(sql`CREATE TABLE forbidden_runtime_table (id integer)`);
  }), permissionDenied);
  await assert.rejects(db.transaction(async tx => {
    await tx.execute(sql`SET LOCAL ROLE galante_runtime`);
    await tx.delete(schema.appUsers).where(eq(schema.appUsers.id, randomUUID()));
  }), permissionDenied);
});
test("login real, password incorrecta y usuario inexistente", async () => {
  assert.equal((await authenticate(db, { username: `TECH.${suffix}`, password: "synthetic-tech-password" }, secret))?.id, tech.id);
  assert.equal(await authenticate(db, { username: `tech.${suffix}`, password: "wrong" }, secret), null);
  assert.equal(await authenticate(db, { username: `missing.${suffix}`, password: "wrong" }, secret), null);
});
test("identidad no puede declarar su rol; se consulta rol actual", async () => {
  await assert.rejects(authorizeIdentity(db, { ...tech, role: "admin" }, "users:manage"), { message: "FORBIDDEN" });
  assert.equal((await authorizeIdentity(db, admin, "users:manage")).role, "admin");
  await assert.rejects(authorizeIdentity(db, null), { message: "UNAUTHORIZED" });
  await assert.rejects(authorizeIdentity(db, { id: randomUUID(), sessionVersion: 1 }), { message: "UNAUTHORIZED" });
});
test("límite persistente atómico permite sólo ocho intentos concurrentes", async () => {
  const username = `limited.${suffix}`;
  const attempts = await Promise.all(Array.from({ length: 16 }, () => consumeLoginAttempt(db, username, secret)));
  assert.equal(attempts.filter(Boolean).length, 8);
  assert.equal(await consumeLoginAttempt(db, username, secret), false);
  await db.execute(sql`update login_limits set window_start = now() - interval '16 minutes'`);
  assert.equal(await consumeLoginAttempt(db, username, secret), true);
});
test("desactivar usuario y cambiar rol invalida token anterior", async () => {
  await changeAccess(db, admin, tech.id, { role: "readonly", active: false });
  await assert.rejects(authorizeIdentity(db, tech), { message: "UNAUTHORIZED" });
  assert.equal(await authenticate(db, { username: `tech.${suffix}`, password: "synthetic-tech-password" }, secret), null);
  await changeAccess(db, admin, tech.id, { role: "readonly", active: true });
  const session = await authenticate(db, { username: `tech.${suffix}`, password: "synthetic-tech-password" }, secret);
  assert.ok(session);
  assert.equal((await authorizeIdentity(db, session)).role, "readonly");
  await assert.rejects(authorizeIdentity(db, session, "finance:read"), { message: "FORBIDDEN" });
});
test("recuperar contraseña revoca sesión y deja auditoría", async () => {
  const session = await authenticate(db, { username: `tech.${suffix}`, password: "synthetic-tech-password" }, secret);
  await recoverUser(db, `tech.${suffix}`, "synthetic-recovered-password");
  await assert.rejects(authorizeIdentity(db, session), { message: "UNAUTHORIZED" });
  assert.equal(await authenticate(db, { username: `tech.${suffix}`, password: "synthetic-tech-password" }, secret), null);
  assert.ok(await authenticate(db, { username: `tech.${suffix}`, password: "synthetic-recovered-password" }, secret));
  const rows = await db.select().from(schema.accessAudit).where(eq(schema.accessAudit.targetId, tech.id));
  assert.ok(rows.some(row => row.action === "local_password_recovery"));
});
test("último administrador protegido y comando no autorizado sin cambios", async () => {
  await assert.rejects(changeAccess(db, admin, admin.id, { role: "readonly", active: false }), /LAST_ADMIN/);
  await assert.rejects(changeAccess(db, tech, admin.id, { role: "readonly", active: false }));
  assert.equal((await authorizeIdentity(db, admin)).role, "admin");
});
