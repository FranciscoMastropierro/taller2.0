import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { config } from "dotenv";
import { getDatabaseUrl } from "../../src/server/env";
import { appUsers } from "../../src/server/db/schema";
import { hashPassword } from "../../src/server/auth/password";
config({ path: ".env.local", quiet: true });
const pool = new Pool({ connectionString: getDatabaseUrl("TEST_DATABASE_URL") });
const db = drizzle(pool);
const username = `browser.${randomUUID().slice(0, 8)}`;
const password = randomUUID();
let userId: string;
test.beforeAll(async () => {
  const [user] = await db.insert(appUsers).values({ username, displayName: "Prueba de navegador", role: "reception", passwordHash: await hashPassword(password) }).returning({ id: appUsers.id });
  userId = user.id;
});
test.afterAll(async () => { await db.delete(appUsers).where(eq(appUsers.id, userId)); await pool.end(); });
test("ingreso, acceso directo denegado, revocación y logout", async ({ page }) => {
  expect((await page.request.get("/api/me")).status()).toBe(401);
  expect((await page.request.get("/api/admin/users")).status()).toBe(401);
  await page.goto("/");
  await expect(page).toHaveURL(/ingresar/);
  await page.getByLabel("Usuario", { exact: true }).fill(username);
  await page.getByLabel("Contraseña", { exact: true }).fill("incorrecta");
  await page.getByRole("button", { name: "Ingresar al taller" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Usuario", { exact: true })).toHaveValue(username);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar al taller" }).click();
  await expect(page.getByRole("heading", { name: "Bienvenido al taller." })).toBeVisible();
  const response = await page.request.get("/api/me");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(await response.json()).toMatchObject({ role: "reception" });
  expect((await page.request.get("/api/admin/users")).status()).toBe(403);
  await expect(page.locator("section").filter({ has: page.getByRole("link") })).toHaveCount(4);
  await page.goto("/cheques");
  await expect(page.getByRole("status")).toContainText("Este módulo está en preparación");
  await page.goto("/comprobantes");
  await expect(page.getByRole("heading", { name: "Recibos de cobro", exact: true })).toBeVisible();
  await page.goto("/");
  await page.screenshot({ path: "test-results/portada.png", fullPage: true });
  await db.update(appUsers).set({ sessionVersion: sql`${appUsers.sessionVersion} + 1` }).where(eq(appUsers.id, userId));
  expect((await page.request.get("/api/me")).status()).toBe(401);
  await page.reload();
  await expect(page).toHaveURL(/ingresar/);
  await page.getByLabel("Usuario", { exact: true }).fill(username);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar al taller" }).click();
  await expect(page.getByRole("heading", { name: "Bienvenido al taller." })).toBeVisible();
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/ingresar/);
  expect((await page.request.get("/api/me")).status()).toBe(401);
  await page.screenshot({ path: "test-results/ingreso.png", fullPage: true });
});

test("perfiles históricos: sesión previa y login nuevo denegados", async ({ page }) => {
  for (const role of ["technician", "readonly"] as const) {
    await db.update(appUsers).set({ role: "reception" }).where(eq(appUsers.id, userId));
    await page.goto("/ingresar");
    await page.getByLabel("Usuario", { exact: true }).fill(username);
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Ingresar al taller" }).click();
    await expect(page.getByRole("heading", { name: "Bienvenido al taller." })).toBeVisible();
    await db.update(appUsers).set({ role }).where(eq(appUsers.id, userId));
    for (const route of ["/api/me", "/api/admin/users"]) expect((await page.request.get(route)).status()).toBe(403);
    for (const route of ["/clientes", "/ordenes"]) {
      await page.goto(route);
      await expect(page).toHaveURL(/ingresar/);
    }
    await page.getByLabel("Usuario", { exact: true }).fill(username);
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Ingresar al taller" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await page.context().clearCookies();
  }
  for (const route of ["/cheques", "/comprobantes"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/ingresar/);
  }
});
