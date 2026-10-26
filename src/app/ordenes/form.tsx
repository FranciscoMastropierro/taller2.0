"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveOrder } from "./actions";
import { orderStatuses, statusLabels, type OrderStatus } from "@/shared/contracts/orders";

const fieldClass = "w-full rounded-md border border-input bg-background px-3 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring";
export type OrderFormValues = { equipment: string; brand: string; model: string; serialNumber: string; intake: string; location: string; assignedTo: string | null; notes: string; diagnosis: string; workDone: string; workedMinutes: number; budget: string | null; approval: string };
const empty: OrderFormValues = { equipment: "", brand: "", model: "", serialNumber: "", intake: "", location: "", assignedTo: "", notes: "", diagnosis: "", workDone: "", workedMinutes: 0, budget: "", approval: "" };

export function OrderForm({ id, customerId, version, initial, technicians = [], technical = false }: { id: string; customerId: string; version?: number; initial?: OrderFormValues; technicians?: { id: string; displayName: string }[]; technical?: boolean }) {
  const mode = version ? technical ? "technical" : "edit" : "create";
  const [state, action, pending] = useActionState(saveOrder.bind(null, mode), { error: "" });
  const [values, setValues] = useState({ ...empty, ...initial, workedMinutes: String(initial?.workedMinutes ?? 0) });
  const text = (key: "equipment" | "brand" | "model" | "serialNumber" | "location" | "budget", label: string, placeholder: string, required = false) => <div key={key}><label htmlFor={key} className="mb-2 block text-sm font-semibold">{label}{required && " *"}</label><Input id={key} name={key} value={values[key] ?? ""} onChange={event => setValues(current => ({ ...current, [key]: event.target.value }))} required={required} minLength={required ? 2 : undefined} maxLength={key === "budget" ? 16 : 160} inputMode={key === "budget" ? "decimal" : "text"} placeholder={placeholder} /></div>;
  const area = (key: "intake" | "notes" | "diagnosis" | "workDone" | "approval", label: string, required = false) => <div key={key} className="sm:col-span-2"><label htmlFor={key} className="mb-2 block text-sm font-semibold">{label}{required && " *"}</label><textarea id={key} name={key} value={values[key]} onChange={event => setValues(current => ({ ...current, [key]: event.target.value }))} rows={3} required={required} minLength={required ? 3 : undefined} maxLength={4000} className={fieldClass} /></div>;
  return <form action={action} className="space-y-7"><input type="hidden" name="id" value={id} /><input type="hidden" name="customerId" value={customerId} />{version && <input type="hidden" name="version" value={version} />}
    <div className="grid gap-6 sm:grid-cols-2">{!technical && <>
      <h2 className="text-lg font-semibold sm:col-span-2">Ingreso y equipo</h2>
      {text("equipment", "Equipo", "Ej. Taladro de banco", true)}{text("brand", "Marca", "Marca del equipo")}{text("model", "Modelo", "Modelo")}{text("serialNumber", "Número de serie", "Identificación del equipo")}
      {area("intake", "Motivo de ingreso", true)}{text("location", "Mesa / ubicación", "Ej. Mesa 2 · Estante A")}
      <div><label htmlFor="assignedTo" className="mb-2 block text-sm font-semibold">Técnico asignado</label><select id="assignedTo" name="assignedTo" value={values.assignedTo ?? ""} onChange={event => setValues(current => ({ ...current, assignedTo: event.target.value }))} className={fieldClass}><option value="">Sin asignar</option>{initial?.assignedTo && !technicians.some(user => user.id === initial.assignedTo) && <option value={initial.assignedTo}>Técnico no disponible (reasignar)</option>}{technicians.map(user => <option key={user.id} value={user.id}>{user.displayName}</option>)}</select></div>
      {area("notes", "Observaciones de recepción")}
      <h2 className="border-t border-input pt-6 text-lg font-semibold sm:col-span-2">Presupuesto</h2>
      {text("budget", "Presupuesto estimado (ARS)", "Ej. 12500,00")}
      <p className="self-center text-xs leading-5 text-neutral-500">Opcional. No genera deuda ni una factura. Ingresá el importe sin separadores de miles.</p>
      {area("approval", "Evidencia de aprobación", false)}
    </>}
      <h2 className="border-t border-input pt-6 text-lg font-semibold sm:col-span-2">Seguimiento técnico</h2>
      {area("diagnosis", "Diagnóstico")}{area("workDone", "Trabajo realizado")}
      <div><label htmlFor="workedMinutes" className="mb-2 block text-sm font-semibold">Tiempo trabajado acumulado (minutos)</label><Input id="workedMinutes" name="workedMinutes" type="number" min={0} max={10000000} step={1} required value={values.workedMinutes} onChange={event => setValues(current => ({ ...current, workedMinutes: event.target.value }))} /></div>
    </div>
    {state.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{state.error}</p>}
    <div className="flex flex-wrap justify-between gap-4 border-t border-input pt-6"><p className="text-xs text-neutral-500">* Campo obligatorio · Requiere conexión.</p><div className="flex gap-3"><Button asChild variant="outline"><Link href={version ? `/ordenes/${id}` : "/ordenes"}>Cancelar</Link></Button><Button disabled={pending}><Save className="size-4" />{pending ? "Guardando…" : "Guardar orden"}</Button></div></div>
  </form>;
}

export function OrderStatusForm({ id, version, next, current, correction = false }: { id: string; version: number; next?: OrderStatus; current: OrderStatus; correction?: boolean }) {
  const [state, action, pending] = useActionState(saveOrder.bind(null, correction ? "correction" : "status"), { error: "" });
  const [status, setStatus] = useState<OrderStatus>(next ?? orderStatuses.find(value => value !== current)!);
  const [reason, setReason] = useState("");
  return <form action={action} className="space-y-4"><input type="hidden" name="id" value={id} /><input type="hidden" name="version" value={version} />
    {correction ? <><label htmlFor="correction-status" className="block text-sm font-semibold">Estado corregido</label><select id="correction-status" name="status" className={fieldClass} value={status} onChange={event => setStatus(event.target.value as OrderStatus)}>{orderStatuses.filter(value => value !== current).map(value => <option key={value} value={value}>{statusLabels[value]}</option>)}</select><label htmlFor="correction-reason" className="block text-sm font-semibold">Motivo de corrección</label><textarea id="correction-reason" name="reason" required minLength={5} maxLength={1000} className={fieldClass} value={reason} onChange={event => setReason(event.target.value)} /></> : <><input type="hidden" name="status" value={next} /><input type="hidden" name="reason" value="" /><p className="text-sm text-neutral-500">{next === "completed" ? "El trabajo queda terminado y permanece en el taller." : "Confirmá que el cliente retiró el equipo del taller."}</p></>}
    {state.error && <p role="alert" className="text-sm text-red-800">{state.error}</p>}
    <Button disabled={pending} variant={correction ? "outline" : "default"}>{pending ? "Guardando…" : correction ? "Registrar corrección" : next === "completed" ? "Marcar terminado" : "Confirmar entrega"}</Button>
  </form>;
}
