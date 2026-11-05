"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireUser, AccessError } from "@/server/auth/access";
import { getDb } from "@/server/db";
import { createDeliveryNote } from "@/server/documents/service";
import { AccountError } from "@/server/accounts/service";

export async function saveDeliveryNote(_previous: { error: string }, form: FormData) {
  let id;
  try { id = await createDeliveryNote(getDb(), await requireUser("work:write"), Object.fromEntries(form)); }
  catch (error) {
    if (error instanceof AccessError) return { error: "Tu sesión venció o no tenés permisos." };
    if (error instanceof AccountError) return { error: error.message };
    if (error instanceof ZodError) return { error: error.issues[0]?.message ?? "Revisá los datos de la constancia." };
    console.error(JSON.stringify({ event: "delivery_note_failed" }));
    return { error: "No pudimos confirmar la constancia. Consultá los documentos antes de reintentar." };
  }
  revalidatePath("/comprobantes");
  revalidatePath(`/ordenes/${form.get("orderId")}`);
  redirect(`/comprobantes/remitos/${id}`);
}
