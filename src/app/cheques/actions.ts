"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireUser, AccessError } from "@/server/auth/access";
import { getDb } from "@/server/db";
import { AccountError } from "@/server/accounts/service";
import { moveCheque } from "@/server/cheques/service";

export async function saveChequeMovement(_previous: { error: string }, form: FormData) {
  let id: string;
  try { id = await moveCheque(getDb(), await requireUser("finance:write"), Object.fromEntries(form)); }
  catch (error) {
    if (error instanceof AccessError) return { error: "Tu sesión venció o no tenés permisos." };
    if (error instanceof AccountError) return { error: error.message };
    if (error instanceof ZodError) return { error: error.issues[0]?.message ?? "Revisá el movimiento." };
    console.error(JSON.stringify({ event: "cheque_movement_failed" }));
    return { error: "No pudimos confirmar el movimiento. Consultá el cheque antes de reintentar." };
  }
  revalidatePath("/cheques");
  revalidatePath(`/cheques/${id}`);
  redirect(`/cheques/${id}?guardado=1`);
}
