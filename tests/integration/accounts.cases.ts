import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { inArray, sql } from "drizzle-orm";
import type { Database } from "../../src/server/db";
import { accountEntries, appUsers, customers } from "../../src/server/db/schema";
import { createOpening, readAccount } from "../../src/server/accounts/service";

export function registerAccountTests(context: () => { db: Database; admin: { id: string; sessionVersion: number }; passwordHash: string }) {
  test("cuenta: aperturas conciliadas exactas e inmutables", async t => {
    const { db, admin, passwordHash } = context();
    const suffix = randomUUID();
    const [customer, otherCustomer] = await db.insert(customers).values(["Cuenta sintética", "Otra cuenta sintética"].map(name => ({ name, createdBy: admin.id, updatedBy: admin.id }))).returning();
    const [reception, excluded] = await db.insert(appUsers).values([
      { username: `account.rec.${suffix.slice(0, 8)}`, displayName: "Recepción cuenta", role: "reception" as const, passwordHash },
      { username: `account.old.${suffix.slice(0, 8)}`, displayName: "Histórico cuenta", role: "readonly" as const, passwordHash },
    ]).returning();
    const debt = { id: randomUUID(), customerId: customer.id, direction: "debt", amount: "100,00", reference: `APERTURA ${suffix}`, date: "2026-10-27", evidence: "Documento sintético revisado con administración", reconciled: "on" };
    try {
      await t.test("cuenta vacía no usa presupuestos como deuda", async () => {
        assert.deepEqual((({ pending, available, net }) => ({ pending, available, net }))((await readAccount(db, reception, customer.id))!), { pending: "0.00", available: "0.00", net: "0.00" });
      });
      await t.test("apertura concurrente y referencia normalizada no duplican", async () => {
        assert.deepEqual(await Promise.all([createOpening(db, admin, debt), createOpening(db, admin, debt)]), [debt.id, debt.id]);
        assert.equal(await createOpening(db, admin, { ...debt, id: randomUUID(), reference: debt.reference.toLowerCase(), amount: "100" }), debt.id);
        await assert.rejects(createOpening(db, admin, { ...debt, amount: "101" }), /otros datos/);
        await assert.rejects(createOpening(db, admin, { ...debt, id: randomUUID(), customerId: otherCustomer.id }), /otros datos/);
      });
      await t.test("crédito separado de aplicación: neto70 pendiente100 crédito30", async () => {
        await createOpening(db, admin, { ...debt, id: randomUUID(), direction: "credit", amount: "30", reference: `CREDITO ${suffix}` });
        const account = (await readAccount(db, reception, customer.id))!;
        assert.equal(account.pending, "100.00");
        assert.equal(account.available, "30.00");
        assert.equal(account.net, "70.00");
        assert.equal(account.total, 2);
      });
      await t.test("sin permiso, sesión vieja, sin cliente o sin conciliación no escriben", async () => {
        await assert.rejects(createOpening(db, reception, { ...debt, role: "admin" }), /FORBIDDEN/);
        await assert.rejects(createOpening(db, excluded, debt), /FORBIDDEN/);
        await assert.rejects(readAccount(db, excluded, customer.id), /FORBIDDEN/);
        await assert.rejects(createOpening(db, { ...admin, sessionVersion: 999999 }, debt), /UNAUTHORIZED/);
        await assert.rejects(createOpening(db, admin, { ...debt, id: randomUUID(), reference: `MISSING ${suffix}`, customerId: randomUUID() }), /cliente no existe/);
        await assert.rejects(createOpening(db, admin, { ...debt, reconciled: undefined }));
        assert.equal((await readAccount(db, admin, customer.id))?.total, 2);
        assert.equal((await readAccount(db, admin, otherCustomer.id))?.total, 0);
      });
      await t.test("runtime no modifica ni elimina libro", async () => {
        for (const query of [sql`UPDATE account_entries SET amount = 1`, sql`DELETE FROM account_entries`]) {
          await assert.rejects(db.transaction(async tx => { await tx.execute(sql`SET LOCAL ROLE galante_runtime`); await tx.execute(query); }), error => {
            const e = error as { code?: string; cause?: { code?: string } };
            return e.code === "42501" || e.cause?.code === "42501";
          });
        }
      });
    } finally {
      await db.delete(accountEntries).where(inArray(accountEntries.customerId, [customer.id, otherCustomer.id]));
      await db.delete(customers).where(inArray(customers.id, [customer.id, otherCustomer.id]));
      await db.delete(appUsers).where(inArray(appUsers.id, [reception.id, excluded.id]));
    }
  });
}
