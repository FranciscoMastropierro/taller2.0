import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, isNotNull } from "drizzle-orm";
import { getDatabaseUrl } from "../src/server/env";
import { importLegacy, sourceNamespace } from "../src/server/legacy/import";
import * as schema from "../src/server/db/schema";

config({ path: ".env.local", quiet: true });
async function main() {
  const args = process.argv.slice(2);
  const source = args.find(arg => arg.startsWith("--source="))?.slice(9);
  const actor = args.find(arg => arg.startsWith("--actor="))?.slice(8);
  const apply = args.includes("--apply");
  const verify = args.includes("--verify");
  if (!source || (apply && !actor) || (apply && verify) || args.some(arg => !arg.startsWith("--source=") && !arg.startsWith("--actor=") && arg !== "--apply" && arg !== "--verify")) throw new Error("USAGE: --source=path [--apply --actor=username | --verify]");
  const filename = resolve(source);
  const before = createHash("sha256").update(readFileSync(filename)).digest("hex");
  const sqlite = new DatabaseSync(filename, { readOnly: true });
  let customerRows, orderRows;
  try {
    if (sqlite.prepare("PRAGMA integrity_check").get()?.integrity_check !== "ok") throw new Error("SQLITE_INTEGRITY_FAILED");
    if (sqlite.prepare("PRAGMA foreign_key_check").all().length) throw new Error("SQLITE_FOREIGN_KEYS_FAILED");
    customerRows = sqlite.prepare("SELECT * FROM customers ORDER BY legacy_codigo").all().map(row => ({ ...row }));
    orderRows = sqlite.prepare("SELECT * FROM work_orders ORDER BY legacy_num_trabajo").all().map(row => ({ ...row }));
  } finally { sqlite.close(); }
  if (createHash("sha256").update(readFileSync(filename)).digest("hex") !== before) throw new Error("SOURCE_CHANGED_DURING_READ");
  console.log(JSON.stringify({ step: "source_verified", sha256: before, customers: customerRows.length, orders: orderRows.length, mode: apply ? "apply" : verify ? "verify" : "dry_run" }));
  if (!apply && !verify) return;
  const pool = new Pool({ connectionString: getDatabaseUrl(apply ? "MIGRATION_DATABASE_URL" : "DATABASE_URL"), max: 1, connectionTimeoutMillis: 5000 });
  try {
    const db = drizzle(pool, { schema });
    if (apply) console.log(JSON.stringify({ step: "import", ...await importLegacy(db, actor!, before, customerRows, orderRows) }));
    else {
      const [source] = await db.select().from(schema.importSources).where(eq(schema.importSources.namespace, sourceNamespace));
      if (!source || source.sha256 !== before) throw new Error("SOURCE_VERIFICATION_FAILED");
      const importedCustomers = await db.select().from(schema.customers).where(isNotNull(schema.customers.legacyCode));
      const importedOrders = await db.select().from(schema.historicalOrders).where(eq(schema.historicalOrders.sourceId, source.id));
      const byCustomer = new Map(importedCustomers.map(row => [row.legacyCode, row]));
      const byOrder = new Map(importedOrders.map(row => [row.legacyNumber, row]));
      const canonical = (row: Record<string, unknown>) => JSON.stringify(Object.fromEntries(Object.entries(row).sort(([a], [b]) => a.localeCompare(b))));
      const customerMismatch = customerRows.filter(row => canonical(byCustomer.get(Number(row.legacy_codigo))?.legacyOriginal ?? {}) !== canonical(row)).length;
      const orderMismatch = orderRows.filter(row => {
        const imported = byOrder.get(Number(row.legacy_num_trabajo));
        const customerId = typeof row.customer_id === "number" ? byCustomer.get(row.customer_id)?.id ?? null : null;
        return !imported || imported.customerId !== customerId || canonical(imported.original) !== canonical(row);
      }).length;
      console.log(JSON.stringify({ step: "verify_target", customers: importedCustomers.length, orders: importedOrders.length, customerMismatch, orderMismatch }));
      if (customerMismatch || orderMismatch || importedCustomers.length !== customerRows.length || importedOrders.length !== orderRows.length) throw new Error("SOURCE_VERIFICATION_FAILED");
    }
  }
  finally { await pool.end(); }
}
main().catch(error => {
  const allowed = ["SOURCE_CHANGED_REQUIRES_RECONCILIATION", "SOURCE_COUNT_MISMATCH", "SOURCE_CHANGED_DURING_READ", "SQLITE_INTEGRITY_FAILED", "SQLITE_FOREIGN_KEYS_FAILED", "SOURCE_VERIFICATION_FAILED", "FORBIDDEN"];
  const cause = error?.cause ?? error;
  console.error(JSON.stringify({ step: "import", status: "failed", category: allowed.includes(error?.message) ? error.message : "IMPORT_FAILED", errorType: error?.name, databaseCode: cause?.code, constraint: cause?.constraint, validation: error?.issues?.map((issue: { code: string; path: unknown[] }) => ({ code: issue.code, path: issue.path })) }));
  process.exitCode = 1;
});
