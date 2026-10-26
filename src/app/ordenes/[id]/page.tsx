import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3, MapPin, UserRound, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDb } from "@/server/db";
import { can } from "@/server/auth/permissions";
import { readOrder } from "@/server/orders/service";
import { nextStatus, statusLabels, type OrderStatus } from "@/shared/contracts/orders";
import { requireOrderReader } from "../access";
import { technicianChoices } from "../choices";
import { OrderForm, OrderStatusForm } from "../form";
import { StatusBadge } from "../status-badge";

const eventLabels = { created: "Ingreso registrado", edited: "Datos actualizados", technical: "Seguimiento técnico actualizado", status: "Cambio de estado", correction: "Corrección administrativa" };
const historyFields: Record<string, string> = { equipment: "Equipo", brand: "Marca", model: "Modelo", serialNumber: "Serie", intake: "Ingreso", notes: "Observaciones", location: "Ubicación", assignedTo: "Técnico (ID)", diagnosis: "Diagnóstico", workDone: "Trabajo realizado", workedMinutes: "Tiempo acumulado (min)", budget: "Presupuesto ARS", approval: "Aprobación", status: "Estado" };
const date = (value: Date) => value.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" });
function historyValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "Sin registrar";
  if (key === "status" && String(value) in statusLabels) return statusLabels[value as OrderStatus];
  return String(value);
}

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ editar?: string; guardado?: string }> }) {
  const user = await requireOrderReader();
  const { id } = await params;
  const result = await readOrder(getDb(), user, id);
  if (!result) notFound();
  const { order, events } = result;
  const query = await searchParams;
  const writable = can(user.role, "work:write");
  const technical = !writable && can(user.role, "work:technical") && order.assignedTo === user.id;
  const editable = (writable || technical) && order.status !== "delivered";
  const editing = query.editar === "1" && editable;
  const next = nextStatus[order.status];
  return <><Link href="/ordenes" className="text-sm font-semibold text-primary">← Todas las órdenes</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-5"><div><div className="mb-3 flex items-center gap-3"><span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Orden #{order.number}</span><StatusBadge status={order.status} /></div><h1 className="break-words text-3xl font-semibold tracking-tight">{editing ? technical ? "Actualizar seguimiento" : "Editar orden" : order.equipment}</h1><p className="mt-3 text-neutral-500">Ingreso: {date(order.createdAt)} · Cliente: <Link href={`/clientes/${order.customerId}`} className="font-semibold text-primary hover:underline">{order.customerName}</Link></p></div>{!editing && editable && <Button asChild variant="outline"><Link href={`/ordenes/${id}?editar=1`}>{technical ? "Actualizar seguimiento" : "Editar orden"}</Link></Button>}</div>
    {query.guardado === "1" && !editing && <p role="status" className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Orden guardada correctamente.</p>}
    {editing ? <section className="mt-8 rounded-xl border border-input bg-white p-6 sm:p-8"><OrderForm key={order.version} id={id} customerId={order.customerId} version={order.version} initial={order} technical={technical} technicians={writable ? await technicianChoices() : []} /></section> : <>
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_320px]"><div className="space-y-6"><section className="rounded-xl border border-input bg-white p-6"><h2 className="flex items-center gap-2 text-lg font-semibold"><Wrench className="size-5 text-primary" />Equipo e ingreso</h2><dl className="mt-6 grid gap-5 sm:grid-cols-2">{[["Marca", order.brand], ["Modelo", order.model], ["Número de serie", order.serialNumber], ["Contacto", order.phone], ["Motivo de ingreso", order.intake], ["Observaciones de recepción", order.notes]].map(([label, value]) => <div key={label} className={label.includes("ingreso") || label.includes("Observaciones") ? "sm:col-span-2" : ""}><dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{value || "Sin registrar"}</dd></div>)}</dl></section>
        <section className="rounded-xl border border-input bg-white p-6"><h2 className="text-lg font-semibold">Seguimiento técnico</h2><dl className="mt-6 space-y-6">{[["Diagnóstico", order.diagnosis], ["Trabajo realizado", order.workDone]].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{value || "Sin registrar"}</dd></div>)}</dl><p className="mt-6 flex items-center gap-2 border-t border-input pt-5 text-sm"><Clock3 className="size-4 text-primary" />{order.workedMinutes} minutos acumulados</p></section>
        {can(user.role, "finance:read") && <section className="rounded-xl border border-input bg-white p-6"><h2 className="text-lg font-semibold">Presupuesto</h2><p className="mt-4 text-2xl font-semibold">{order.budget === null ? "Sin registrar" : `ARS ${order.budget}`}</p><p className="mt-2 text-xs text-neutral-500">Importe estimado. No genera deuda ni una factura.</p><h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-neutral-500">Evidencia de aprobación</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{order.approval || "Sin registrar"}</p></section>}
      </div><aside className="space-y-6"><section className="space-y-5 rounded-xl border border-input bg-white p-6"><h2 className="text-lg font-semibold">En el taller</h2><div className="flex gap-3"><MapPin className="mt-1 size-4 shrink-0 text-primary" /><div><p className="text-xs text-neutral-500">Mesa / ubicación</p><p className="mt-1 break-words text-sm font-semibold">{order.location || "Sin ubicación"}</p></div></div><div className="flex gap-3"><UserRound className="mt-1 size-4 shrink-0 text-primary" /><div><p className="text-xs text-neutral-500">Técnico asignado</p><p className="mt-1 text-sm font-semibold">{order.technician || "Sin asignar"}</p></div></div></section>
        {writable && next && <section className="rounded-xl border border-input bg-[#edf3ed] p-6"><h2 className="mb-4 text-lg font-semibold">{next === "completed" ? "Terminar trabajo" : "Entregar equipo"}</h2><OrderStatusForm key={order.version} id={id} version={order.version} current={order.status} next={next} /></section>}
        {order.status === "delivered" && <p className="rounded-xl border border-input p-5 text-sm text-neutral-500">Equipo entregado. La ficha se conserva para consulta.</p>}
        {can(user.role, "work:correct") && <details className="rounded-xl border border-input bg-white p-6"><summary className="cursor-pointer text-sm font-semibold">Corregir estado</summary><p className="my-4 text-xs leading-5 text-neutral-500">Sólo administración. La corrección y su motivo quedarán en el historial.</p><OrderStatusForm key={`correction-${order.version}`} id={id} version={order.version} current={order.status} correction /></details>}
      </aside></div>
      <section className="mt-8 rounded-xl border border-input bg-white p-6 sm:p-8"><h2 className="text-lg font-semibold">Historial de la orden</h2><ol className="mt-6 space-y-6">{events.map(event => <li key={event.id} className="border-l-2 border-[#c5d9cd] pl-5"><div className="flex flex-wrap justify-between gap-2"><h3 className="text-sm font-semibold">{eventLabels[event.kind]}</h3><span className="text-xs text-neutral-500">{date(event.createdAt)}</span></div><p className="mt-1 text-xs text-neutral-500">{event.actor} · Versión {event.version}</p>{event.reason && <p className="mt-3 whitespace-pre-wrap break-words text-sm">Motivo: {event.reason}</p>}<details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-primary">Ver detalle de cambios</summary><dl className="mt-3 grid gap-3 rounded-lg bg-[#f7f8f5] p-4 text-xs">{Object.entries(historyFields).filter(([key]) => key in event.after && (!event.before || JSON.stringify(event.before[key]) !== JSON.stringify(event.after[key]))).map(([key, label]) => <div key={key}><dt className="font-semibold text-neutral-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words leading-5">{event.before ? `${historyValue(key, event.before[key])} → ` : ""}{historyValue(key, event.after[key])}</dd></div>)}</dl></details></li>)}</ol></section>
    </>}</>;
}
