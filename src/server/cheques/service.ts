import { createHash } from "node:crypto";
import { and, asc, count, desc, eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../db";
import { accountEntries, chequeMovements, creditReversals, customers, thirdPartyCheques } from "../db/schema";
import { authorizeActor, authorizeIdentity } from "../auth/service";
import { AccountError } from "../accounts/service";
import { chequeMovementSchema, type ChequeState } from "../../shared/contracts/cheques";

export async function moveCheque(db: Database, identity: unknown, input: unknown) {
  const data = chequeMovementSchema.parse(input);
  const payloadHash = createHash("sha256").update(JSON.stringify(data)).digest("hex");
  return db.transaction(async tx => {
    const actor = await authorizeActor(tx, identity, "finance:write");
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${data.id}, 0))`);
    const [reference] = await tx.select({ customerId: thirdPartyCheques.customerId }).from(thirdPartyCheques).where(eq(thirdPartyCheques.id, data.chequeId));
    if (!reference) throw new AccountError("El cheque no existe.");
    await tx.select({ id: customers.id }).from(customers).where(eq(customers.id, reference.customerId)).for("update");
    const [cheque] = await tx.select().from(thirdPartyCheques).where(eq(thirdPartyCheques.id, data.chequeId)).for("update");
    const [existing] = await tx.select().from(chequeMovements).where(eq(chequeMovements.id, data.id));
    if (existing) {
      if (existing.payloadHash !== payloadHash) throw new AccountError("El movimiento ya existe con otros datos.");
      return cheque.id;
    }
    if (cheque.version !== data.version) throw new AccountError("El cheque cambió. Abrí la versión actual.");
    const next: ChequeState = data.action === "deposit" ? "deposited" : data.action === "credit" ? "credited" : "rejected";
    if (cheque.status === "rejected" || (data.action === "deposit" && cheque.status !== "received") || (data.action === "credit" && cheque.status !== "deposited")) throw new AccountError("Ese movimiento no corresponde al estado actual del cheque.");
    await tx.insert(chequeMovements).values({ id: data.id, chequeId: cheque.id, version: cheque.version + 1, action: data.action, fromStatus: cheque.status, toStatus: next, businessDate: data.date, reason: data.reason, payloadHash, createdBy: actor.id });
    if (next === "rejected") {
      const [credit] = await tx.select().from(accountEntries).where(eq(accountEntries.id, cheque.creditId));
      await tx.insert(accountEntries).values({ id: data.id, customerId: cheque.customerId, kind: "credit_reversal", sourceKey: `cheque-reversal:${cheque.id}`, reference: `Rechazo cheque ${cheque.number}`, amount: credit.amount, businessDate: data.date, evidence: data.reason, payloadHash, createdBy: actor.id });
      await tx.insert(creditReversals).values({ id: data.id, chequeId: cheque.id, creditId: cheque.creditId, movementId: data.id });
    }
    await tx.update(thirdPartyCheques).set({ status: next, version: cheque.version + 1 }).where(eq(thirdPartyCheques.id, cheque.id));
    return cheque.id;
  });
}
export async function readCheque(db: Database, identity: unknown, id: string) {
  return db.transaction(async tx => {
    await authorizeIdentity(tx as unknown as Database, identity, "finance:read");
    if (!z.uuid().safeParse(id).success) return null;
    const [row] = await tx.select({ cheque: thirdPartyCheques, amount: accountEntries.amount, customerName: customers.name }).from(thirdPartyCheques).innerJoin(accountEntries, eq(accountEntries.id, thirdPartyCheques.creditId)).innerJoin(customers, eq(customers.id, thirdPartyCheques.customerId)).where(eq(thirdPartyCheques.id, id));
    if (!row) return null;
    const events = await tx.select().from(chequeMovements).where(eq(chequeMovements.chequeId, id)).orderBy(asc(chequeMovements.version));
    return { ...row, events };
  }, { isolationLevel: "repeatable read", accessMode: "read only" });
}
export async function listCheques(db: Database, identity: unknown, filters: { status?: ChequeState; bank: string; page: number }) {
  await authorizeIdentity(db, identity, "finance:read");
  const pattern = `%${filters.bank.replace(/[\\%_]/g, "\\$&")}%`;
  const filter = and(filters.status ? eq(thirdPartyCheques.status, filters.status) : undefined, filters.bank ? ilike(thirdPartyCheques.bank, pattern) : undefined);
  const [rows, [total]] = await Promise.all([
    db.select({ cheque: thirdPartyCheques, amount: accountEntries.amount, customerName: customers.name }).from(thirdPartyCheques).innerJoin(accountEntries, eq(accountEntries.id, thirdPartyCheques.creditId)).innerJoin(customers, eq(customers.id, thirdPartyCheques.customerId)).where(filter).orderBy(desc(thirdPartyCheques.payableOn), desc(thirdPartyCheques.id)).limit(25).offset((filters.page - 1) * 25),
    db.select({ count: count() }).from(thirdPartyCheques).where(filter),
  ]);
  return { rows, total: total.count };
}
