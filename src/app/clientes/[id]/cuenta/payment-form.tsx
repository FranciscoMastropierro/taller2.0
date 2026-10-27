"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { savePayment } from "./payment-actions";

type Option = { id: string; reference: string; remaining: string };
function ApplicationFields({ debts, values, change, prefix }: { prefix: string; debts: Option[]; values: Record<string, string>; change: (id: string, value: string) => void }) {
  return <fieldset className="space-y-3"><legend className="mb-3 font-semibold">Aplicaciones explícitas</legend><p className="text-sm text-neutral-500">Indicá cuánto aplicar a cada obligación. Vacío: conservar como crédito disponible.</p>{debts.map(debt => <div key={debt.id} className="grid gap-2 sm:grid-cols-[1fr_160px]"><label htmlFor={`${prefix}-allocation-${debt.id}`} className="self-center text-sm">{debt.reference} · Pendiente ARS {debt.remaining}</label><Input id={`${prefix}-allocation-${debt.id}`} inputMode="decimal" placeholder="Sin aplicar" value={values[debt.id] ?? ""} onChange={e => change(debt.id, e.target.value)} /></div>)}</fieldset>;
}
export function ReceiptForm({ id, componentId, customerId, today, debts }: { id: string; componentId: string; customerId: string; today: string; debts: Option[] }) {
  const [state, action, pending] = useActionState(savePayment.bind(null, "receipt"), { error: "" });
  const [components, setComponents] = useState([{ id: componentId, method: "cash", amount: "" }]);
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  return <form action={action} aria-label="Registrar cobro" className="mt-5 space-y-6"><input type="hidden" name="id" value={id} /><input type="hidden" name="customerId" value={customerId} /><input type="hidden" name="components" value={JSON.stringify(components)} /><input type="hidden" name="allocations" value={JSON.stringify(Object.entries(allocations).filter(([, amount]) => amount.trim()).map(([debtId, amount]) => ({ debtId, amount })))} />
    <div><label className="mb-2 block text-sm font-semibold" htmlFor="receipt-date">Fecha del cobro</label><Input id="receipt-date" name="date" type="date" required value={date} onChange={e => setDate(e.target.value)} /></div>
    <fieldset className="space-y-4"><legend className="mb-3 font-semibold">Medios de pago</legend>{components.map((component, index) => <div key={component.id} className="flex flex-wrap gap-3"><div className="min-w-40 flex-1"><label className="mb-2 block text-sm" htmlFor={`method-${component.id}`}>Medio {index + 1}</label><select id={`method-${component.id}`} value={component.method} onChange={e => setComponents(rows => rows.map(row => row.id === component.id ? { ...row, method: e.target.value } : row))} className="w-full rounded border border-input p-3"><option value="cash">Efectivo</option><option value="transfer">Transferencia</option></select></div><div className="min-w-40 flex-1"><label className="mb-2 block text-sm" htmlFor={`amount-${component.id}`}>Importe {index + 1} ARS</label><Input id={`amount-${component.id}`} required inputMode="decimal" value={component.amount} onChange={e => setComponents(rows => rows.map(row => row.id === component.id ? { ...row, amount: e.target.value } : row))} /></div>{components.length > 1 && <Button type="button" variant="outline" className="self-end" onClick={() => setComponents(rows => rows.filter(row => row.id !== component.id))}>Quitar medio {index + 1}</Button>}</div>)}<Button type="button" variant="outline" disabled={components.length >= 20} onClick={() => setComponents(rows => [...rows, { id: crypto.randomUUID(), method: "cash", amount: "" }])}>Agregar medio de pago</Button></fieldset>
    <ApplicationFields prefix={id} debts={debts} values={allocations} change={(key, value) => setAllocations(v => ({ ...v, [key]: value }))} />
    <div><label htmlFor="receipt-note" className="mb-2 block text-sm font-semibold">Concepto / observaciones del cobro</label><textarea id="receipt-note" name="note" maxLength={1000} rows={2} className="w-full rounded border border-input p-3" value={note} onChange={e => setNote(e.target.value)} /></div>
    <p className="text-sm text-neutral-500">Sin aplicaciones, se registra como anticipo. El excedente queda disponible. No emite una factura.</p>{state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}<Button disabled={pending}>{pending ? "Registrando…" : "Registrar cobro y recibo"}</Button></form>;
}
export function ApplyCreditForm({ id, customerId, debts, credits }: { id: string; customerId: string; debts: Option[]; credits: Option[] }) {
  const [state, action, pending] = useActionState(savePayment.bind(null, "apply"), { error: "" });
  const [creditId, setCreditId] = useState("");
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  return <form action={action} aria-label="Aplicar crédito" className="mt-5 space-y-5"><input type="hidden" name="id" value={id} /><input type="hidden" name="customerId" value={customerId} /><input type="hidden" name="allocations" value={JSON.stringify(Object.entries(allocations).filter(([, amount]) => amount.trim()).map(([debtId, amount]) => ({ debtId, amount })))} />
    <div><label htmlFor="available-credit" className="mb-2 block font-semibold">Crédito para aplicar</label><select id="available-credit" name="creditId" required value={creditId} onChange={e => setCreditId(e.target.value)} className="w-full rounded border border-input p-3"><option value="">Seleccionar crédito</option>{credits.map(credit => <option key={credit.id} value={credit.id}>{credit.reference} · ARS {credit.remaining}</option>)}</select></div>
    <ApplicationFields prefix={id} debts={debts} values={allocations} change={(key, value) => setAllocations(v => ({ ...v, [key]: value }))} />{state.error && <p role="alert" className="text-red-700">{state.error}</p>}<Button disabled={pending}>{pending ? "Aplicando…" : "Aplicar crédito sin nuevo cobro"}</Button></form>;
}
