"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireUser, AccessError } from "@/server/auth/access";
import { getDb } from "@/server/db";
import { createOpening, AccountError } from "@/server/accounts/service";

export async function saveOpening(_previous: { error: string }, form: FormData) {
  let customerId: string;
  try {
    const user = await requireUser("finance:read");
    await createOpening(getDb(), user, Object.fromEntries(form));
    customerId = String(form.get("customerId"));
  } catch (error) {
    if (error instanceof AccessError) return { error: "Tu sesión venció o no tenés permisos para registrar aperturas." };
    if (error instanceof ZodError) return { error: error.issues[0]?.message ?? "Revisá la apertura." };
    if (error instanceof AccountError) return { error: error.message };
    console.error(JSON.stringify({ event: "account_opening_failed" }));
    return { error: "No pudimos confirmar la apertura. Revisá los movimientos antes de reintentar." };
  }
  revalidatePath(`/clientes/${customerId}/cuenta`);
  redirect(`/clientes/${customerId}/cuenta?guardado=1`);
}
