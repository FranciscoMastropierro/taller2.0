import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../../src/server/db";
import { appUsers, customers, orderEvents, workOrders } from "../../src/server/db/schema";
import { changeOrderStatus, createOrder, editOrder, listOrders, readOrder } from "../../src/server/orders/service";

export function registerOrderTests(context: () => { db: Database; admin: { id: string; sessionVersion: number }; passwordHash: string }) {
  test("órdenes: integridad, permisos, historial y concurrencia", async t => {
    const { db, admin, passwordHash } = context();
    const suffix = randomUUID().slice(0, 8);
    const users = await db.insert(appUsers).values([
      { username: `orders.rec.${suffix}`, displayName: "Recepción órdenes", passwordHash, role: "reception" as const },
      { username: `orders.tech.${suffix}`, displayName: "Técnico asignado", passwordHash, role: "technician" as const },
      { username: `orders.other.${suffix}`, displayName: "Otro técnico", passwordHash, role: "technician" as const },
      { username: `orders.read.${suffix}`, displayName: "Consulta órdenes", passwordHash, role: "readonly" as const },
    ]).returning();
    const [reception, tech, other, readonly] = users;
    const [customer] = await db.insert(customers).values({ name: `Cliente órdenes ${suffix}`, createdBy: admin.id, updatedBy: admin.id }).returning();
    const input = { id: randomUUID(), customerId: customer.id, equipment: "Motor de prueba", brand: "Marca sintética", model: "M1", serialNumber: "S1", intake: "No enciende", notes: "Ingreso de prueba", location: "Mesa 2", assignedTo: tech.id, diagnosis: "", workDone: "", workedMinutes: 0, budget: "123456789012,34", approval: "Aprobación de prueba" };
    try {
      await t.test("alta reutiliza cliente y conserva decimal exacto; reintento no duplica", async () => {
        const results = await Promise.all([createOrder(db, reception, input), createOrder(db, reception, input)]);
        assert.deepEqual(results, [input.id, input.id]);
        const result = await readOrder(db, reception, input.id);
        assert.equal(result?.order.customerId, customer.id);
        assert.equal(result?.order.budget, "123456789012.34");
        assert.equal(result?.order.status, "queued");
        assert.equal(result?.events.length, 1);
        await assert.rejects(createOrder(db, reception, { ...input, equipment: "Otro motor" }), /otros datos/);
      });
      await t.test("sólo el técnico asignado consulta; finanzas e historial se filtran", async () => {
        const result = await readOrder(db, tech, input.id);
        assert.equal(result?.order.budget, null);
        assert.equal(result?.order.approval, "");
        assert.equal("budget" in result!.events[0].after, false);
        assert.equal("approval" in result!.events[0].after, false);
        assert.equal(await readOrder(db, other, input.id), null);
        assert.equal((await listOrders(db, other, { q: "", location: "", page: 1, customerId: customer.id })).total, 0);
        const view = await readOrder(db, readonly, input.id);
        assert.equal(view?.order.budget, null);
        assert.equal("budget" in view!.events[0].after, false);
      });
      await t.test("consulta/técnico no ingresan ni avanzan; actor de payload no eleva permisos", async () => {
        await assert.rejects(createOrder(db, tech, { ...input, id: randomUUID(), role: "admin" }), /FORBIDDEN/);
        await assert.rejects(editOrder(db, readonly, { ...input, version: 1 }), /FORBIDDEN/);
        await assert.rejects(editOrder(db, other, { ...input, version: 1 }, true), /FORBIDDEN/);
        await assert.rejects(changeOrderStatus(db, tech, { id: input.id, version: 1, status: "completed", reason: "" }), /FORBIDDEN/);
        await assert.rejects(createOrder(db, { ...reception, sessionVersion: 9999 }, { ...input, id: randomUUID() }), /UNAUTHORIZED/);
      });
      await t.test("actualización técnica ignora campos financieros/administrativos inyectados", async () => {
        await editOrder(db, tech, { ...input, version: 1, diagnosis: "Bobina dañada", workDone: "Revisión inicial", workedMinutes: 35, budget: "1", assignedTo: other.id, status: "delivered" }, true);
        const result = await readOrder(db, admin, input.id);
        assert.equal(result?.order.diagnosis, "Bobina dañada");
        assert.equal(result?.order.workedMinutes, 35);
        assert.equal(result?.order.budget, "123456789012.34");
        assert.equal(result?.order.assignedTo, tech.id);
        assert.equal(result?.order.status, "queued");
        assert.equal(result?.events[1].kind, "technical");
      });
      await t.test("dos ediciones de una versión: un éxito y un conflicto sin evento extra", async () => {
        const results = await Promise.allSettled([
          editOrder(db, tech, { ...input, version: 2, diagnosis: "Propuesta A" }, true),
          editOrder(db, tech, { ...input, version: 2, diagnosis: "Propuesta B" }, true),
        ]);
        assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
        const rejected = results.find(result => result.status === "rejected") as PromiseRejectedResult;
        assert.match(rejected.reason.message, /cambió/);
        const result = await readOrder(db, admin, input.id);
        assert.equal(result?.order.version, 3);
        assert.equal(result?.events.length, 3);
      });
      await t.test("rollback si el historial falla: no persiste modificación parcial", async () => {
        // Provocar colisión de la versión del evento para comprobar rollback real.
        const [collision] = await db.insert(orderEvents).values({ orderId: input.id, version: 4, actorId: admin.id, kind: "edited", after: {} }).returning();
        const before = await readOrder(db, admin, input.id);
        try {
          await assert.rejects(editOrder(db, reception, { ...input, version: 3, notes: "No debe persistir" }));
          const after = await readOrder(db, admin, input.id);
          assert.equal(after?.order.version, before?.order.version);
          assert.equal(after?.order.notes, before?.order.notes);
          assert.equal(after?.events.length, before?.events.length);
        } finally { await db.delete(orderEvents).where(eq(orderEvents.id, collision.id)); }
      });
      await t.test("secuencia completa sin saltos; entregada no editable", async () => {
        await assert.rejects(changeOrderStatus(db, reception, { id: input.id, version: 3, status: "delivered", reason: "" }), /secuencia/);
        await changeOrderStatus(db, reception, { id: input.id, version: 3, status: "completed", reason: "" });
        await assert.rejects(changeOrderStatus(db, reception, { id: input.id, version: 3, status: "delivered", reason: "" }), /cambió/);
        await changeOrderStatus(db, reception, { id: input.id, version: 4, status: "delivered", reason: "" });
        await assert.rejects(editOrder(db, reception, { ...input, version: 5 }), /entregada/);
        const result = await readOrder(db, admin, input.id);
        assert.equal(result?.order.status, "delivered");
        assert.equal(result?.order.budget, "123456789012.34");
        assert.equal(result?.events.length, 5);
      });
      await t.test("corregir sólo administración con motivo y evento auditable", async () => {
        const correction = { id: input.id, version: 5, status: "queued", reason: "Entrega registrada por error" };
        await assert.rejects(changeOrderStatus(db, reception, correction, true), /FORBIDDEN/);
        await assert.rejects(changeOrderStatus(db, admin, { ...correction, reason: "" }, true), /motivo/);
        await changeOrderStatus(db, admin, correction, true);
        const result = await readOrder(db, admin, input.id);
        assert.equal(result?.order.status, "queued");
        assert.equal(result?.events.at(-1)?.reason, correction.reason);
        assert.equal(result?.events.at(-1)?.before?.status, "delivered");
        assert.equal(result?.events.at(-1)?.after.status, "queued");
        assert.equal(result?.events.at(-1)?.actorId, admin.id);
      });
      await t.test("edición conserva cliente y reasignación quita acceso al técnico anterior", async () => {
        await editOrder(db, reception, { ...input, version: 6, customerId: randomUUID(), assignedTo: other.id, location: "Estante B", budget: "0,10" });
        assert.equal(await readOrder(db, tech, input.id), null);
        const result = await readOrder(db, other, input.id);
        assert.equal(result?.order.customerId, customer.id);
        assert.equal(result?.order.location, "Estante B");
        const found = await listOrders(db, reception, { q: "Motor", location: "Estante", status: "queued", customerId: customer.id, page: 1 });
        assert.equal(found.total, 1);
        assert.equal(found.rows[0].id, input.id);
        assert.equal((await readOrder(db, admin, input.id))?.order.budget, "0.10");
        await db.update(appUsers).set({ active: 0 }).where(eq(appUsers.id, tech.id));
        try { assert.equal(await createOrder(db, reception, input), input.id, "reintento de ingreso sigue resolviendo al mismo ID aunque su técnico original esté inactivo"); }
        finally { await db.update(appUsers).set({ active: 1 }).where(eq(appUsers.id, tech.id)); }
      });
      await t.test("cliente/técnico inexistentes no dejan órdenes ni eventos", async () => {
        const id = randomUUID();
        await assert.rejects(createOrder(db, reception, { ...input, id, customerId: randomUUID() }), /cliente no existe/);
        await assert.rejects(createOrder(db, reception, { ...input, id, assignedTo: readonly.id }), /técnico seleccionado/);
        assert.equal(await readOrder(db, admin, id), null);
        assert.equal((await db.select().from(orderEvents).where(eq(orderEvents.orderId, id))).length, 0);
      });
      await t.test("rol runtime no borra órdenes ni modifica/borra historial", async () => {
        for (const query of [sql`DELETE FROM work_orders WHERE id = ${input.id}`, sql`UPDATE order_events SET reason = 'alterado' WHERE order_id = ${input.id}`, sql`DELETE FROM order_events WHERE order_id = ${input.id}`]) {
          await assert.rejects(db.transaction(async tx => { await tx.execute(sql`SET LOCAL ROLE galante_runtime`); await tx.execute(query); }), error => {
            const value = error as { code?: string; cause?: { code?: string } };
            return value.code === "42501" || value.cause?.code === "42501";
          });
        }
      });
    } finally {
      await db.delete(orderEvents).where(eq(orderEvents.orderId, input.id));
      await db.delete(workOrders).where(and(eq(workOrders.customerId, customer.id)));
      await db.delete(customers).where(eq(customers.id, customer.id));
      await db.delete(appUsers).where(inArray(appUsers.id, users.map(user => user.id)));
    }
  });
}
