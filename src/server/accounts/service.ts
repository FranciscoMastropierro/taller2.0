import { createHash } from "node:crypto";
import { desc, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../db";
import { accountEntries, customers } from "../db/schema";
import { authorizeIdentity, authorizeActor } from "../auth/service";
import { AccessError } from "../auth/permissions";
import { openingSchema } from "../../shared/contracts/accounts";
import { cents, decimal } from "../../shared/contracts/money";

export class AccountError extends Error {}
export async function createOpening(db: Database, identity: unknown, input: unknown) {
  const data = openingSchema.parse(input);
  const referenceKey = data.reference.normalize("NFKC").replace(/\s+/g, " ").toUpperCase();
  const sourceKey = `opening:${referenceKey}`;
  const { id: _id, ...payload } = data;
  void _id;
  const payloadHash = createHash("sha256").update(JSON.stringify({ ...payload, reference: referenceKey })).digest("hex");
  return db.transaction(async tx => {
    const user = await authorizeActor(tx, identity);
    if (user.role !== "admin") throw new AccessError(403);
    // Una referencia comercial no puede cargarse dos veces, aun en clientes diferentes.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${sourceKey}, 0))`);
    const [customer] = await tx.select({ id: customers.id }).from(customers).where(eq(customers.id, data.customerId)).for("update");
    if (!customer) throw new AccountError("El cliente no existe.");
    const existing = await tx.select().from(accountEntries).where(or(eq(accountEntries.id, data.id), eq(accountEntries.sourceKey, sourceKey)));
    if (existing.length) {
      if (existing.length !== 1 || existing[0].payloadHash !== payloadHash) throw new AccountError("La apertura ya existe con otros datos. No se modificó la cuenta.");
      return existing[0].id;
    }
    await tx.insert(accountEntries).values({ id: data.id, customerId: customer.id, kind: data.direction === "debt" ? "opening_debt" : "opening_credit", sourceKey, reference: data.reference, amount: data.amount, businessDate: data.date, evidence: data.evidence, payloadHash, createdBy: user.id });
    return data.id;
  });
}

export async function readAccount(db: Database, identity: unknown, customerId: string, page = 1) {
  await authorizeIdentity(db, identity, "finance:read");
  if (!z.uuid().safeParse(customerId).success) return null;
  const [customer] = await db.select({ id: customers.id, name: customers.name }).from(customers).where(eq(customers.id, customerId));
  if (!customer) return null;
  const [entries, [totals]] = await Promise.all([
    db.select().from(accountEntries).where(eq(accountEntries.customerId, customerId)).orderBy(desc(accountEntries.createdAt), desc(accountEntries.id)).limit(25).offset((page - 1) * 25),
    db.select({ debt: sql<string>`coalesce(sum(case when ${accountEntries.kind} = 'opening_debt' then ${accountEntries.amount} else 0 end),0)::text`, credit: sql<string>`coalesce(sum(case when ${accountEntries.kind} = 'opening_credit' then ${accountEntries.amount} else 0 end),0)::text`, count: sql<number>`count(*)::int` }).from(accountEntries).where(eq(accountEntries.customerId, customerId)),
  ]);
  const debt = cents(totals.debt), credit = cents(totals.credit);
  return { customer, entries, total: totals.count, pending: decimal(debt), available: decimal(credit), net: decimal(debt - credit) };
}
