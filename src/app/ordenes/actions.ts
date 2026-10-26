"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireUser, AccessError } from "@/server/auth/access";
import { getDb } from "@/server/db";
import { createOrder, editOrder, changeOrderStatus, OrderError } from "@/server/orders/service";

export type OrderFormState = { error: string };
export async function saveOrder(mode: "create" | "edit" | "technical" | "status" | "correction", _previous: OrderFormState, form: FormData): Promise<OrderFormState> {
  let id: string;
  try {
    const user = await requireUser();
    const input = Object.fromEntries(form);
    const db = getDb();
    if (mode === "create") id = await createOrder(db, user, input);
    else if (mode === "edit" || mode === "technical") id = await editOrder(db, user, input, mode === "technical");
    else id = await changeOrderStatus(db, user, input, mode === "correction");
  } catch (error) {
    if (error instanceof AccessError) return { error: "Tu sesión venció o no tenés permisos para esta acción." };
    if (error instanceof OrderError) return { error: error.message };
    if (error instanceof ZodError) return { error: "Revisá los campos. " + (error.issues[0]?.message ?? "Datos inválidos.") };
    console.error(JSON.stringify({ event: "order_command_failed", command: mode }));
    return { error: "No pudimos confirmar el guardado. Consultá la ficha antes de volver a intentar." };
  }
  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${id}`);
  redirect(`/ordenes/${id}?guardado=1`);
}
