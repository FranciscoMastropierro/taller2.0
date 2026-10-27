import { eq, sql } from "drizzle-orm";
import type { Database } from "../db";
import { accountEntries } from "../db/schema";

// Sólo para servicios que ya validaron identidad; comandos mantienen bloqueo del cliente.
export async function accountPositions(db: Database, customerId: string) {
  return db.select({ id: accountEntries.id, kind: accountEntries.kind, reference: accountEntries.reference, amount: accountEntries.amount,
    // Calificar la columna externa: en una subconsulta "id" sin tabla refiere a a.id.
    remaining: sql<string>`(${accountEntries.amount} - coalesce((select sum(a.amount) from credit_applications a where a.debt_id = account_entries.id or a.credit_id = account_entries.id),0))::text`,
  }).from(accountEntries).where(eq(accountEntries.customerId, customerId));
}
