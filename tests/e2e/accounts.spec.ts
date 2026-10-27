import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { getDatabaseUrl } from "../../src/server/env";
import { accountEntries, appUsers, customers } from "../../src/server/db/schema";
import { hashPassword } from "../../src/server/auth/password";

const pool = new Pool({ connectionString: getDatabaseUrl("TEST_DATABASE_URL") });
const db = drizzle(pool);
const suffix = randomUUID().slice(0, 8);
const password = randomUUID();
let actorId: string;
let customerId: string;
test.beforeAll(async () => {
  const [user] = await db.insert(appUsers).values({ username: `account.browser.${suffix}`, displayName: "Administración cuenta", role: "admin", passwordHash: await hashPassword(password) }).returning();
  actorId = user.id;
  const [customer] = await db.insert(customers).values({ name: `Cuenta navegador ${suffix}`, createdBy: actorId, updatedBy: actorId }).returning();
  customerId = customer.id;
});
test.afterAll(async () => {
  if (customerId) {
    await db.delete(accountEntries).where(eq(accountEntries.customerId, customerId));
    await db.delete(customers).where(eq(customers.id, customerId));
  }
  if (actorId) await db.delete(appUsers).where(eq(appUsers.id, actorId));
  await pool.end();
});
test("cuenta vacía, apertura revisada y consulta de recepción", async ({ page }) => {
  await page.goto(`/clientes/${customerId}/cuenta`);
  await expect(page).toHaveURL(/ingresar/);
  await page.getByLabel("Usuario", { exact: true }).fill(`account.browser.${suffix}`);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar al taller" }).click();
  await expect(page.getByRole("heading", { name: "Bienvenido al taller." })).toBeVisible();
  await page.goto(`/clientes/${customerId}/cuenta`);
  await expect(page.getByText("Esta cuenta todavía no tiene aperturas conciliadas.", { exact: false })).toBeVisible();
  await page.getByLabel("Importe ARS", { exact: true }).fill("100,10");
  await page.getByLabel("Referencia única de origen").fill(`Documento revisado ${suffix}`);
  await page.getByLabel("Respaldo de conciliación").fill("Revisión sintética del documento de apertura");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Registrar apertura conciliada" }).click();
  await expect(page.getByRole("status")).toContainText("Apertura registrada");
  await expect(page.locator("dl").getByText("ARS 100.10", { exact: true })).toHaveCount(2);
  await db.update(appUsers).set({ role: "reception" }).where(eq(appUsers.id, actorId));
  await page.reload();
  await expect(page.getByRole("button", { name: "Registrar apertura conciliada" })).toHaveCount(0);
  await expect(page.locator("dl").getByText("ARS 100.10", { exact: true })).toHaveCount(2);
  await page.screenshot({ path: "test-results/cuenta-corriente.png", fullPage: true });
});
