import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../../src/server/db";
import { accountEntries, appUsers, customers, deliveryNotes, orderEvents, workOrders } from "../../src/server/db/schema";
import { changeOrderStatus, createOrder, readOrder } from "../../src/server/orders/service";
import { createDeliveryNote, readDeliveryNote } from "../../src/server/documents/service";
import { generateReport } from "../../src/server/documents/reports";

export function registerDocumentTests(context: () => { db: Database; admin: { id: string; sessionVersion: number }; passwordHash: string }) {
  test("constancias: evento único, snapshot y ausencia de efectos comerciales", async t => {
    const { db, admin, passwordHash } = context();
    const [customer] = await db.insert(customers).values({ name: `Cliente constancia ${randomUUID().slice(0, 8)}`, createdBy: admin.id, updatedBy: admin.id }).returning();
    const [excluded] = await db.insert(appUsers).values({ username: `docs.old.${randomUUID().slice(0, 8)}`, displayName: "Histórico", role: "readonly", passwordHash }).returning();
    const orderId = randomUUID();
    const orderInput = { id: orderId, customerId: customer.id, equipment: "Motor constancia", brand: "Marca", model: "Modelo", serialNumber: "", intake: "Revisar motor", notes: "", location: "Mesa 1", assignedTo: "", diagnosis: "Bobinado", workDone: "Reparación sintética", workedMinutes: 60, budget: "100", approval: "" };
    const input = { id: randomUUID(), orderId, version: 3, receiver: "Retirante sintético", date: "2026-10-27", note: "Documento interno de prueba" };
    let documentId: string;
    try {
      await createOrder(db, admin, orderInput);
      await t.test("no documentar antes de entregar; pendiente usa filtros y fecha de incorporación", async () => {
        await assert.rejects(createDeliveryNote(db, admin, { ...input, version: 1 }), /entrega registrada/);
        const pending = await generateReport(db, admin, { type: "pending", customer: customer.name });
        assert.equal(pending.rows.length, 1);
        assert.equal(pending.rows[0].values[3], "TURNO");
        const filtered = await generateReport(db, admin, { type: "pending", customer: customer.name, from: "1900-01-01", to: "1900-01-01" });
        assert.equal(filtered.rows.length, 0);
      });
      await changeOrderStatus(db, admin, { id: orderId, version: 1, status: "completed", reason: "" });
      await changeOrderStatus(db, admin, { id: orderId, version: 2, status: "delivered", reason: "" });
      await t.test("dos UUID para misma entrega generan una constancia; no alteran orden/libro", async () => {
        const before = await readOrder(db, admin, orderId);
        const results = await Promise.all([createDeliveryNote(db, admin, input), createDeliveryNote(db, admin, { ...input, id: randomUUID() })]);
        assert.equal(new Set(results).size, 1);
        documentId = results[0];
        assert.deepEqual(await readOrder(db, admin, orderId), before);
        assert.equal((await db.select().from(accountEntries).where(eq(accountEntries.customerId, customer.id))).length, 0);
        assert.equal((await generateReport(db, admin, { type: "pending", customer: customer.name })).rows.length, 0);
      });
      await t.test("reimpresión no cambia cliente original; versiones/payload/actor se validan", async () => {
        const before = await readDeliveryNote(db, admin, documentId);
        await db.update(customers).set({ name: "Cliente cambiado después de entrega" }).where(eq(customers.id, customer.id));
        assert.deepEqual(await readDeliveryNote(db, admin, documentId), before);
        await assert.rejects(createDeliveryNote(db, admin, { ...input, id: randomUUID(), receiver: "Otro receptor" }), /otros datos/);
        await assert.rejects(createDeliveryNote(db, admin, { ...input, id: randomUUID(), version: 2 }), /cambió/);
        await assert.rejects(createDeliveryNote(db, excluded, input), /FORBIDDEN/);
        await assert.rejects(readDeliveryNote(db, excluded, documentId), /FORBIDDEN/);
        await assert.rejects(generateReport(db, { ...admin, sessionVersion: 99999 }, {}), /UNAUTHORIZED/);
      });
      await t.test("runtime no modifica ni elimina constancias", async () => {
        for (const query of [sql`DELETE FROM delivery_notes`, sql`UPDATE delivery_notes SET snapshot='{}'::jsonb`]) {
          await assert.rejects(db.transaction(async tx => { await tx.execute(sql`SET LOCAL ROLE galante_runtime`); await tx.execute(query); }), error => {
            const e = error as { code?: string; cause?: { code?: string } };
            return e.code === "42501" || e.cause?.code === "42501";
          });
        }
      });
    } finally {
      await db.delete(deliveryNotes).where(eq(deliveryNotes.orderId, orderId));
      await db.delete(orderEvents).where(eq(orderEvents.orderId, orderId));
      await db.delete(workOrders).where(eq(workOrders.id, orderId));
      await db.delete(customers).where(eq(customers.id, customer.id));
      await db.delete(appUsers).where(inArray(appUsers.id, [excluded.id]));
    }
  });
}
