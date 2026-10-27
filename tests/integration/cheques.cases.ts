import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../../src/server/db";
import { accountEntries, applicationBatches, appUsers, chequeMovements, creditApplications, creditReversals, customers, paymentComponents, paymentReceipts, thirdPartyCheques } from "../../src/server/db/schema";
import { createOpening, readAccount } from "../../src/server/accounts/service";
import { applyAvailableCredit, createReceipt, readReceipt } from "../../src/server/payments/service";
import { moveCheque, readCheque } from "../../src/server/cheques/service";
import { generateReport } from "../../src/server/documents/reports";

export function registerChequeTests(context: () => { db: Database; admin: { id: string; sessionVersion: number }; passwordHash: string }) {
  test("cheques: crédito único, rechazo parcial e historial", async t => {
    const { db, admin, passwordHash } = context();
    const suffix = randomUUID().slice(0, 8);
    const clients = await db.insert(customers).values([`Cheque mixto ${suffix}`, `Cheque duplicado ${suffix}`].map(name => ({ name, createdBy: admin.id, updatedBy: admin.id }))).returning();
    const [excluded] = await db.insert(appUsers).values({ username: `cheque.old.${randomUUID().slice(0, 8)}`, displayName: "Perfil histórico", role: "readonly", passwordHash }).returning();
    const chequeId = randomUUID(), cashId = randomUUID(), debtId = randomUUID(), receiptId = randomUUID();
    const details = { bank: "Banco sintético", account: `CTA-${randomUUID()}`, number: "000123", deliveredBy: "Entregante sintético", issuedOn: "2026-10-20", payableOn: "2026-10-27" };
    try {
      await createOpening(db, admin, { id: debtId, customerId: clients[0].id, direction: "debt", reference: `DEUDA ${debtId}`, amount: "100", date: "2026-10-27", evidence: "Obligación sintética conciliada", reconciled: "on" });
      const receiptInput = { id: receiptId, customerId: clients[0].id, date: "2026-10-27", note: "Mixto cheque/efectivo", components: [{ id: cashId, method: "cash", amount: "40" }, { id: chequeId, method: "cheque", amount: "60", cheque: details }], allocations: [{ debtId, amount: "100" }] };
      await t.test("recibir una vez, cartera separada; depósito/acreditación no vuelven a acreditar", async () => {
        await createReceipt(db, admin, receiptInput);
        await createReceipt(db, admin, receiptInput);
        let account = (await readAccount(db, admin, clients[0].id))!;
        assert.equal(account.pending, "0.00"); assert.equal(account.net, "0.00"); assert.equal(account.portfolio, "60.00");
        const deposit = { id: randomUUID(), chequeId, version: 1, action: "deposit", date: "2026-10-27", reason: "Depósito confirmado sintético" };
        await Promise.all([moveCheque(db, admin, deposit), moveCheque(db, admin, deposit)]);
        account = (await readAccount(db, admin, clients[0].id))!;
        assert.equal(account.pending, "0.00"); assert.equal(account.net, "0.00"); assert.equal(account.portfolio, "60.00");
        await moveCheque(db, admin, { ...deposit, id: randomUUID(), version: 2, action: "credit", reason: "Acreditación confirmada sintética" });
        account = (await readAccount(db, admin, clients[0].id))!;
        assert.equal(account.net, "0.00"); assert.equal(account.portfolio, "0.00");
        assert.equal((await db.select().from(accountEntries).where(eq(accountEntries.customerId, clients[0].id))).length, 3);
      });
      await t.test("rechazo60 conserva efectivo40 y revierte sólo sus aplicaciones una vez", async () => {
        const receipt = await readReceipt(db, admin, receiptId);
        const reject = { id: randomUUID(), chequeId, version: 3, action: "reject", date: "2026-10-27", reason: "Rechazo bancario sintético" };
        await Promise.all([moveCheque(db, admin, reject), moveCheque(db, admin, reject)]);
        const account = (await readAccount(db, admin, clients[0].id))!;
        assert.equal(account.pending, "60.00"); assert.equal(account.net, "60.00"); assert.equal(account.available, "0.00"); assert.equal(account.portfolio, "0.00");
        assert.equal((await db.select().from(creditReversals).where(eq(creditReversals.creditId, chequeId))).length, 1);
        assert.equal((await db.select().from(creditApplications).where(eq(creditApplications.customerId, clients[0].id))).length, 2, "historial de aplicaciones conservado");
        assert.deepEqual(await readReceipt(db, admin, receiptId), receipt);
        assert.equal((await readCheque(db, admin, chequeId))?.events.length, 4);
        await assert.rejects(moveCheque(db, admin, { ...reject, id: randomUUID(), version: 4 }), /estado actual/);
        await assert.rejects(applyAvailableCredit(db, admin, { id: randomUUID(), customerId: clients[0].id, creditId: chequeId, allocations: [{ debtId, amount: "1" }] }), /crédito/);
      });
      await t.test("instrumento duplicado rechaza todo el cobro; perfil/sesión no autorizados", async () => {
        const duplicateId = randomUUID();
        await assert.rejects(createReceipt(db, admin, { ...receiptInput, id: duplicateId, customerId: clients[1].id, components: [{ id: randomUUID(), method: "cheque", amount: "60", cheque: { ...details, number: "123", bank: details.bank.toUpperCase() } }], allocations: [] }), /ya fue recibido/);
        assert.equal(await readReceipt(db, admin, duplicateId), null);
        assert.equal((await readAccount(db, admin, clients[1].id))?.total, 0);
        const movement = { id: randomUUID(), chequeId, version: 4, action: "reject", date: "2026-10-27", reason: "Intento sin permiso" };
        await assert.rejects(moveCheque(db, excluded, movement), /FORBIDDEN/);
        await assert.rejects(moveCheque(db, { ...admin, sessionVersion: 999999 }, movement), /UNAUTHORIZED/);
      });
      await t.test("F4 cheque100: depósito concurrente, acreditación sin otro crédito y rechazo exacto", async () => {
        const otherDebt = randomUUID(), otherCheque = randomUUID();
        await createOpening(db, admin, { id: otherDebt, customerId: clients[1].id, direction: "debt", reference: `F4 ${otherDebt}`, amount: "100", date: "2026-10-27", evidence: "Obligación sintética conciliada", reconciled: "on" });
        await createReceipt(db, admin, { id: randomUUID(), customerId: clients[1].id, date: "2026-10-27", note: "Cheque F4", components: [{ id: otherCheque, method: "cheque", amount: "100", cheque: { ...details, account: `OTRA-${randomUUID()}` } }], allocations: [{ debtId: otherDebt, amount: "100" }] });
        assert.equal((await readAccount(db, admin, clients[1].id))?.net, "0.00");
        const movement = { id: randomUUID(), chequeId: otherCheque, version: 1, action: "credit", date: "2026-10-27", reason: "Movimiento de prueba" };
        await assert.rejects(moveCheque(db, admin, movement), /estado actual/);
        const deposits = await Promise.allSettled(Array.from({ length: 2 }, () => moveCheque(db, admin, { ...movement, id: randomUUID(), action: "deposit" })));
        assert.equal(deposits.filter(row => row.status === "fulfilled").length, 1);
        assert.match((deposits.find(row => row.status === "rejected") as PromiseRejectedResult).reason.message, /cambió/);
        await moveCheque(db, admin, { ...movement, id: randomUUID(), version: 2 });
        assert.equal((await readAccount(db, admin, clients[1].id))?.net, "0.00");
        await moveCheque(db, admin, { ...movement, id: randomUUID(), version: 3, action: "reject" });
        const account = (await readAccount(db, admin, clients[1].id))!;
        assert.equal(account.net, "100.00"); assert.equal(account.pending, "100.00"); assert.equal(account.available, "0.00");
      });
      await t.test("reportes: cobros100/rechazo60 = neto40; deudores no confunden ventas", async () => {
        const collections = await generateReport(db, admin, { type: "collections", customer: clients[0].name, from: "2026-10-27", to: "2026-10-27" });
        assert.equal(collections.rows.length, 2);
        assert.equal(collections.totals.find(total => total.label === "Cobros brutos")?.amount, "100.00");
        assert.equal(collections.totals.find(total => total.label === "Reversiones")?.amount, "60.00");
        assert.equal(collections.totals.find(total => total.label === "Neto comercial")?.amount, "40.00");
        const excludedDate = await generateReport(db, admin, { type: "collections", customer: clients[0].name, from: "2026-10-28", to: "2026-10-28" });
        assert.equal(excludedDate.rows.length, 0);
        const debtors = await generateReport(db, admin, { type: "debtors", customer: clients[0].name });
        assert.equal(debtors.rows.length, 1);
        assert.equal(debtors.totals.find(total => total.label === "Deuda neta")?.amount, "60.00");
        await assert.rejects(generateReport(db, excluded, { type: "collections" }), /FORBIDDEN/);
        await assert.rejects(generateReport(db, admin, { type: "sales" }));
      });
      await t.test("runtime no borra historial ni reversión ni cambia identidad bancaria", async () => {
        for (const query of [sql`DELETE FROM cheque_movements`, sql`UPDATE cheque_movements SET reason='otro'`, sql`DELETE FROM credit_reversals`, sql`UPDATE third_party_cheques SET number='otro'`]) {
          await assert.rejects(db.transaction(async tx => { await tx.execute(sql`SET LOCAL ROLE galante_runtime`); await tx.execute(query); }), error => {
            const e = error as { code?: string; cause?: { code?: string } };
            return e.code === "42501" || e.cause?.code === "42501";
          });
        }
      });
    } finally {
      const ids = clients.map(row => row.id);
      const cheques = await db.select().from(thirdPartyCheques).where(inArray(thirdPartyCheques.customerId, ids));
      const chequeIds = cheques.map(row => row.id);
      if (chequeIds.length) {
        await db.delete(creditReversals).where(inArray(creditReversals.chequeId, chequeIds));
        await db.delete(chequeMovements).where(inArray(chequeMovements.chequeId, chequeIds));
        await db.delete(thirdPartyCheques).where(inArray(thirdPartyCheques.id, chequeIds));
      }
      await db.delete(creditApplications).where(inArray(creditApplications.customerId, ids));
      const receipts = await db.select().from(paymentReceipts).where(inArray(paymentReceipts.customerId, ids));
      if (receipts.length) await db.delete(paymentComponents).where(inArray(paymentComponents.receiptId, receipts.map(row => row.id)));
      await db.delete(paymentReceipts).where(inArray(paymentReceipts.customerId, ids));
      await db.delete(applicationBatches).where(inArray(applicationBatches.customerId, ids));
      await db.delete(accountEntries).where(inArray(accountEntries.customerId, ids));
      await db.delete(customers).where(inArray(customers.id, ids));
      await db.delete(appUsers).where(eq(appUsers.id, excluded.id));
    }
  });
}
