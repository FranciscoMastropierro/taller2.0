import { createHash } from "node:crypto";
import { count, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../db";
import { accountEntries, applicationBatches, creditApplications, customers, paymentComponents, paymentReceipts, thirdPartyCheques, chequeMovements } from "../db/schema";
import { authorizeActor, authorizeIdentity } from "../auth/service";
import { AccountError } from "../accounts/service";
import { accountPositions } from "../accounts/positions";
import { cents, decimal } from "../../shared/contracts/money";
import { applyCreditSchema, receiptSchema, type ReceiptSnapshot } from "../../shared/contracts/payments";

import { chequeIdentity } from "../cheques/identity";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

async function planApplications(tx: Transaction, customerId: string, batchId: string, requested: { debtId: string; amount: string }[], credits: { id: string; available: bigint }[]) {
  const positions = await accountPositions(tx as unknown as Database, customerId);
  const debts = new Map(positions.filter(row => row.kind === "opening_debt").map(row => [row.id, row]));
  const rows: typeof creditApplications.$inferInsert[] = [];
  const snapshot: ReceiptSnapshot["allocations"] = [];
  for (const request of requested) {
    const debt = debts.get(request.debtId);
    let amount = cents(request.amount);
    if (!debt || amount > cents(debt.remaining)) throw new AccountError("La obligación no pertenece al cliente o su pendiente cambió. Revisá las aplicaciones.");
    snapshot.push({ reference: debt.reference, amount: request.amount });
    for (const credit of credits) {
      const applied = amount < credit.available ? amount : credit.available;
      if (applied > 0n) {
        rows.push({ batchId, customerId, creditId: credit.id, debtId: debt.id, amount: decimal(applied) });
        credit.available -= applied;
        amount -= applied;
      }
      if (amount === 0n) break;
    }
    if (amount !== 0n) throw new AccountError("Las aplicaciones superan el crédito disponible.");
  }
  return { rows, snapshot };
}

export async function createReceipt(db: Database, identity: unknown, input: unknown) {
  const data = receiptSchema.parse(input);
  const payloadHash = hash(data);
  return db.transaction(async tx => {
    const actor = await authorizeActor(tx, identity, "finance:write");
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${data.id}, 0))`);
    const physical = data.components.filter(component => component.method === "cheque");
    const hashes = physical.map(component => chequeIdentity(component.cheque));
    if (new Set(hashes).size !== hashes.length) throw new AccountError("El mismo cheque figura dos veces en el cobro.");
    for (const key of [...hashes].sort()) await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
    const [customer] = await tx.select().from(customers).where(eq(customers.id, data.customerId)).for("update");
    if (!customer) throw new AccountError("El cliente no existe.");
    const [existing] = await tx.select().from(paymentReceipts).where(eq(paymentReceipts.id, data.id));
    if (existing) {
      if (existing.payloadHash !== payloadHash) throw new AccountError("El cobro ya fue registrado con otros datos.");
      return existing.id;
    }
    if (hashes.length && (await tx.select({ id: thirdPartyCheques.id }).from(thirdPartyCheques).where(inArray(thirdPartyCheques.identityHash, hashes))).length) throw new AccountError("Ese cheque ya fue recibido. Consultá la cartera.");
    const credits = data.components.map(component => ({ id: component.id, available: cents(component.amount) }));
    const total = decimal(credits.reduce((sum, credit) => sum + credit.available, 0n));
    const applications = await planApplications(tx, customer.id, data.id, data.allocations, credits);
    const snapshot: ReceiptSnapshot = { customer: { name: customer.name, document: customer.document, address: customer.address }, date: data.date, note: data.note, total, components: data.components, allocations: applications.snapshot, unapplied: decimal(credits.reduce((sum, credit) => sum + credit.available, 0n)) };
    await tx.insert(applicationBatches).values({ id: data.id, customerId: customer.id, payloadHash, createdBy: actor.id });
    const [receipt] = await tx.insert(paymentReceipts).values({ id: data.id, customerId: customer.id, payloadHash, total, businessDate: data.date, snapshot, createdBy: actor.id }).returning({ number: paymentReceipts.number });
    for (const component of data.components) {
      await tx.insert(accountEntries).values({ id: component.id, customerId: customer.id, kind: "payment_credit", sourceKey: `payment:${component.id}`, reference: `Recibo R-${String(receipt.number).padStart(6, "0")}`, amount: component.amount, businessDate: data.date, evidence: data.note || "Cobro registrado", payloadHash, createdBy: actor.id });
      await tx.insert(paymentComponents).values({ id: component.id, receiptId: data.id, creditId: component.id, method: component.method });
      if (component.method === "cheque") {
        await tx.insert(thirdPartyCheques).values({ id: component.id, customerId: customer.id, creditId: component.id, identityHash: chequeIdentity(component.cheque), ...component.cheque });
        await tx.insert(chequeMovements).values({ id: component.id, chequeId: component.id, version: 1, action: "receive", fromStatus: null, toStatus: "received", businessDate: data.date, reason: `Recibido en R-${String(receipt.number).padStart(6, "0")}`, payloadHash, createdBy: actor.id });
      }
    }
    if (applications.rows.length) await tx.insert(creditApplications).values(applications.rows);
    return data.id;
  });
}

export async function applyAvailableCredit(db: Database, identity: unknown, input: unknown) {
  const data = applyCreditSchema.parse(input);
  const payloadHash = hash(data);
  return db.transaction(async tx => {
    const actor = await authorizeActor(tx, identity, "finance:write");
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${data.id}, 0))`);
    const [customer] = await tx.select({ id: customers.id }).from(customers).where(eq(customers.id, data.customerId)).for("update");
    if (!customer) throw new AccountError("El cliente no existe.");
    const [existing] = await tx.select().from(applicationBatches).where(eq(applicationBatches.id, data.id));
    if (existing) {
      if (existing.payloadHash !== payloadHash) throw new AccountError("La aplicación ya existe con otros datos.");
      return data.id;
    }
    const credit = (await accountPositions(tx as unknown as Database, customer.id)).find(row => row.id === data.creditId && (row.kind === "opening_credit" || row.kind === "payment_credit") && !row.reversed);
    if (!credit) throw new AccountError("El crédito no pertenece a este cliente.");
    const plan = await planApplications(tx, customer.id, data.id, data.allocations, [{ id: credit.id, available: cents(credit.remaining) }]);
    await tx.insert(applicationBatches).values({ id: data.id, customerId: customer.id, payloadHash, createdBy: actor.id });
    await tx.insert(creditApplications).values(plan.rows);
    return data.id;
  });
}
export async function readReceipt(db: Database, identity: unknown, id: string) {
  await authorizeIdentity(db, identity, "finance:read");
  if (!z.uuid().safeParse(id).success) return null;
  const [receipt] = await db.select().from(paymentReceipts).where(eq(paymentReceipts.id, id));
  return receipt ?? null;
}
export async function listReceipts(db: Database, identity: unknown, page: number) {
  await authorizeIdentity(db, identity, "finance:read");
  const [rows, [total]] = await Promise.all([
    db.select({ id: paymentReceipts.id, number: paymentReceipts.number, date: paymentReceipts.businessDate, total: paymentReceipts.total, customerName: customers.name }).from(paymentReceipts).innerJoin(customers, eq(customers.id, paymentReceipts.customerId)).orderBy(desc(paymentReceipts.number)).limit(25).offset((page - 1) * 25),
    db.select({ count: count() }).from(paymentReceipts),
  ]);
  return { rows, total: total.count };
}
