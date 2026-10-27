import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../db";
import { appUsers, customers, historicalOrders, importSources } from "../db/schema";
import { AccessError } from "../auth/permissions";

export type LegacyRow = Record<string, unknown>;
export const sourceNamespace = "galante-access-recuperado-v1";
const integer = z.number().int().safe();
const text = (value: unknown) => value === null || value === undefined ? "" : String(value).trim();

export function mapLegacyCustomer(row: LegacyRow) {
  const legacyCode = integer.parse(row.legacy_codigo);
  const name = [text(row.cliente), text(row.nombre)].find(value => value.length >= 2);
  return {
    legacyCode,
    name: name || `Cliente anterior #${legacyCode} (sin nombre)`,
    phone: text(row.telefono), address: text(row.direccion), document: text(row.cuit),
    notes: [text(row.nombre) && `Nombre anterior: ${text(row.nombre)}`, text(row.localidad) && `Localidad: ${text(row.localidad)}`].filter(Boolean).join("\n"),
    legacyOriginal: { ...row },
  };
}

export async function importLegacy(db: Database, actorUsername: string, sha256: string, customerRows: LegacyRow[], orderRows: LegacyRow[]) {
  z.string().regex(/^[a-f0-9]{64}$/).parse(sha256);
  const mapped = customerRows.map(mapLegacyCustomer);
  if (new Set(mapped.map(row => row.legacyCode)).size !== mapped.length) throw new Error("DUPLICATE_CUSTOMER_SOURCE_KEY");
  const numbers = orderRows.map(row => integer.parse(row.legacy_num_trabajo));
  if (new Set(numbers).size !== numbers.length) throw new Error("DUPLICATE_ORDER_SOURCE_KEY");
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(74192002)`);
    const [actor] = await tx.select().from(appUsers).where(and(eq(appUsers.username, actorUsername), eq(appUsers.role, "admin"), eq(appUsers.active, 1))).for("share");
    if (!actor) throw new AccessError(403);
    const [existing] = await tx.select().from(importSources).where(eq(importSources.namespace, sourceNamespace));
    if (existing) {
      if (existing.sha256 !== sha256) throw new Error("SOURCE_CHANGED_REQUIRES_RECONCILIATION");
      if (existing.customerCount !== mapped.length || existing.orderCount !== numbers.length) throw new Error("SOURCE_COUNT_MISMATCH");
      return { status: "already_imported", customers: existing.customerCount, orders: existing.orderCount };
    }
    const [source] = await tx.insert(importSources).values({ namespace: sourceNamespace, sha256, customerCount: mapped.length, orderCount: numbers.length, createdBy: actor.id }).returning();
    const ids = new Map<number, string>();
    for (let offset = 0; offset < mapped.length; offset += 250) {
      const inserted = await tx.insert(customers).values(mapped.slice(offset, offset + 250).map(row => ({ ...row, createdBy: actor.id, updatedBy: actor.id }))).returning({ id: customers.id, legacyCode: customers.legacyCode });
      for (const row of inserted) ids.set(row.legacyCode!, row.id);
    }
    for (let offset = 0; offset < orderRows.length; offset += 250) {
      await tx.insert(historicalOrders).values(orderRows.slice(offset, offset + 250).map(row => ({
        sourceId: source.id, legacyNumber: integer.parse(row.legacy_num_trabajo),
        customerId: typeof row.customer_id === "number" ? ids.get(row.customer_id) ?? null : null,
        original: { ...row },
      })));
    }
    return { status: "imported", customers: mapped.length, orders: orderRows.length };
  });
}
