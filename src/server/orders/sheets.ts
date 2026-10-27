import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../db";
import { appUsers, customers, historicalOrders, orderSheets, workOrders } from "../db/schema";
import { authorizeIdentity } from "../auth/service";
import { OrderError, orderActor } from "./service";
import { sheetRequestSchema, type SheetSnapshot } from "../../shared/contracts/sheets";

export async function saveOrderSheet(db: Database, identity: unknown, input: unknown) {
  const data = sheetRequestSchema.parse(input);
  return db.transaction(async tx => {
    const user = await orderActor(tx, identity);
    // El bloqueo evita capturar una revisión parcialmente actualizada.
    const [order] = await tx.select().from(workOrders).where(eq(workOrders.id, data.orderId)).for("share");
    if (!order) throw new OrderError("La orden no existe.");
    const [existing] = await tx.select({ id: orderSheets.id }).from(orderSheets).where(and(eq(orderSheets.orderId, data.orderId), eq(orderSheets.orderVersion, data.version), eq(orderSheets.kind, data.kind)));
    if (existing) return existing.id;
    if (order.version !== data.version) throw new OrderError("La orden cambió. Abrí la versión actual antes de preparar otra ficha.");
    const [customer] = await tx.select().from(customers).where(eq(customers.id, order.customerId)).for("share");
    const [technician] = order.assignedTo ? await tx.select({ name: appUsers.displayName }).from(appUsers).where(eq(appUsers.id, order.assignedTo)) : [];
    const [history] = await tx.select({ legacyNumber: historicalOrders.legacyNumber, original: historicalOrders.original }).from(historicalOrders).where(eq(historicalOrders.continuedOrderId, order.id));
    const snapshot: SheetSnapshot = {
      layoutVersion: 1, number: order.number, legacyNumber: history?.legacyNumber ?? null, orderVersion: order.version,
      date: history ? String(history.original.fecha_ingreso ?? "") : order.createdAt.toISOString(),
      customer: { name: customer.name, address: customer.address, phone: customer.phone, locality: String(customer.legacyOriginal?.localidad ?? "") },
      equipment: order.equipment, brand: order.brand, model: order.model, serialNumber: order.serialNumber,
      intake: order.intake, notes: order.notes, budget: order.budget,
      technician: technician?.name ?? "", workedMinutes: order.workedMinutes, diagnosis: order.diagnosis, workDone: order.workDone,
    };
    await tx.insert(orderSheets).values({ orderId: order.id, orderVersion: order.version, kind: data.kind, snapshot, createdBy: user.id }).onConflictDoNothing();
    const [sheet] = await tx.select({ id: orderSheets.id }).from(orderSheets).where(and(eq(orderSheets.orderId, order.id), eq(orderSheets.orderVersion, order.version), eq(orderSheets.kind, data.kind)));
    return sheet.id;
  });
}
export async function listOrderSheets(db: Database, identity: unknown, orderId: string) {
  await authorizeIdentity(db, identity);
  return db.select({ id: orderSheets.id, kind: orderSheets.kind, orderVersion: orderSheets.orderVersion, createdAt: orderSheets.createdAt }).from(orderSheets).where(eq(orderSheets.orderId, orderId)).orderBy(desc(orderSheets.orderVersion));
}
export async function readOrderSheet(db: Database, identity: unknown, id: string) {
  await authorizeIdentity(db, identity);
  if (!z.uuid().safeParse(id).success) return null;
  const [sheet] = await db.select().from(orderSheets).where(eq(orderSheets.id, id));
  return sheet ?? null;
}
