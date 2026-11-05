import { createHash } from "node:crypto";
import { and, count, desc, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../db";
import { customers, deliveryNotes, historicalOrders, orderEvents, workOrders } from "../db/schema";
import { authorizeActor, authorizeIdentity } from "../auth/service";
import { AccountError } from "../accounts/service";
import { deliveryNoteSchema, type DeliverySnapshot } from "../../shared/contracts/documents";

export async function createDeliveryNote(db: Database, identity: unknown, input: unknown) {
  const data = deliveryNoteSchema.parse(input);
  const { id: _id, ...payload } = data;
  void _id;
  const payloadHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  return db.transaction(async tx => {
    const actor = await authorizeActor(tx, identity, "work:write");
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${data.id}, 0))`);
    const [existingById] = await tx.select().from(deliveryNotes).where(eq(deliveryNotes.id, data.id));
    if (existingById) {
      if (existingById.payloadHash !== payloadHash) throw new AccountError("La constancia ya existe con otros datos.");
      return existingById.id;
    }
    const [order] = await tx.select().from(workOrders).where(eq(workOrders.id, data.orderId)).for("share");
    if (!order || order.status !== "delivered") throw new AccountError("La orden debe tener una entrega registrada.");
    if (order.version !== data.version) throw new AccountError("La orden cambió. Abrí su versión actual.");
    const [event] = await tx.select().from(orderEvents).where(and(eq(orderEvents.orderId, order.id), or(eq(orderEvents.kind, "status"), eq(orderEvents.kind, "correction")), sql`${orderEvents.after}->>'status' = 'delivered'`, sql`${orderEvents.before}->>'status' IS DISTINCT FROM 'delivered'`)).orderBy(desc(orderEvents.version)).limit(1);
    if (!event) throw new AccountError("No hay un evento de entrega para documentar.");
    // Serializa la identidad del documento también cuando llegan UUID diferentes.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${event.id}, 0))`);
    const [existing] = await tx.select().from(deliveryNotes).where(eq(deliveryNotes.sourceEventId, event.id));
    if (existing) {
      if (existing.payloadHash !== payloadHash) throw new AccountError("Esta entrega ya tiene una constancia con otros datos.");
      return existing.id;
    }
    const [customer] = await tx.select().from(customers).where(eq(customers.id, order.customerId)).for("share");
    const [history] = await tx.select({ number: historicalOrders.legacyNumber }).from(historicalOrders).where(eq(historicalOrders.continuedOrderId, order.id));
    const snapshot: DeliverySnapshot = { orderNumber: order.number, legacyNumber: history?.number ?? null, orderVersion: order.version, customer: { name: customer.name, document: customer.document, address: customer.address }, equipment: order.equipment, brand: order.brand, model: order.model, serialNumber: order.serialNumber, workDone: order.workDone, receiver: data.receiver, date: data.date, note: data.note };
    await tx.insert(deliveryNotes).values({ id: data.id, orderId: order.id, sourceEventId: event.id, snapshot, payloadHash, createdBy: actor.id });
    return data.id;
  });
}
export async function readDeliveryNote(db: Database, identity: unknown, id: string) {
  await authorizeIdentity(db, identity, "work:read");
  if (!z.uuid().safeParse(id).success) return null;
  const [note] = await db.select().from(deliveryNotes).where(eq(deliveryNotes.id, id));
  return note ?? null;
}
export async function listDeliveryNotes(db: Database, identity: unknown, page = 1, orderId?: string) {
  await authorizeIdentity(db, identity, "work:read");
  const filter = orderId ? eq(deliveryNotes.orderId, orderId) : undefined;
  const [rows, [total]] = await Promise.all([
    db.select().from(deliveryNotes).where(filter).orderBy(desc(deliveryNotes.number)).limit(25).offset((page - 1) * 25),
    db.select({ count: count() }).from(deliveryNotes).where(filter),
  ]);
  return { rows, total: total.count };
}
