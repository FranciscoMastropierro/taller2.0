import Link from "next/link";
import { count, desc, ilike, or, sql } from "drizzle-orm";
import { Plus, Search, Users, ArrowUpRight } from "lucide-react";
import { requireCustomerReader } from "./access";
import { can } from "@/server/auth/permissions";
import { getDb } from "@/server/db";
import { customers } from "@/server/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; pagina?: string }> }) {
  const user = await requireCustomerReader();
  const params = await searchParams;
  const q = (typeof params.q === "string" ? params.q : "").trim().slice(0, 160);
  const page = Math.min(100000, Math.max(1, Number.parseInt(params.pagina ?? "1", 10) || 1));
  const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
  const filter = q ? or(ilike(customers.name, pattern), ilike(customers.phone, pattern), ilike(customers.email, pattern), ilike(customers.document, pattern), ilike(sql`${customers.code}::text`, pattern)) : undefined;
  const db = getDb();
  const [rows, [totals]] = await Promise.all([
    db.select().from(customers).where(filter).orderBy(desc(customers.createdAt), desc(customers.id)).limit(25).offset((page - 1) * 25),
    db.select({ total: count() }).from(customers).where(filter),
  ]);
  const pageUrl = (value: number) => `/clientes?${new URLSearchParams({ q, pagina: String(value) })}`;
  return <>
    <div className="flex flex-wrap items-start justify-between gap-5"><div><h1 className="text-4xl font-semibold tracking-tight">Clientes</h1><p className="mt-3 text-neutral-500">Contactos y datos de tus clientes, en un solo lugar.</p></div>{can(user.role, "customers:write") && <Button asChild><Link href="/clientes/nuevo"><Plus className="size-4" />Nuevo cliente</Link></Button>}</div>
    <section className="mt-8 overflow-hidden rounded-xl border border-input bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-input p-5"><form action="/clientes" className="flex w-full gap-2 sm:max-w-xl"><label htmlFor="search-customers" className="sr-only">Buscar clientes</label><div className="relative flex-1"><Search className="absolute left-3 top-4 size-4 text-neutral-400" /><Input id="search-customers" name="q" defaultValue={q} placeholder="Nombre, código, documento o contacto" maxLength={160} className="bg-white pl-10" /></div><Button type="submit" variant="outline" className="h-12">Buscar</Button></form><p className="text-sm text-neutral-500">{totals.total} {totals.total === 1 ? "cliente" : "clientes"}{q && (totals.total === 1 ? " encontrado" : " encontrados")}</p></div>
      {rows.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-input bg-[#f7f8f5] text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Contacto</th><th className="px-6 py-4">Documento</th><th className="px-6 py-4"><span className="sr-only">Acciones</span></th></tr></thead><tbody className="divide-y divide-neutral-100">{rows.map(customer => <tr key={customer.id} className="hover:bg-[#f7faf7]"><td className="px-6 py-5"><Link href={`/clientes/${customer.id}`} className="font-semibold text-primary hover:underline">{customer.name}</Link><p className="mt-1 text-xs text-neutral-400">Cliente #{customer.code}</p></td><td className="px-6 py-5"><p>{customer.phone || "Sin teléfono"}</p><p className="mt-1 text-xs text-neutral-500">{customer.email}</p></td><td className="px-6 py-5 text-neutral-500">{customer.document || "—"}</td><td className="px-6 py-5"><Link href={`/clientes/${customer.id}`} aria-label={`Ver ficha de ${customer.name}`} className="inline-flex items-center gap-2 whitespace-nowrap text-primary">Ver ficha<ArrowUpRight className="size-4" /></Link></td></tr>)}</tbody></table></div> : <div className="px-6 py-20 text-center"><Users className="mx-auto size-10 text-[#8ba698]" /><h2 className="mt-5 text-xl font-semibold">{q ? "No encontramos clientes" : "Tu agenda empieza acá"}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">{q ? "Probá con otro nombre, código o dato de contacto." : "Agregá el primer cliente para tener sus datos disponibles al recibir un trabajo."}</p>{q && <Link href="/clientes" className="mt-5 inline-block text-sm font-semibold text-primary">Limpiar búsqueda</Link>}</div>}
      {(page > 1 || totals.total > 25) && <nav aria-label="Páginas de clientes" className="flex items-center justify-between border-t border-input p-5"><div>{page > 1 && <Link href={pageUrl(page - 1)} className="text-sm text-primary">Anterior</Link>}</div><span className="text-xs text-neutral-500">Página {page}</span><div>{page * 25 < totals.total && <Link href={pageUrl(page + 1)} className="text-sm text-primary">Siguiente</Link>}</div></nav>}
    </section>
  </>;
}
