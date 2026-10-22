import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireCustomerReader } from "../access";
import { can } from "@/server/auth/permissions";
import { getDb } from "@/server/db";
import { customers } from "@/server/db/schema";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "../form";

export default async function CustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ editar?: string; guardado?: string }> }) {
  const user = await requireCustomerReader();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [customer] = await getDb().select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!customer) notFound();
  const query = await searchParams;
  const editing = query.editar === "1" && can(user.role, "customers:write");
  return <><Link href="/clientes" className="text-sm font-semibold text-primary">← Todos los clientes</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Cliente #{customer.code}</p><h1 className="break-words text-3xl font-semibold tracking-tight">{editing ? "Editar cliente" : customer.name}</h1></div>{!editing && can(user.role, "customers:write") && <Button asChild variant="outline"><Link href={`/clientes/${id}?editar=1`}>Editar datos</Link></Button>}</div>
    {query.guardado === "1" && !editing && <p role="status" className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Cliente guardado correctamente.</p>}
    <section className="mt-8 rounded-xl border border-input bg-white p-6 sm:p-8">{editing ? <CustomerForm customer={customer} /> : <><h2 className="mb-7 text-lg font-semibold">Datos del cliente</h2><dl className="grid gap-7 sm:grid-cols-2">{[["DNI / CUIT", customer.document], ["Teléfono", customer.phone], ["Correo electrónico", customer.email], ["Dirección", customer.address], ["Observaciones", customer.notes]].map(([label, value]) => <div key={label} className={label === "Observaciones" ? "sm:col-span-2" : ""}><dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm">{value || "Sin registrar"}</dd></div>)}</dl><p className="mt-8 border-t border-input pt-5 text-xs text-neutral-400">Última actualización: {customer.updatedAt.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</p></>}</section>
  </>;
}
