import { randomUUID } from "node:crypto";
import Link from "next/link";
import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { customers } from "@/server/db/schema";
import { can } from "@/server/auth/permissions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requireOrderReader } from "../access";
import { technicianChoices } from "../choices";
import { OrderForm } from "../form";

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<{ cliente?: string; q?: string }> }) {
  const user = await requireOrderReader();
  if (!can(user.role, "work:write")) return <p role="alert">Tu cuenta no puede ingresar órdenes.</p>;
  const params = await searchParams;
  const parsedId = z.uuid().safeParse(params.cliente);
  const db = getDb();
  const [customer] = parsedId.success ? await db.select({ id: customers.id, name: customers.name, code: customers.code }).from(customers).where(eq(customers.id, parsedId.data)) : [];
  if (customer) return <><h1 className="text-3xl font-semibold tracking-tight">Nueva orden</h1><div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-input bg-[#edf3ed] p-5"><p className="text-sm"><span className="text-neutral-500">Cliente #{customer.code}</span><strong className="ml-3">{customer.name}</strong></p><Link href="/ordenes/nueva" className="text-sm font-semibold text-primary">Cambiar cliente</Link></div><section className="mt-6 rounded-xl border border-input bg-white p-6 sm:p-8"><OrderForm id={randomUUID()} customerId={customer.id} technicians={await technicianChoices()} /></section></>;
  const q = (typeof params.q === "string" ? params.q : "").trim().slice(0, 160);
  const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
  const matches = await db.select({ id: customers.id, code: customers.code, name: customers.name, phone: customers.phone }).from(customers).where(and(q ? or(ilike(customers.name, pattern), ilike(customers.phone, pattern), ilike(customers.document, pattern), ilike(sql`${customers.code}::text`, pattern)) : undefined)).orderBy(asc(customers.name), asc(customers.id)).limit(20);
  return <><h1 className="text-3xl font-semibold tracking-tight">Nueva orden</h1><p className="mt-3 text-neutral-500">Primero seleccioná el cliente que trae el equipo.</p>{params.cliente && <p role="alert" className="mt-4 text-sm text-red-800">El cliente seleccionado no existe. Volvé a elegirlo.</p>}<section className="mt-8 rounded-xl border border-input bg-white p-6"><form action="/ordenes/nueva" className="flex flex-wrap gap-3"><label htmlFor="customer-search" className="sr-only">Buscar cliente para la orden</label><Input id="customer-search" name="q" defaultValue={q} maxLength={160} placeholder="Nombre, código, documento o teléfono" className="sm:max-w-lg" /><Button type="submit">Buscar cliente</Button><Button asChild variant="outline"><Link href="/clientes/nuevo">Crear cliente</Link></Button></form><p className="mt-5 text-xs text-neutral-500">Hasta 20 coincidencias. Refiná la búsqueda para encontrar al cliente.</p><ul className="mt-4 divide-y divide-neutral-100">{matches.map(customer => <li key={customer.id}><Link href={`/ordenes/nueva?cliente=${customer.id}`} className="flex flex-wrap items-center justify-between gap-3 py-5 hover:text-primary"><div><p className="font-semibold">{customer.name}</p><p className="mt-1 text-xs text-neutral-500">#{customer.code} · {customer.phone || "Sin teléfono"}</p></div><span className="text-sm font-semibold text-primary">Seleccionar →</span></Link></li>)}</ul>{!matches.length && <p className="py-10 text-center text-sm text-neutral-500">No encontramos clientes. Podés crear uno desde Clientes.</p>}</section></>;
}
