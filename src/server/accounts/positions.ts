import { eq, sql } from "drizzle-orm";
import type { Database } from "../db";
import { accountEntries } from "../db/schema";

// Sólo para servicios que ya validaron identidad; comandos mantienen bloqueo del cliente.
export async function accountPositions(db: Database, customerId: string) {
  return db.select({ id: accountEntries.id, kind: accountEntries.kind, reference: accountEntries.reference, amount: accountEntries.amount,
    reversed: sql<boolean>`exists(select 1 from credit_reversals r where r.credit_id = account_entries.id)`,
    // Calificar la columna externa: en una subconsulta "id" sin tabla refiere a a.id.
    remaining: sql<string>`(case when account_entries.kind = 'credit_reversal' or exists(select 1 from credit_reversals r where r.credit_id = account_entries.id) then 0 else ${accountEntries.amount} - coalesce((select sum(a.amount) from credit_applications a where (a.debt_id = account_entries.id or a.credit_id = account_entries.id) and not exists(select 1 from credit_reversals r where r.credit_id = a.credit_id)),0) end)::text`,
  }).from(accountEntries).where(eq(accountEntries.customerId, customerId));
}
