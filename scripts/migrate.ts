import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDatabaseUrl } from "../src/server/env";
config({ path: ".env.local", quiet: true });
async function main() {
  const pool = new Pool({ connectionString: getDatabaseUrl("MIGRATION_DATABASE_URL"), max: 1, connectionTimeoutMillis: 5000 });
  try {
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
    console.log(JSON.stringify({ step: "migrate", result: "ok" }));
  } finally { await pool.end(); }
}
main().catch(() => { console.error(JSON.stringify({ step: "migrate", result: "error", category: "MIGRATION_FAILED", hint: "Verificar conexión directa y permisos de esquema" })); process.exitCode = 1; });
