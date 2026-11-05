import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, inArray } from "drizzle-orm";
import { getDatabaseUrl } from "../../src/server/env";
import * as schema from "../../src/server/db/schema";
import { accountEntries, applicationBatches, appUsers, chequeMovements, creditApplications, creditReversals, customers, paymentComponents, paymentReceipts, thirdPartyCheques } from "../../src/server/db/schema";
import { hashPassword } from "../../src/server/auth/password";
import { createOpening } from "../../src/server/accounts/service";

const pool = new Pool({ connectionString: getDatabaseUrl("TEST_DATABASE_URL") });
const db = drizzle(pool, { schema });
const suffix = randomUUID().slice(0, 8), password = randomUUID();
let actorId: string, customerId: string;
test.beforeAll(async () => {
  const [actor] = await db.insert(appUsers).values({ username: `cheque.browser.${suffix}`, displayName: "Cartera navegador", role: "admin", passwordHash: await hashPassword(password) }).returning();
  actorId = actor.id;
  const [customer] = await db.insert(customers).values({ name: `Cliente cheque ${suffix}`, createdBy: actorId, updatedBy: actorId }).returning();
  customerId = customer.id;
  await createOpening(db, actor, { id: randomUUID(), customerId, direction: "debt", reference: `Obligación cheque ${suffix}`, amount: "100", date: "2026-10-27", evidence: "Apertura sintética revisada", reconciled: "on" });
  await db.update(appUsers).set({ role: "reception" }).where(eq(appUsers.id, actorId));
});
test.afterAll(async () => {
  if (customerId) {
    const cheques = await db.select().from(thirdPartyCheques).where(eq(thirdPartyCheques.customerId, customerId));
    if (cheques.length) {
      const ids = cheques.map(row => row.id);
      await db.delete(creditReversals).where(inArray(creditReversals.chequeId, ids));
      await db.delete(chequeMovements).where(inArray(chequeMovements.chequeId, ids));
      await db.delete(thirdPartyCheques).where(inArray(thirdPartyCheques.id, ids));
    }
    await db.delete(creditApplications).where(eq(creditApplications.customerId, customerId));
    const receipts = await db.select().from(paymentReceipts).where(eq(paymentReceipts.customerId, customerId));
    if (receipts.length) await db.delete(paymentComponents).where(inArray(paymentComponents.receiptId, receipts.map(row => row.id)));
    await db.delete(paymentReceipts).where(eq(paymentReceipts.customerId, customerId));
    await db.delete(applicationBatches).where(eq(applicationBatches.customerId, customerId));
    await db.delete(accountEntries).where(eq(accountEntries.customerId, customerId));
    await db.delete(customers).where(eq(customers.id, customerId));
  }
  if (actorId) await db.delete(appUsers).where(eq(appUsers.id, actorId));
  await pool.end();
});
test("recibir cheque, depositar, acreditar y rechazar sin duplicar crédito", async ({ page }) => {
  await page.goto(`/clientes/${customerId}/cuenta`);
  await page.getByLabel("Usuario", { exact: true }).fill(`cheque.browser.${suffix}`);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar al taller" }).click();
  await expect(page.getByRole("heading", { name: "Bienvenido al taller." })).toBeVisible();
  await page.goto(`/clientes/${customerId}/cuenta`);
  const form = page.getByRole("form", { name: "Registrar cobro", exact: true });
  await form.getByLabel("Medio 1").selectOption("cheque");
  await form.getByLabel("Importe 1 ARS").fill("100");
  await form.getByLabel("Banco del cheque").fill("Banco sintético");
  await form.getByLabel("Cuenta libradora").fill(`Cuenta-${suffix}`);
  await form.getByLabel("Número de cheque").fill(`CH-${suffix}`);
  await form.getByLabel("Entregante del cheque").fill("Entregante sintético");
  await form.getByLabel("Fecha de emisión del cheque").fill("2026-10-20");
  await form.getByLabel("Fecha de pago del cheque").fill("2026-10-27");
  await form.getByLabel(new RegExp(`Obligación cheque ${suffix}`)).fill("100");
  await form.getByRole("button", { name: "Registrar cobro y recibo" }).click();
  await expect(page).toHaveURL(/\/comprobantes\/recibos\//);
  await page.getByRole("link", { name: "Consultar estado vigente" }).click();
  await expect(page.getByText("En cartera · ARS 100.00", { exact: true })).toBeVisible();
  await page.getByLabel("Motivo / respaldo").fill("Depósito confirmado para prueba");
  await page.getByRole("button", { name: "Registrar movimiento", exact: true }).click();
  await expect(page.getByText("Depositado · ARS 100.00", { exact: true })).toBeVisible();
  await page.getByLabel("Motivo / respaldo").fill("Acreditación confirmada para prueba");
  await page.getByRole("button", { name: "Registrar movimiento", exact: true }).click();
  await expect(page.getByText("Acreditado · ARS 100.00", { exact: true })).toBeVisible();
  await page.getByLabel("Motivo / respaldo").fill("Rechazo bancario confirmado para prueba");
  await page.getByRole("button", { name: "Registrar movimiento", exact: true }).click();
  await expect(page.getByText("Rechazado · ARS 100.00", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Registrar movimiento", exact: true })).toHaveCount(0);
  await page.screenshot({ path: "test-results/cheque-rechazado.png", fullPage: true });
  await page.goto(`/clientes/${customerId}/cuenta`);
  await expect(page.locator("dl > div").filter({ hasText: "Deuda pendiente" }).getByText("ARS 100.00", { exact: true })).toBeVisible();
});
