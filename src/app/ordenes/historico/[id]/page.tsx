import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { customers } from "@/server/db/schema";
import { readHistoricalOrder } from "@/server/legacy/service";
import { requireOrderReader } from "../../access";
import { ContinueForm } from "../continue-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const labels: Record<string, string> = { fecha_ingreso: "Fecha de ingreso original", marca: "Marca", modelo: "Modelo", descripcion_ingreso: "Trabajo solicitado", presupuesto_original: "Presupuesto original (texto)", sector_original: "Ubicación original", estado_original: "Estado original", observaciones: "Observaciones", fecha_terminacion: "Fecha de terminación original", descripcion_terminacion: "Trabajo realizado", importe_centavos: "Importe original (centavos; sin efecto en cuenta)", personal_original: "Personal original", tiempo_original: "Tiempo original (unidad sin confirmar)", fecha_entrega: "Fecha de entrega original", condicion_entrega: "Condición original", numero_factura_entrega: "Referencia de factura original" };
export default async function HistoricalOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ cliente?: string; original?: string }> }) {
  const user = await requireOrderReader();
  const { id } = await params;
  const db = getDb();
  const result = await readHistoricalOrder(db, user, id);
  if (!result) notFound();
  const { history, customerName } = result;
  const previouslyDelivered = String(history.original.estado_original ?? "").trim().toUpperCase() === "ENTREGADO";
  const query = await searchParams;
  if (history.continuedOrderId && query.original !== "1") redirect(`/ordenes/${history.continuedOrderId}`);
  const term = typeof query.cliente === "string" ? query.cliente.trim().slice(0, 160) : "";
  const pattern = `%${term.replace(/[\\%_]/g, "\\$&")}%`;
  const choices = await db.select({ id: customers.id, name: customers.name }).from(customers).where(or(history.customerId ? eq(customers.id, history.customerId) : undefined, term ? or(ilike(customers.name, pattern), ilike(sql`${customers.legacyCode}::text`, pattern), ilike(sql`${customers.code}::text`, pattern)) : sql`false`)).orderBy(customers.name).limit(25);
  if (history.customerId && !choices.some(choice => choice.id === history.customerId)) {
    const [linked] = await db.select({ id: customers.id, name: customers.name }).from(customers).where(eq(customers.id, history.customerId));
    if (linked) choices.unshift(linked);
  }
  return <><Link href="/ordenes/historico" className="text-sm text-primary">← Histórico</Link><h1 className="mt-5 text-3xl font-semibold">Ficha anterior #{history.legacyNumber}</h1><p className="mt-3">{customerName ?? "Cliente pendiente de identificar"}</p>
    <Link href={`/fichas/anteriores/${id}`} className="mt-5 inline-block font-semibold text-primary underline">Imprimir ficha anterior</Link>
    <dl className="my-7 grid gap-5 rounded-xl border border-input bg-white p-6 sm:grid-cols-2">{Object.entries(labels).map(([key, label]) => <div key={key}><dt className="text-xs font-semibold uppercase text-neutral-500">{label}</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm">{String(history.original[key] ?? "Sin registrar") || "Sin registrar"}</dd></div>)}</dl>
    {history.continuedOrderId ? <Link href={`/ordenes/${history.continuedOrderId}`} className="font-semibold text-primary underline">Ver continuidad de esta reparación</Link> : previouslyDelivered ? <p className="rounded border border-input bg-white p-5 text-sm">Esta reparación figura entregada en la copia anterior. Se conserva para consulta e impresión; otra reparación requiere una nueva orden.</p> : <section className="rounded-xl border border-input bg-white p-6"><h2 className="text-xl font-semibold">Continuar esta reparación</h2><p className="mt-3 text-sm text-neutral-500">Confirmá cliente y estado actual antes de incorporarla a las órdenes activas. No continúes una reparación ya entregada.</p>
      <form className="mt-5 flex gap-3"><label htmlFor="find-history-customer" className="sr-only">Buscar cliente para continuar</label><Input id="find-history-customer" name="cliente" defaultValue={term} placeholder="Nombre o código de cliente" /><Button variant="outline">Buscar cliente</Button></form>
      <ContinueForm key={term} id={id} customerId={history.customerId} choices={choices} /></section>}</>;
}
