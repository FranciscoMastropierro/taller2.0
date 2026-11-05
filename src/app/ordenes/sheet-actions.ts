"use server";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireUser, AccessError } from "@/server/auth/access";
import { getDb } from "@/server/db";
import { saveOrderSheet } from "@/server/orders/sheets";
import { OrderError } from "@/server/orders/service";

export async function prepareSheet(_previous: { error: string }, form: FormData) {
  let id;
  try { id = await saveOrderSheet(getDb(), await requireUser("work:write"), Object.fromEntries(form)); }
  catch (error) {
    if (error instanceof AccessError) return { error: "Tu sesión venció o no tenés permisos." };
    if (error instanceof OrderError) return { error: error.message };
    if (error instanceof ZodError) return { error: "Volvé a abrir la orden para preparar la ficha." };
    console.error(JSON.stringify({ event: "sheet_prepare_failed" }));
    return { error: "No pudimos preparar la ficha. Consultá las fichas guardadas antes de reintentar." };
  }
  redirect(`/fichas/${id}`);
}
