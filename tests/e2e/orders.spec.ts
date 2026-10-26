import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, inArray } from "drizzle-orm";
import { getDatabaseUrl } from "../../src/server/env";
import { appUsers, customers, orderEvents, workOrders } from "../../src/server/db/schema";
import * as schema from "../../src/server/db/schema";
import { hashPassword } from "../../src/server/auth/password";
import { createOrder } from "../../src/server/orders/service";

test.use({ actionTimeout: 15000 });
const pool = new Pool({ connectionString: getDatabaseUrl("TEST_DATABASE_URL") });
const db = drizzle(pool, { schema });
const suffix = randomUUID().slice(0, 8);
const password = randomUUID();
let admin: typeof appUsers.$inferSelect;
let tech: typeof appUsers.$inferSelect;
let customer: typeof customers.$inferSelect;
const seededId = randomUUID();
const hiddenBudget = "918273.45";

test.beforeAll(async () => {
  const passwordHash = await hashPassword(password);
  [admin, tech] = await db.insert(appUsers).values([
    { username: `order.browser.${suffix}`, displayName: "Recepción de equipos", role: "admin", passwordHash },
    { username: `order.tech.${suffix}`, displayName: "Técnico de equipos", role: "technician", passwordHash },
  ]).returning();
  [customer] = await db.insert(customers).values({ name: `Cliente de órdenes ${suffix}`, phone: "011 5555 0202", createdBy: admin.id, updatedBy: admin.id }).returning();
  await createOrder(db, admin, { id: seededId, customerId: customer.id, equipment: `Equipo técnico ${suffix}`, brand: "", model: "", serialNumber: "", intake: "Revisar funcionamiento", notes: "", location: "Mesa técnica", assignedTo: tech.id, diagnosis: "", workDone: "", workedMinutes: 0, budget: hiddenBudget, approval: "EVIDENCIA_PRIVADA_NO_VISIBLE" });
});
test.afterAll(async () => {
  if (customer) {
    const orders = await db.select({ id: workOrders.id }).from(workOrders).where(eq(workOrders.customerId, customer.id));
    if (orders.length) await db.delete(orderEvents).where(inArray(orderEvents.orderId, orders.map(order => order.id)));
    await db.delete(workOrders).where(eq(workOrders.customerId, customer.id));
    await db.delete(customers).where(eq(customers.id, customer.id));
  }
  if (admin && tech) await db.delete(appUsers).where(inArray(appUsers.id, [admin.id, tech.id]));
  await pool.end();
});
async function login(page: Page, username: string) {
  await page.goto("/ordenes");
  await expect(page).toHaveURL(/ingresar/);
  await page.getByLabel("Usuario", { exact: true }).fill(username);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar al taller" }).click();
  await expect(page.getByRole("heading", { name: "Bienvenido al taller." })).toBeVisible();
}

test("órdenes: ingreso desde cliente, búsqueda, conflicto, terminación, entrega y corrección", async ({ page, context }) => {
  test.setTimeout(120000);
  const equipment = `Taladro de prueba ${suffix}`;
  await login(page, admin.username);
  await page.goto(`/clientes/${customer.id}`);
  await page.getByRole("link", { name: "Nueva orden para este cliente" }).click();
  await expect(page.getByText(customer.name, { exact: true })).toBeVisible();
  await page.getByLabel("Equipo *", { exact: true }).fill(equipment);
  await page.getByLabel("Marca", { exact: true }).fill("Marca de prueba");
  await page.getByLabel("Motivo de ingreso").fill("No enciende al conectar");
  await page.getByLabel("Mesa / ubicación", { exact: true }).fill("Mesa 2");
  await page.getByLabel("Técnico asignado", { exact: true }).selectOption(tech.id);
  await page.getByLabel("Presupuesto estimado (ARS)").fill("15000,50");
  await page.screenshot({ path: "test-results/ordenes-formulario.png", fullPage: true });
  await page.getByRole("button", { name: "Guardar orden", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Orden guardada", { timeout: 20000 });
  const detailUrl = page.url().split("?")[0];
  await expect(page.getByRole("heading", { name: equipment })).toBeVisible();
  await expect(page.getByText("ARS 15000.50", { exact: true })).toBeVisible();
  await page.goto("/ordenes");
  await page.getByLabel("BUSCAR", { exact: true }).fill(equipment);
  await page.getByLabel("ESTADO", { exact: true }).selectOption("queued");
  await page.getByLabel("MESA / UBICACIÓN", { exact: true }).fill("Mesa 2");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByRole("link", { name: new RegExp(equipment) })).toBeVisible();
  await page.screenshot({ path: "test-results/ordenes-listado.png", fullPage: true });
  await page.goto(`${detailUrl}?editar=1`);
  const stale = await context.newPage();
  await stale.goto(`${detailUrl}?editar=1`);
  await page.getByLabel("Diagnóstico", { exact: true }).fill("Interruptor dañado");
  await page.getByLabel("Trabajo realizado", { exact: true }).fill("Reemplazo de interruptor");
  await page.getByLabel("Tiempo trabajado acumulado (minutos)").fill("45");
  await page.getByRole("button", { name: "Guardar orden", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Orden guardada", { timeout: 20000 });
  await stale.getByLabel("Diagnóstico", { exact: true }).fill("Propuesta pendiente");
  await stale.getByRole("button", { name: "Guardar orden", exact: true }).click();
  await expect(stale.getByRole("alert").filter({ hasText: "La orden cambió" })).toBeVisible();
  await expect(stale.getByLabel("Diagnóstico", { exact: true })).toHaveValue("Propuesta pendiente");
  await stale.close();
  await page.getByRole("button", { name: "Marcar terminado", exact: true }).click();
  await expect(page.getByRole("button", { name: "Confirmar entrega", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Confirmar entrega", exact: true }).click();
  await expect(page.getByText("ENTREGADO", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Editar orden", exact: true })).toHaveCount(0);
  await page.getByText("Corregir estado", { exact: true }).click();
  await page.getByLabel("Estado corregido").selectOption("completed");
  await page.getByLabel("Motivo de corrección").fill("El cliente aún no retiró el equipo");
  await page.getByRole("button", { name: "Registrar corrección", exact: true }).click();
  await expect(page.getByText("Corrección administrativa", { exact: true })).toBeVisible();
  await expect(page.getByText("Motivo: El cliente aún no retiró el equipo", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/ordenes-ficha.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/ordenes-ficha-movil.png", fullPage: true });
});

test("técnico: campos técnicos, presupuesto oculto y pérdida de acceso al desasignar", async ({ page }) => {
  test.setTimeout(90000);
  await login(page, tech.username);
  await page.goto(`/ordenes/${seededId}`);
  await expect(page.getByRole("heading", { name: `Equipo técnico ${suffix}` })).toBeVisible();
  expect(await page.content()).not.toContain(hiddenBudget);
  expect(await page.content()).not.toContain("EVIDENCIA_PRIVADA_NO_VISIBLE");
  await expect(page.getByRole("button", { name: "Marcar terminado" })).toHaveCount(0);
  await page.getByRole("link", { name: "Actualizar seguimiento", exact: true }).click();
  await expect(page.getByLabel("Presupuesto estimado (ARS)")).toHaveCount(0);
  await expect(page.getByLabel("Técnico asignado", { exact: true })).toHaveCount(0);
  await page.getByLabel("Diagnóstico", { exact: true }).fill("Revisión técnica completa");
  await page.getByLabel("Tiempo trabajado acumulado (minutos)").fill("25");
  await page.getByRole("button", { name: "Guardar orden", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Orden guardada", { timeout: 20000 });
  await expect(page.getByText("25 minutos acumulados", { exact: true })).toBeVisible();
  await db.update(workOrders).set({ assignedTo: null }).where(eq(workOrders.id, seededId));
  const response = await page.goto(`/ordenes/${seededId}`);
  expect(response?.status()).toBe(404);
  await page.goto(`/ordenes?q=${encodeURIComponent(`Equipo técnico ${suffix}`)}`);
  await expect(page.getByRole("heading", { name: "No hay órdenes para mostrar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Nueva orden", exact: true })).toHaveCount(0);
});
