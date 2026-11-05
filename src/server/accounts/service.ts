import { createHash } from "node:crypto";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../db";
import { accountEntries, customers, thirdPartyCheques } from "../db/schema";
import { authorizeIdentity, authorizeActor } from "../auth/service";
import { AccessError } from "../auth/permissions";
import { openingSchema } from "../../shared/contracts/accounts";
import { accountPositions } from "./positions";
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
  return db.transaction(async tx => {
    const readDb = tx as unknown as Database;
    await authorizeIdentity(readDb, identity, "finance:read");
    if (!z.uuid().safeParse(customerId).success) return null;
    const [customer] = await tx.select({ id: customers.id, name: customers.name }).from(customers).where(eq(customers.id, customerId));
    if (!customer) return null;
    const entries = await tx.select().from(accountEntries).where(eq(accountEntries.customerId, customerId)).orderBy(desc(accountEntries.createdAt), desc(accountEntries.id)).limit(25).offset((page - 1) * 25);
    const positions = await accountPositions(readDb, customerId);
    const portfolio = await tx.select({ amount: accountEntries.amount }).from(thirdPartyCheques).innerJoin(accountEntries, eq(accountEntries.id, thirdPartyCheques.creditId)).where(and(eq(thirdPartyCheques.customerId, customerId), inArray(thirdPartyCheques.status, ["received", "deposited"])));
    const debts = positions.filter(row => row.kind === "opening_debt");
    const credits = positions.filter(row => (row.kind === "opening_credit" || row.kind === "payment_credit") && !row.reversed);
    const debt = debts.reduce((sum, row) => sum + cents(row.amount), 0n);
    const credit = credits.reduce((sum, row) => sum + cents(row.amount), 0n);
    return { portfolio: decimal(portfolio.reduce((sum, row) => sum + cents(row.amount), 0n)), customer, entries, total: positions.length, pending: decimal(debts.reduce((sum, row) => sum + cents(row.remaining), 0n)), available: decimal(credits.reduce((sum, row) => sum + cents(row.remaining), 0n)), net: decimal(debt - credit), debts: debts.filter(row => cents(row.remaining) > 0n), credits: credits.filter(row => cents(row.remaining) > 0n) };
  }, { isolationLevel: "repeatable read", accessMode: "read only" });
}
