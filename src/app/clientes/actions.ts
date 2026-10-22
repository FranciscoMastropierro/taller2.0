"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, AccessError } from "@/server/auth/access";
import { getDb } from "@/server/db";
import { customers } from "@/server/db/schema";
import { customerSchema } from "@/shared/contracts/customers";

export type CustomerFormState = { error: string };

export async function saveCustomer(_previous: CustomerFormState, form: FormData): Promise<CustomerFormState> {
  let user;
  try { user = await requireUser("customers:write"); }
  catch (error) {
    if (error instanceof AccessError) return { error: "Tu sesión venció o no tenés permisos para modificar clientes." };
    throw error;
  }
  const parsed = customerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisá los datos del cliente." };
  const id = form.get("id");
  let savedId: string;
  try {
    if (id) {
      const identity = z.object({ id: z.uuid(), version: z.coerce.number().int().positive() }).safeParse({ id, version: form.get("version") });
      if (!identity.success) return { error: "La ficha no es válida. Volvé a abrir el cliente." };
      const [saved] = await getDb().update(customers).set({ ...parsed.data, updatedBy: user.id, updatedAt: new Date(), version: sql`${customers.version} + 1` })
        .where(and(eq(customers.id, identity.data.id), eq(customers.version, identity.data.version))).returning({ id: customers.id });
      if (!saved) return { error: "El cliente cambió desde que abriste la ficha. Tus datos siguen en el formulario; abrí la ficha actual en otra pestaña para compararlos." };
      savedId = saved.id;
    } else {
      const [saved] = await getDb().insert(customers).values({ ...parsed.data, createdBy: user.id, updatedBy: user.id }).returning({ id: customers.id });
      savedId = saved.id;
    }
  } catch {
    console.error(JSON.stringify({ event: "customer_save_failed" }));
    return { error: "No pudimos confirmar el guardado. Revisá el listado antes de volver a intentar." };
  }
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${savedId}`);
  redirect(`/clientes/${savedId}?guardado=1`);
}
