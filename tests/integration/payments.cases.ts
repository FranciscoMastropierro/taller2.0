import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../../src/server/db";
import { accountEntries, applicationBatches, appUsers, creditApplications, customers, paymentComponents, paymentReceipts } from "../../src/server/db/schema";
import { createOpening, readAccount } from "../../src/server/accounts/service";
import { applyAvailableCredit, createReceipt, readReceipt } from "../../src/server/payments/service";

export function registerPaymentTests(context: () => { db: Database; admin: { id: string; sessionVersion: number }; passwordHash: string }) {
  test("cobros: anticipos, aplicaciones, concurrencia y recibos", async t => {
    const { db, admin, passwordHash } = context();
    const clients = await db.insert(customers).values(["Anticipo sintético", "Pago múltiple sintético"].map(name => ({ name, createdBy: admin.id, updatedBy: admin.id }))).returning();
    const [reception, excluded] = await db.insert(appUsers).values([
      { username: `payment.rec.${randomUUID().slice(0, 8)}`, displayName: "Recepción pagos", role: "reception" as const, passwordHash },
      { username: `payment.old.${randomUUID().slice(0, 8)}`, displayName: "Técnico histórico", role: "technician" as const, passwordHash },
    ]).returning();
    const debt = async (customerId: string, amount: string) => {
      const id = randomUUID();
      await createOpening(db, admin, { id, customerId, direction: "debt", amount, reference: `DOC ${id}`, date: "2026-10-27", evidence: "Documento sintético conciliado", reconciled: "on" });
      return id;
    };
    let debtA: string;
    let receiptB: string;
    const componentA = randomUUID(), componentB = randomUUID(), componentC = randomUUID();
    try {
      await t.test("F2: anticipo30 se aplica una vez a deuda100, sin nuevo cobro", async () => {
        debtA = await debt(clients[0].id, "100");
        const input = { id: randomUUID(), customerId: clients[0].id, date: "2026-10-27", note: "Anticipo de prueba", components: [{ id: componentA, method: "cash", amount: "30" }], allocations: [] };
        assert.deepEqual(await Promise.all([createReceipt(db, reception, input), createReceipt(db, reception, input)]), [input.id, input.id]);
        await assert.rejects(createReceipt(db, reception, { ...input, note: "Otro cobro" }), /otros datos/);
        const before = (await readAccount(db, reception, clients[0].id))!;
        assert.equal(before.pending, "100.00"); assert.equal(before.available, "30.00"); assert.equal(before.net, "70.00");
        const application = { id: randomUUID(), customerId: clients[0].id, creditId: componentA, allocations: [{ debtId: debtA, amount: "30" }] };
        await applyAvailableCredit(db, reception, application);
        await applyAvailableCredit(db, reception, application);
        const after = (await readAccount(db, reception, clients[0].id))!;
        assert.equal(after.pending, "70.00"); assert.equal(after.available, "0.00"); assert.equal(after.net, "70.00");
        assert.equal((await db.select().from(paymentReceipts).where(eq(paymentReceipts.customerId, clients[0].id))).length, 1);
        const receipt = await readReceipt(db, reception, input.id);
        await db.update(customers).set({ name: "Nombre posterior" }).where(eq(customers.id, clients[0].id));
        assert.deepEqual(await readReceipt(db, reception, input.id), receipt);
      });
      await t.test("F3: cobro150 aplica70+60 y deja20, distribuyendo componentes", async () => {
        const first = await debt(clients[1].id, "70"), second = await debt(clients[1].id, "60");
        receiptB = await createReceipt(db, reception, { id: randomUUID(), customerId: clients[1].id, date: "2026-10-27", note: "Pago mixto", components: [{ id: componentB, method: "cash", amount: "100" }, { id: componentC, method: "transfer", amount: "50" }], allocations: [{ debtId: first, amount: "70" }, { debtId: second, amount: "60" }] });
        const account = (await readAccount(db, reception, clients[1].id))!;
        assert.equal(account.pending, "0.00"); assert.equal(account.available, "20.00"); assert.equal(account.net, "-20.00");
        assert.equal((await readReceipt(db, reception, receiptB))?.snapshot.unapplied, "20.00");
        assert.equal((await db.select().from(creditApplications).where(eq(creditApplications.customerId, clients[1].id))).length, 3);
      });
      await t.test("rollback de cruce de cliente, sin permiso y sobreaplicación concurrente", async () => {
        const invalid = { id: randomUUID(), customerId: clients[1].id, date: "2026-10-27", note: "Cruce inválido", components: [{ id: randomUUID(), method: "cash", amount: "10" }], allocations: [{ debtId: debtA, amount: "10" }] };
        await assert.rejects(createReceipt(db, reception, invalid), /obligación/);
        assert.equal(await readReceipt(db, reception, invalid.id), null);
        await assert.rejects(createReceipt(db, { ...excluded, role: "admin" }, invalid), /FORBIDDEN/);
        await assert.rejects(readReceipt(db, excluded, receiptB), /FORBIDDEN/);
        const third = await debt(clients[1].id, "50");
        const results = await Promise.allSettled(Array.from({ length: 2 }, () => applyAvailableCredit(db, reception, { id: randomUUID(), customerId: clients[1].id, creditId: componentC, allocations: [{ debtId: third, amount: "20" }] })));
        assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
        const rejected = results.find(result => result.status === "rejected") as PromiseRejectedResult;
        assert.match(rejected.reason.message, /disponible/);
        const account = (await readAccount(db, reception, clients[1].id))!;
        assert.equal(account.pending, "30.00"); assert.equal(account.available, "0.00");
        assert.equal((await db.select().from(paymentReceipts).where(eq(paymentReceipts.customerId, clients[1].id))).length, 1);
      });
      await t.test("runtime conserva recibos/aplicaciones/componentes inmutables", async () => {
        for (const query of [sql`DELETE FROM payment_receipts`, sql`UPDATE payment_receipts SET total=1`, sql`DELETE FROM credit_applications`, sql`UPDATE credit_applications SET amount=1`, sql`DELETE FROM payment_components`]) {
          await assert.rejects(db.transaction(async tx => { await tx.execute(sql`SET LOCAL ROLE galante_runtime`); await tx.execute(query); }), error => {
            const e = error as { code?: string; cause?: { code?: string } };
            return e.code === "42501" || e.cause?.code === "42501";
          });
        }
      });
    } finally {
      const ids = clients.map(row => row.id);
      const receipts = await db.select().from(paymentReceipts).where(inArray(paymentReceipts.customerId, ids));
      await db.delete(creditApplications).where(inArray(creditApplications.customerId, ids));
      if (receipts.length) await db.delete(paymentComponents).where(inArray(paymentComponents.receiptId, receipts.map(row => row.id)));
      await db.delete(paymentReceipts).where(inArray(paymentReceipts.customerId, ids));
      await db.delete(applicationBatches).where(inArray(applicationBatches.customerId, ids));
      await db.delete(accountEntries).where(inArray(accountEntries.customerId, ids));
      await db.delete(customers).where(inArray(customers.id, ids));
      await db.delete(appUsers).where(inArray(appUsers.id, [reception.id, excluded.id]));
    }
  });
}
