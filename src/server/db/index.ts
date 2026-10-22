import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { z } from "zod";
import * as schema from "./schema";
import { getDatabaseUrl } from "../env";
const globalDb = globalThis as unknown as { galantePool?: Pool };
export function getPool() {
  if (!globalDb.galantePool) {
    globalDb.galantePool = new Pool({ connectionString: getDatabaseUrl(), max: z.coerce.number().int().min(1).max(20).parse(process.env.DATABASE_POOL_MAX ?? 5), connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000, statement_timeout: 10000 });
    globalDb.galantePool.on("error", () => console.error(JSON.stringify({ event: "database_pool_error" })));
  }
  return globalDb.galantePool;
}
export function getDb() { return drizzle(getPool(), { schema }); }
export type Database = ReturnType<typeof getDb>;
