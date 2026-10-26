import "server-only";
import { and, asc, eq, or } from "drizzle-orm";
import { getDb } from "@/server/db";
import { appUsers } from "@/server/db/schema";

export async function technicianChoices() {
  return getDb().select({ id: appUsers.id, displayName: appUsers.displayName }).from(appUsers).where(and(eq(appUsers.active, 1), or(eq(appUsers.role, "technician"), eq(appUsers.role, "admin")))).orderBy(asc(appUsers.displayName));
}
