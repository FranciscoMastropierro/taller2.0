import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { getDatabaseUrl } from "../../src/server/env";
import { appUsers, customers } from "../../src/server/db/schema";
import { hashPassword } from "../../src/server/auth/password";

test.use({ actionTimeout: 15000 });

const pool = new Pool({ connectionString: getDatabaseUrl("TEST_DATABASE_URL") });
const db = drizzle(pool);
const username = `customer.${randomUUID().slice(0, 8)}`;
const password = randomUUID();
let userId: string;

test.beforeAll(async () => {
  const [user] = await db.insert(appUsers).values({ username, displayName: "Recepción de prueba", role: "reception", passwordHash: await hashPassword(password) }).returning();
  userId = user.id;
});
test.afterAll(async () => {
  if (userId) {
    await db.delete(customers).where(eq(customers.createdBy, userId));
    await db.delete(appUsers).where(eq(appUsers.id, userId));
  }
  await pool.end();
});

test("clientes: alta, búsqueda, edición, conflicto y permisos de consulta", async ({ page, context }) => {
  test.setTimeout(90000);
  const name = `Cliente sintético ${randomUUID().slice(0, 8)}`;
  await page.goto("/clientes");
  await expect(page).toHaveURL(/ingresar/);
  await page.getByLabel("Usuario", { exact: true }).fill(username);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar al taller" }).click();
  await page.getByRole("link", { name: "Abrir clientes" }).click();
  await page.getByRole("link", { name: "Nuevo cliente" }).click();
  await page.getByLabel("Nombre o razón social").fill(name);
  await page.getByLabel("Teléfono", { exact: true }).fill("011 5555 0101");
  await page.screenshot({ path: "test-results/clientes-formulario.png", fullPage: true });
  await page.getByRole("button", { name: "Guardar cliente" }).click();
  await expect(page.getByRole("status")).toContainText("guardado correctamente", { timeout: 20000 });
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  const detailUrl = page.url().split("?")[0];
  await page.goto(`${detailUrl}?editar=1`);
  const stale = await context.newPage();
  await stale.goto(`${detailUrl}?editar=1`);
  await page.getByLabel("Dirección", { exact: true }).fill("Dirección actualizada");
  await page.getByRole("button", { name: "Guardar cliente" }).click();
  await expect(page.getByRole("status")).toBeVisible({ timeout: 20000 });
  await stale.getByLabel("Dirección", { exact: true }).fill("Propuesta concurrente");
  await stale.getByRole("button", { name: "Guardar cliente" }).click();
  await expect(stale.getByRole("alert").filter({ hasText: "El cliente cambió" })).toContainText("El cliente cambió");
  await expect(stale.getByLabel("Dirección", { exact: true })).toHaveValue("Propuesta concurrente");
  await stale.close();
  await page.goto("/clientes");
  await page.getByLabel("Buscar clientes", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/clientes-listado.png", fullPage: true });
  await page.goto(`${detailUrl}?editar=1`);
  await db.update(appUsers).set({ role: "readonly" }).where(eq(appUsers.id, userId));
  await page.getByLabel("Dirección", { exact: true }).fill("Cambio sin permiso");
  await page.getByRole("button", { name: "Guardar cliente" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "no tenés permisos" })).toContainText("no tenés permisos");
  await page.goto("/clientes");
  await page.reload();
  await expect(page.getByRole("link", { name: "Nuevo cliente" })).toHaveCount(0);
  await page.goto(`${detailUrl}?editar=1`);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar cliente" })).toHaveCount(0);
  await expect(page.getByText("Dirección actualizada", { exact: true })).toBeVisible();
  await page.goto("/clientes/nuevo");
  await expect(page.getByRole("alert").filter({ hasText: "acceso de consulta" })).toContainText("acceso de consulta");
});
