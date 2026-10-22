import { z } from "zod";
const databaseUrl = z.string().url().refine(value => {
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) return false;
  return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || ["require", "verify-full"].includes(url.searchParams.get("sslmode") ?? "");
}, "PostgreSQL remoto requiere TLS (sslmode=require o verify-full)");
export function getDatabaseUrl(key: "DATABASE_URL" | "MIGRATION_DATABASE_URL" | "TEST_DATABASE_URL" = "DATABASE_URL") {
  const result = databaseUrl.safeParse(process.env[key]);
  if (!result.success) throw new Error(`Configuración inválida: ${key}`);
  return result.data;
}
export function getAuthSecret() {
  const result = z.string().min(32).safeParse(process.env.AUTH_SECRET);
  if (!result.success) throw new Error("Configurar AUTH_SECRET de al menos 32 caracteres");
  return result.data;
}
export function isConfigured() { return Boolean(process.env.DATABASE_URL && process.env.AUTH_SECRET); }
