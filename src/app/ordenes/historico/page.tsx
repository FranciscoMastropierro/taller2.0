import Link from "next/link";
import { requireOrderReader } from "../access";
import { getDb } from "@/server/db";
import { listHistoricalOrders } from "@/server/legacy/service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";

export default async function HistoricalOrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; pagina?: string; cliente?: string }> }) {
  const user = await requireOrderReader();
  const query = await searchParams;
  const q = (typeof query.q === "string" ? query.q : "").trim().slice(0, 160);
  const page = Math.min(100000, Math.max(1, Number.parseInt(query.pagina ?? "1", 10) || 1));
  const customer = z.uuid().safeParse(query.cliente);
  const customerId = customer.success ? customer.data : undefined;
  const { rows, total } = await listHistoricalOrders(getDb(), user, q, page, customerId);
  const pageUrl = (value: number) => `/ordenes/historico?${new URLSearchParams({ q, pagina: String(value), ...(customerId ? { cliente: customerId } : {}) })}`;
  return <><Link href="/ordenes" className="text-sm text-primary">← Órdenes actuales</Link><h1 className="mt-5 text-3xl font-semibold">Órdenes anteriores</h1><p className="mt-3 text-sm text-neutral-500">Copia recuperada. Las órdenes continuadas se consultan en la bandeja actual por su número anterior.</p>
    <form className="my-7 flex gap-3">{customerId && <input type="hidden" name="cliente" value={customerId} />}<label className="sr-only" htmlFor="history-search">Buscar histórico</label><Input id="history-search" name="q" defaultValue={q} placeholder="Número anterior, cliente, marca o modelo" /><Button>Buscar</Button></form><p className="mb-4 text-sm">{total} órdenes anteriores sin continuar</p>
    <ul className="divide-y divide-input rounded-xl border border-input bg-white">{rows.map(row => <li key={row.id} className="p-5"><Link className="font-semibold text-primary" href={`/ordenes/historico/${row.id}`}>Ficha anterior #{row.legacyNumber} · {String(row.original.marca ?? "")} {String(row.original.modelo ?? "")}</Link><p className="mt-2 text-sm">{row.customerName ?? "Cliente pendiente de identificar"}</p><p className="mt-1 text-xs text-neutral-500">Estado original: {String(row.original.estado_original ?? "Sin registrar")} · Fecha original: {String(row.original.fecha_ingreso ?? "Sin registrar")}</p></li>)}</ul>
    {!rows.length && <p className="mt-6">No encontramos órdenes anteriores.</p>}<nav aria-label="Páginas del histórico" className="my-6 flex justify-between">{page > 1 ? <Link href={pageUrl(page - 1)}>Anterior</Link> : <span />}<span>Página {page}</span>{page * 25 < total ? <Link href={pageUrl(page + 1)}>Siguiente</Link> : <span />}</nav></>;
}
