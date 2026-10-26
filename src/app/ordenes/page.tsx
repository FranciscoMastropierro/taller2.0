import Link from "next/link";
import { Plus, Search, ClipboardList, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { can } from "@/server/auth/permissions";
import { getDb } from "@/server/db";
import { listOrders } from "@/server/orders/service";
import { orderStatuses, statusLabels } from "@/shared/contracts/orders";
import { z } from "zod";
import { requireOrderReader } from "./access";
import { StatusBadge } from "./status-badge";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireOrderReader();
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const q = value("q").trim().slice(0, 160);
  const location = value("mesa").trim().slice(0, 160);
  const status = z.enum(orderStatuses).safeParse(value("estado"));
  const customerId = z.uuid().safeParse(value("cliente"));
  const page = Math.min(100000, Math.max(1, Number.parseInt(value("pagina"), 10) || 1));
  const { rows, total } = await listOrders(getDb(), user, { q, location, status: status.success ? status.data : undefined, customerId: customerId.success ? customerId.data : undefined, page });
  const url = (number: number) => `/ordenes?${new URLSearchParams({ q, mesa: location, estado: status.success ? status.data : "", cliente: customerId.success ? customerId.data : "", pagina: String(number) })}`;
  return <><div className="flex flex-wrap items-start justify-between gap-5"><div><h1 className="text-4xl font-semibold tracking-tight">Órdenes de trabajo</h1><p className="mt-3 text-neutral-500">Del ingreso a la entrega, cada reparación tiene su lugar.</p>{user.role === "technician" && <p className="mt-2 text-sm font-semibold text-primary">Mostrando sólo tus órdenes asignadas.</p>}</div>{can(user.role, "work:write") && <Button asChild><Link href="/ordenes/nueva"><Plus className="size-4" />Nueva orden</Link></Button>}</div>
    <section className="mt-8 overflow-hidden rounded-xl border border-input bg-white"><form action="/ordenes" className="grid gap-4 border-b border-input p-5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]">
      {customerId.success && <input type="hidden" name="cliente" value={customerId.data} />}
      <div><label htmlFor="order-search" className="mb-2 block text-xs font-semibold text-neutral-500">BUSCAR</label><div className="relative"><Search className="absolute left-3 top-4 size-4 text-neutral-400" /><Input id="order-search" name="q" defaultValue={q} maxLength={160} placeholder="Número, cliente o equipo" className="bg-white pl-10" /></div></div>
      <div><label htmlFor="order-status" className="mb-2 block text-xs font-semibold text-neutral-500">ESTADO</label><select id="order-status" name="estado" defaultValue={status.success ? status.data : ""} className="h-12 w-full rounded-md border border-input bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Todos los estados</option>{orderStatuses.map(value => <option key={value} value={value}>{statusLabels[value]}</option>)}</select></div>
      <div><label htmlFor="order-location" className="mb-2 block text-xs font-semibold text-neutral-500">MESA / UBICACIÓN</label><Input id="order-location" name="mesa" defaultValue={location} maxLength={160} placeholder="Ej. Mesa 2" className="bg-white" /></div><Button type="submit" variant="outline" className="h-12 self-end">Buscar</Button>
    </form><div className="flex justify-between px-6 py-4 text-xs text-neutral-500"><p>{total} {total === 1 ? "orden" : "órdenes"}</p><Link href="/ordenes" className="text-primary">Limpiar filtros</Link></div>
      {rows.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y border-input bg-[#f7f8f5] text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-6 py-4">Orden / equipo</th><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4">Ubicación / técnico</th><th className="px-6 py-4"><span className="sr-only">Acciones</span></th></tr></thead><tbody className="divide-y divide-neutral-100">{rows.map(order => <tr key={order.id} className="hover:bg-[#f7faf7]"><td className="px-6 py-5"><Link href={`/ordenes/${order.id}`} className="font-semibold text-primary hover:underline">#{order.number} · {order.equipment}</Link><p className="mt-1 text-xs text-neutral-500">{[order.brand, order.model].filter(Boolean).join(" · ") || "Sin marca / modelo"}</p></td><td className="px-6 py-5">{order.customerName}</td><td className="px-6 py-5"><StatusBadge status={order.status} /></td><td className="px-6 py-5"><p>{order.location || "Sin ubicación"}</p><p className="mt-1 text-xs text-neutral-500">{order.technician || "Sin asignar"}</p></td><td className="px-6 py-5"><Link href={`/ordenes/${order.id}`} aria-label={`Ver orden ${order.number}`} className="inline-flex items-center gap-2 whitespace-nowrap text-primary">Ver orden<ArrowUpRight className="size-4" /></Link></td></tr>)}</tbody></table></div> : <div className="px-6 py-20 text-center"><ClipboardList className="mx-auto size-10 text-[#8ba698]" /><h2 className="mt-5 text-xl font-semibold">No hay órdenes para mostrar</h2><p className="mt-2 text-sm text-neutral-500">{q || location || status.success || customerId.success ? "Probá con otros filtros o iniciá una nueva búsqueda." : "Las reparaciones que ingreses aparecerán acá."}</p></div>}
      {(page > 1 || total > 25) && <nav aria-label="Páginas de órdenes" className="flex justify-between border-t border-input p-5 text-sm"><div>{page > 1 && <Link href={url(page - 1)}>Anterior</Link>}</div><span>Página {page}</span><div>{page * 25 < total && <Link href={url(page + 1)}>Siguiente</Link>}</div></nav>}
    </section><p className="mt-5 text-xs text-neutral-500">Numeración interna del nuevo sistema. Los estados y presupuestos no generan deuda.</p></>;
}
