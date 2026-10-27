"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireUser, AccessError } from "@/server/auth/access";
import { getDb } from "@/server/db";
import { AccountError } from "@/server/accounts/service";
import { applyAvailableCredit, createReceipt } from "@/server/payments/service";

export async function savePayment(mode: "receipt" | "apply", _previous: { error: string }, form: FormData) {
  let id: string;
  let customerId: string;
  try {
    const user = await requireUser("finance:write");
    const input = { ...Object.fromEntries(form), components: mode === "receipt" ? JSON.parse(String(form.get("components"))) : undefined, allocations: JSON.parse(String(form.get("allocations"))) };
    id = mode === "receipt" ? await createReceipt(getDb(), user, input) : await applyAvailableCredit(getDb(), user, input);
    customerId = String(form.get("customerId"));
  } catch (error) {
    if (error instanceof AccessError) return { error: "Tu sesión venció o no tenés permisos para operar cobros." };
    if (error instanceof AccountError) return { error: error.message };
    if (error instanceof ZodError) return { error: error.issues[0]?.message ?? "Revisá el cobro." };
    if (error instanceof SyntaxError) return { error: "Los datos del cobro no son válidos. Volvé a abrir la cuenta." };
    console.error(JSON.stringify({ event: "payment_command_failed", command: mode }));
    return { error: "No pudimos confirmar la operación. Consultá la cuenta antes de reintentar." };
  }
  revalidatePath(`/clientes/${customerId}/cuenta`);
  revalidatePath("/comprobantes");
  redirect(mode === "receipt" ? `/comprobantes/recibos/${id}` : `/clientes/${customerId}/cuenta?aplicado=${id}`);
}
