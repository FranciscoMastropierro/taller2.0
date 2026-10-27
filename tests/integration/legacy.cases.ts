import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../../src/server/db";
import { appUsers, customers, historicalOrders, importSources, orderEvents, orderSheets, workOrders } from "../../src/server/db/schema";
import { importLegacy, sourceNamespace } from "../../src/server/legacy/import";
import { continueHistoricalOrder, listHistoricalOrders } from "../../src/server/legacy/service";
import { readOrder, editOrder, listOrders } from "../../src/server/orders/service";
import { readOrderSheet, saveOrderSheet } from "../../src/server/orders/sheets";

export function registerLegacyTests(context: () => { db: Database; admin: { id: string; sessionVersion: number }; passwordHash: string }) {
  test("histórico e impresión: atomicidad, continuidad e instantáneas", async t => {
    const { db, admin, passwordHash } = context();
    const [actor] = await db.select().from(appUsers).where(eq(appUsers.id, admin.id));
    const customerRows = [{ id: 990001, legacy_codigo: 990001, cliente: "Cliente histórico sintético", direccion: "Dirección original", telefono: "555", localidad: "Localidad sintética" }];
    const orderRows = [{ id: 990001, legacy_num_trabajo: 990001, customer_id: 990001, marca: "Motor", modelo: "M1", estado_original: "PROCESO", fecha_ingreso: "0201-01-01T00:00:00", descripcion_ingreso: "Revisar bobinado", tiempo_original: "1,5 hs?", presupuesto_original: "Texto original" }, { id: 990002, legacy_num_trabajo: 990002, customer_id: null, estado_original: "ARCHIVADO" }];
    const hash = "a".repeat(64);
    let sourceId: string | undefined;
    let customerId: string | undefined;
    let historyId: string | undefined;
    let excludedId: string | undefined;
    try {
      await t.test("fallo de cliente revierte también fuente; carga completa y reintento preservan cambios", async () => {
        await assert.rejects(importLegacy(db, actor.username, hash, [{ ...customerRows[0], cliente: "x".repeat(161) }], orderRows));
        assert.equal((await db.select().from(importSources).where(eq(importSources.namespace, sourceNamespace))).length, 0);
        assert.equal((await importLegacy(db, actor.username, hash, customerRows.map(row => Object.assign(Object.create(null), row)), orderRows.map(row => Object.assign(Object.create(null), row)))).status, "imported");
        const [source] = await db.select().from(importSources).where(eq(importSources.namespace, sourceNamespace));
        sourceId = source.id;
        const [customer] = await db.select().from(customers).where(eq(customers.legacyCode, 990001));
        customerId = customer.id;
        await db.update(customers).set({ name: "Nombre actualizado" }).where(eq(customers.id, customerId));
        assert.equal((await importLegacy(db, actor.username, hash, customerRows, orderRows)).status, "already_imported");
        assert.equal((await db.select().from(customers).where(eq(customers.id, customerId)))[0].name, "Nombre actualizado");
        await assert.rejects(importLegacy(db, actor.username, "b".repeat(64), customerRows, orderRows), /SOURCE_CHANGED/);
        const history = await listHistoricalOrders(db, admin, "990001", 1);
        assert.equal(history.total, 1);
        historyId = history.rows[0].id;
        assert.deepEqual(history.rows[0].original, orderRows[0]);
      });
      await t.test("continuidad concurrente conserva identidad y no duplica; payload diferente rechazado", async () => {
        assert.ok(historyId); assert.ok(customerId);
        const input = { id: historyId, customerId, status: "queued" };
        assert.deepEqual(await Promise.all([continueHistoricalOrder(db, admin, input), continueHistoricalOrder(db, admin, input)]), [historyId, historyId]);
        await assert.rejects(continueHistoricalOrder(db, admin, { ...input, status: "completed" }), /otros datos/);
        assert.equal((await listHistoricalOrders(db, admin, "990001", 1)).total, 0);
        const current = await listOrders(db, admin, { q: "990001", location: "", page: 1 });
        assert.equal(current.total, 1);
        assert.equal(current.rows[0].id, historyId);
        const detail = await readOrder(db, admin, historyId);
        assert.equal(detail?.order.workedMinutes, 0);
        assert.equal(detail?.order.budget, null);
        assert.equal(detail?.events.length, 1);
      });
      await t.test("ficha concurrente idempotente y reimpresión inmutable tras editar cliente/orden", async () => {
        assert.ok(historyId); assert.ok(customerId);
        const input = { orderId: historyId, version: 1, kind: "intake" };
        const [first, second] = await Promise.all([saveOrderSheet(db, admin, input), saveOrderSheet(db, admin, input)]);
        assert.equal(first, second);
        const before = await readOrderSheet(db, admin, first);
        assert.equal(before?.snapshot.legacyNumber, 990001);
        assert.equal(before?.snapshot.date, orderRows[0].fecha_ingreso);
        await db.update(customers).set({ address: "Dirección cambiada" }).where(eq(customers.id, customerId));
        const detail = (await readOrder(db, admin, historyId))!;
        await editOrder(db, admin, { ...detail.order, version: 1, assignedTo: "", budget: "25.10", notes: "Datos nuevos" });
        assert.deepEqual(await readOrderSheet(db, admin, first), before);
        assert.equal(await saveOrderSheet(db, admin, input), first);
        await assert.rejects(saveOrderSheet(db, admin, { ...input, kind: "work" }), /cambió/);
        const current = await saveOrderSheet(db, admin, { ...input, version: 2, kind: "work" });
        assert.equal((await readOrderSheet(db, admin, current))?.snapshot.budget, "25.10");
        const after = (await readOrder(db, admin, historyId))!;
        assert.equal(after.order.version, 2);
        assert.equal(after.events.length, 2);
      });
      await t.test("perfil excluido y sesión vieja no imprimen ni continúan; runtime no altera snapshots", async () => {
        const [excluded] = await db.insert(appUsers).values({ username: `historical.${randomUUID().slice(0, 8)}`, displayName: "Excluido", role: "technician", passwordHash }).returning();
        excludedId = excluded.id;
        await assert.rejects(continueHistoricalOrder(db, excluded, { id: historyId, customerId, status: "queued" }), /FORBIDDEN/);
        await assert.rejects(saveOrderSheet(db, excluded, { orderId: historyId, version: 2, kind: "work" }), /FORBIDDEN/);
        await assert.rejects(saveOrderSheet(db, { ...admin, sessionVersion: 999999 }, { orderId: historyId, version: 2, kind: "work" }), /UNAUTHORIZED/);
        for (const query of [sql`UPDATE order_sheets SET snapshot = '{}'::jsonb`, sql`DELETE FROM order_sheets`]) {
          await assert.rejects(db.transaction(async tx => { await tx.execute(sql`SET LOCAL ROLE galante_runtime`); await tx.execute(query); }), error => {
            const e = error as { code?: string; cause?: { code?: string } };
            return e.code === "42501" || e.cause?.code === "42501";
          });
        }
      });
    } finally {
      if (sourceId) {
        const histories = await db.select().from(historicalOrders).where(eq(historicalOrders.sourceId, sourceId));
        const ids = histories.map(row => row.id);
        await db.delete(historicalOrders).where(eq(historicalOrders.sourceId, sourceId));
        if (ids.length) {
          await db.delete(orderSheets).where(inArray(orderSheets.orderId, ids));
          await db.delete(orderEvents).where(inArray(orderEvents.orderId, ids));
          await db.delete(workOrders).where(inArray(workOrders.id, ids));
        }
        await db.delete(importSources).where(eq(importSources.id, sourceId));
      }
      if (customerId) await db.delete(customers).where(eq(customers.id, customerId));
      if (excludedId) await db.delete(appUsers).where(eq(appUsers.id, excludedId));
    }
  });
}
