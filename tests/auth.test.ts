import { test } from "node:test";
import assert from "node:assert/strict";
import { can } from "../src/server/auth/permissions";
import { hashPassword, verifyPassword } from "../src/server/auth/password";
import { loginSchema } from "../src/shared/contracts/auth";
import { getDatabaseUrl } from "../src/server/env";
test("roles operativos no elevan acceso financiero o administración", () => {
  assert.equal(can("technician", "finance:read"), false);
  assert.equal(can("readonly", "customers:write"), false);
  assert.equal(can("reception", "users:manage"), false);
  assert.equal(can("admin", "users:manage"), true);
});
test("normalización de usuario no modifica contraseña", () => {
  assert.deepEqual(loginSchema.parse({ username: "  ADMIN.Test ", password: " A b " }), { username: "admin.test", password: " A b " });
  assert.equal(loginSchema.safeParse({ username: "bad name", password: "x" }).success, false);
});
test("Argon2id usa sal y rechaza contraseña incorrecta", async () => {
  const first = await hashPassword("synthetic-password-123");
  const second = await hashPassword("synthetic-password-123");
  assert.notEqual(first, second);
  assert.match(first, /^\$argon2id\$v=19\$/);
  assert.deepEqual(first.split("$")[3].split(",").sort(), ["m=65536", "p=1", "t=3"]);
  assert.equal(await verifyPassword(first, "synthetic-password-123"), true);
  assert.equal(await verifyPassword(first, "incorrect-password"), false);
});
test("conexión remota sin TLS rechazada sin revelar URL", () => {
  const previous = process.env.DATABASE_URL;
  try {
    process.env.DATABASE_URL = "postgresql://secret:password@remote.example/db";
    assert.throws(() => getDatabaseUrl(), { message: "Configuración inválida: DATABASE_URL" });
  } finally { if (previous === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previous; }
});
