import { createHash } from "node:crypto";
import { and, asc, count, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../db";
import { appUsers, customers, orderEvents, workOrders } from "../db/schema";
import { authorizeIdentity } from "../auth/service";
import { AccessError, can } from "../auth/permissions";
import { newOrderSchema, nextStatus, orderFieldsSchema, orderVersionSchema, statusChangeSchema, technicalSchema, type OrderStatus } from "../../shared/contracts/orders";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
const identitySchema = z.object({ id: z.uuid(), sessionVersion: z.number().int().positive() });
export class OrderError extends Error {}
async function actor(tx: Transaction, identity: unknown) {
  const parsed = identitySchema.safeParse(identity);
  if (!parsed.success) throw new AccessError(401);
  const [user] = await tx.select({ id: appUsers.id, role: appUsers.role }).from(appUsers).where(and(eq(appUsers.id, parsed.data.id), eq(appUsers.sessionVersion, parsed.data.sessionVersion), eq(appUsers.active, 1))).for("share");
  if (!user) throw new AccessError(401);
  return user;
}
async function assignee(tx: Transaction, id: string | null) {
  if (!id) return;
  const [user] = await tx.select({ id: appUsers.id }).from(appUsers).where(and(eq(appUsers.id, id), eq(appUsers.active, 1), or(eq(appUsers.role, "technician"), eq(appUsers.role, "admin")))).for("share");
  if (!user) throw new OrderError("El técnico seleccionado ya no está disponible.");
}
function snapshot(order: typeof workOrders.$inferSelect) {
  const { creationHash: _creationHash, ...values } = order;
  void _creationHash;
  return JSON.parse(JSON.stringify(values)) as Record<string, unknown>;
}
async function record(tx: Transaction, userId: string, kind: typeof orderEvents.$inferInsert.kind, before: typeof workOrders.$inferSelect | null, after: typeof workOrders.$inferSelect, reason = "") {
  await tx.insert(orderEvents).values({ orderId: after.id, actorId: userId, kind, version: after.version, reason, before: before ? snapshot(before) : null, after: snapshot(after) });
}

export async function createOrder(db: Database, identity: unknown, input: unknown) {
  const data = newOrderSchema.parse(input);
  return db.transaction(async tx => {
    const user = await actor(tx, identity);
    if (!can(user.role, "work:write")) throw new AccessError(403);
    const hash = createHash("sha256").update(JSON.stringify(data)).digest("hex");
    const [previous] = await tx.select({ id: workOrders.id, createdBy: workOrders.createdBy, creationHash: workOrders.creationHash }).from(workOrders).where(eq(workOrders.id, data.id));
    if (previous) {
      if (previous.createdBy !== user.id || previous.creationHash !== hash) throw new OrderError("Este ingreso ya fue utilizado con otros datos. Volvé a abrir Nueva orden.");
      return previous.id;
    }
    await assignee(tx, data.assignedTo);
    const [customer] = await tx.select({ id: customers.id }).from(customers).where(eq(customers.id, data.customerId));
    if (!customer) throw new OrderError("El cliente no existe. Seleccioná uno desde Clientes.");
    const [order] = await tx.insert(workOrders).values({ ...data, createdBy: user.id, updatedBy: user.id, creationHash: hash }).onConflictDoNothing({ target: workOrders.id }).returning();
    if (!order) {
      const [existing] = await tx.select().from(workOrders).where(eq(workOrders.id, data.id));
      if (existing.createdBy !== user.id || existing.creationHash !== hash) throw new OrderError("Este ingreso ya fue utilizado con otros datos. Volvé a abrir Nueva orden.");
      return existing.id;
    }
    await record(tx, user.id, "created", null, order);
    return order.id;
  });
}

export async function editOrder(db: Database, identity: unknown, input: unknown, technical = false) {
  const version = orderVersionSchema.parse(input);
  const fields = technical ? technicalSchema.parse(input) : orderFieldsSchema.parse(input);
  return db.transaction(async tx => {
    const user = await actor(tx, identity);
    const [before] = await tx.select().from(workOrders).where(eq(workOrders.id, version.id)).for("update");
    if (!before) throw new OrderError("La orden no existe.");
    if (technical ? !can(user.role, "work:technical") || (user.role === "technician" && before.assignedTo !== user.id) : !can(user.role, "work:write")) throw new AccessError(403);
    if (before.version !== version.version) throw new OrderError("La orden cambió desde que la abriste. Conservamos tu propuesta; abrí la ficha actual en otra pestaña para compararla.");
    if (before.status === "delivered") throw new OrderError("La orden está entregada. Un administrador debe corregir el estado antes de editarla.");
    if (!technical) await assignee(tx, (fields as z.output<typeof orderFieldsSchema>).assignedTo);
    const [after] = await tx.update(workOrders).set({ ...fields, updatedBy: user.id, updatedAt: new Date(), version: before.version + 1 }).where(eq(workOrders.id, before.id)).returning();
    await record(tx, user.id, technical ? "technical" : "edited", before, after);
    return after.id;
  });
}

export async function changeOrderStatus(db: Database, identity: unknown, input: unknown, correction = false) {
  const data = statusChangeSchema.parse(input);
  return db.transaction(async tx => {
    const user = await actor(tx, identity);
    if (!can(user.role, correction ? "work:correct" : "work:write")) throw new AccessError(403);
    if (correction && data.reason.length < 5) throw new OrderError("Ingresá un motivo de corrección de al menos cinco caracteres.");
    const [before] = await tx.select().from(workOrders).where(eq(workOrders.id, data.id)).for("update");
    if (!before) throw new OrderError("La orden no existe.");
    if (before.version !== data.version) throw new OrderError("La orden cambió. Actualizá la ficha antes de cambiar el estado.");
    if (before.status === data.status) throw new OrderError("La orden ya está en ese estado.");
    if (!correction && nextStatus[before.status] !== data.status) throw new OrderError("Respetá la secuencia TURNO → TERMINADO → ENTREGADO.");
    const [after] = await tx.update(workOrders).set({ status: data.status, version: before.version + 1, updatedBy: user.id, updatedAt: new Date() }).where(eq(workOrders.id, before.id)).returning();
    await record(tx, user.id, correction ? "correction" : "status", before, after, correction ? data.reason : "");
    return after.id;
  });
}

const operationalColumns = {
  id: workOrders.id, number: workOrders.number, customerId: workOrders.customerId, equipment: workOrders.equipment, brand: workOrders.brand, model: workOrders.model, serialNumber: workOrders.serialNumber,
  intake: workOrders.intake, notes: workOrders.notes, location: workOrders.location, assignedTo: workOrders.assignedTo, diagnosis: workOrders.diagnosis, workDone: workOrders.workDone, workedMinutes: workOrders.workedMinutes,
  status: workOrders.status, version: workOrders.version, createdAt: workOrders.createdAt, updatedAt: workOrders.updatedAt,
};
function visibleColumns(financial: boolean) {
  return { ...operationalColumns, budget: financial ? workOrders.budget : sql<string | null>`NULL`, approval: financial ? workOrders.approval : sql<string>`''` };
}
export async function listOrders(db: Database, identity: unknown, filters: { q: string; status?: OrderStatus; location: string; customerId?: string; page: number }) {
  const user = await authorizeIdentity(db, identity);
  const pattern = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`;
  const location = `%${filters.location.replace(/[\\%_]/g, "\\$&")}%`;
  const filter = and(
    user.role === "technician" ? eq(workOrders.assignedTo, user.id) : undefined,
    filters.status ? eq(workOrders.status, filters.status) : undefined,
    filters.customerId ? eq(workOrders.customerId, filters.customerId) : undefined,
    filters.location ? ilike(workOrders.location, location) : undefined,
    filters.q ? or(ilike(customers.name, pattern), ilike(workOrders.equipment, pattern), ilike(workOrders.brand, pattern), ilike(workOrders.model, pattern), ilike(sql`${workOrders.number}::text`, pattern)) : undefined,
  );
  const [rows, [total]] = await Promise.all([
    db.select({ id: workOrders.id, number: workOrders.number, customerId: workOrders.customerId, customerName: customers.name, equipment: workOrders.equipment, brand: workOrders.brand, model: workOrders.model, status: workOrders.status, location: workOrders.location, createdAt: workOrders.createdAt, technician: appUsers.displayName }).from(workOrders).innerJoin(customers, eq(customers.id, workOrders.customerId)).leftJoin(appUsers, eq(appUsers.id, workOrders.assignedTo)).where(filter).orderBy(desc(workOrders.number)).limit(25).offset((filters.page - 1) * 25),
    db.select({ count: count() }).from(workOrders).innerJoin(customers, eq(customers.id, workOrders.customerId)).where(filter),
  ]);
  return { rows, total: total.count };
}
export async function readOrder(db: Database, identity: unknown, id: string) {
  const user = await authorizeIdentity(db, identity);
  if (!z.uuid().safeParse(id).success) return null;
  const [order] = await db.select({ ...visibleColumns(can(user.role, "finance:read")), customerName: customers.name, customerCode: customers.code, phone: customers.phone, technician: appUsers.displayName }).from(workOrders).innerJoin(customers, eq(customers.id, workOrders.customerId)).leftJoin(appUsers, eq(appUsers.id, workOrders.assignedTo)).where(and(eq(workOrders.id, id), user.role === "technician" ? eq(workOrders.assignedTo, user.id) : undefined));
  if (!order) return null;
  const events = await db.select({ ...getTableColumns(orderEvents), actor: appUsers.displayName }).from(orderEvents).innerJoin(appUsers, eq(appUsers.id, orderEvents.actorId)).where(eq(orderEvents.orderId, id)).orderBy(asc(orderEvents.version));
  // Sanear también el historial antes de enviarlo a la capa de presentación.
  const redact = (value: Record<string, unknown> | null) => {
    if (!value || can(user.role, "finance:read")) return value;
    const { budget: _budget, approval: _approval, ...safe } = value;
    void _budget; void _approval;
    return safe;
  };
  return { order, events: events.map(event => ({ ...event, before: redact(event.before), after: redact(event.after)! })) };
}
