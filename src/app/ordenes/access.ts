import "server-only";
import { redirect } from "next/navigation";
import { requireUser, AccessError } from "@/server/auth/access";

export async function requireOrderReader() {
  try { return await requireUser(); }
  catch (error) { if (error instanceof AccessError) redirect("/ingresar"); throw error; }
}
