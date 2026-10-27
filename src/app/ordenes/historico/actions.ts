"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireUser, AccessError } from "@/server/auth/access";
import { getDb } from "@/server/db";
import { continueHistoricalOrder } from "@/server/legacy/service";
import { OrderError } from "@/server/orders/service";

export async function continueHistory(_previous: { error: string }, form: FormData) {
  let id;
  try { id = await continueHistoricalOrder(getDb(), await requireUser("work:write"), Object.fromEntries(form)); }
  catch (error) {
    if (error instanceof AccessError) return { error: "Tu sesión venció o no tenés permisos." };
    if (error instanceof ZodError) return { error: "Elegí cliente y estado para continuar." };
    if (error instanceof OrderError) return { error: error.message };
    console.error(JSON.stringify({ event: "history_continuation_failed" }));
    return { error: "No pudimos confirmar la continuidad. Consultá la orden antes de reintentar." };
  }
  revalidatePath("/ordenes");
  revalidatePath("/ordenes/historico");
  redirect(`/ordenes/${id}`);
}
