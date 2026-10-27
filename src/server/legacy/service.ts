import { createHash } from "node:crypto";
import { and, count, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../db";
import { customers, historicalOrders, orderEvents, workOrders } from "../db/schema";
import { authorizeIdentity, authorizeActor } from "../auth/service";
import { OrderError } from "../orders/service";

export async function listHistoricalOrders(db: Database, identity: unknown, q: string, page: number, customerId?: string) {
  await authorizeIdentity(db, identity);
  const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
  const filter = and(isNull(historicalOrders.continuedOrderId), customerId ? eq(historicalOrders.customerId, customerId) : undefined, q ? or(ilike(sql`${historicalOrders.legacyNumber}::text`, pattern), ilike(customers.name, pattern), ilike(sql`${historicalOrders.original}->>'marca'`, pattern), ilike(sql`${historicalOrders.original}->>'modelo'`, pattern)) : undefined);
  const [rows, [total]] = await Promise.all([
    db.select({ id: historicalOrders.id, legacyNumber: historicalOrders.legacyNumber, original: historicalOrders.original, customerName: customers.name }).from(historicalOrders).leftJoin(customers, eq(customers.id, historicalOrders.customerId)).where(filter).orderBy(desc(historicalOrders.legacyNumber)).limit(25).offset((page - 1) * 25),
    db.select({ count: count() }).from(historicalOrders).leftJoin(customers, eq(customers.id, historicalOrders.customerId)).where(filter),
  ]);
  return { rows, total: total.count };
}

export async function readHistoricalOrder(db: Database, identity: unknown, id: string) {
  await authorizeIdentity(db, identity);
  if (!z.uuid().safeParse(id).success) return null;
  const [row] = await db.select({ history: historicalOrders, customerName: customers.name }).from(historicalOrders).leftJoin(customers, eq(customers.id, historicalOrders.customerId)).where(eq(historicalOrders.id, id));
  return row ?? null;
}

const continuationSchema = z.object({ id: z.uuid(), customerId: z.uuid(), status: z.enum(["queued", "completed"]) });
export async function continueHistoricalOrder(db: Database, identity: unknown, input: unknown) {
  const data = continuationSchema.parse(input);
  const creationHash = createHash("sha256").update(JSON.stringify(data)).digest("hex");
  return db.transaction(async tx => {
    const user = await authorizeActor(tx, identity);
    const [history] = await tx.select().from(historicalOrders).where(eq(historicalOrders.id, data.id)).for("update");
    if (!history) throw new OrderError("La orden anterior no existe.");
    if (history.continuedOrderId) {
      const [existing] = await tx.select().from(workOrders).where(eq(workOrders.id, history.continuedOrderId));
      if (existing.creationHash !== creationHash) throw new OrderError("La orden ya se continuó con otros datos. Abrí la orden actual.");
      return existing.id;
    }
    const [customer] = await tx.select({ id: customers.id }).from(customers).where(eq(customers.id, data.customerId)).for("share");
    if (!customer) throw new OrderError("El cliente no existe. Seleccioná un cliente válido.");
    const raw = history.original;
    const text = (key: string) => raw[key] === null || raw[key] === undefined ? "" : String(raw[key]);
    const [order] = await tx.insert(workOrders).values({
      id: history.id, customerId: customer.id, equipment: [text("marca"), text("modelo")].filter(Boolean).join(" · ").slice(0, 160) || `Equipo anterior #${history.legacyNumber}`,
      brand: text("marca").slice(0, 160), model: text("modelo").slice(0, 160),
      intake: text("descripcion_ingreso").trim().length >= 3 ? text("descripcion_ingreso").slice(0, 4000) : "Ingreso anterior sin descripción registrada",
      notes: text("observaciones").slice(0, 4000), location: text("sector_original").slice(0, 160), workDone: text("descripcion_terminacion").slice(0, 4000),
      status: data.status, creationHash, createdBy: user.id, updatedBy: user.id,
    }).returning();
    const { creationHash: _hash, ...snapshot } = order;
    void _hash;
    await tx.insert(orderEvents).values({ orderId: order.id, version: 1, actorId: user.id, kind: "created", reason: `Continuidad de ficha anterior #${history.legacyNumber}. Estado confirmado por administración.`, after: JSON.parse(JSON.stringify(snapshot)) });
    await tx.update(historicalOrders).set({ continuedOrderId: order.id }).where(eq(historicalOrders.id, history.id));
    return order.id;
  });
}
