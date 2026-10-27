"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveOpening } from "./actions";

export function OpeningForm({ customerId, id, today }: { customerId: string; id: string; today: string }) {
  const [state, action, pending] = useActionState(saveOpening, { error: "" });
  const [values, setValues] = useState({ direction: "debt", amount: "", reference: "", date: today, evidence: "", reconciled: false });
  return <form action={action} className="mt-6 grid gap-5 sm:grid-cols-2"><input type="hidden" name="id" value={id} /><input type="hidden" name="customerId" value={customerId} />
    <div><label htmlFor="opening-direction" className="mb-2 block text-sm font-semibold">Tipo de apertura</label><select id="opening-direction" name="direction" value={values.direction} onChange={e => setValues(v => ({ ...v, direction: e.target.value }))} className="w-full rounded border border-input p-3"><option value="debt">Deuda pendiente</option><option value="credit">Crédito a favor</option></select></div>
    <div><label htmlFor="opening-amount" className="mb-2 block text-sm font-semibold">Importe ARS</label><Input id="opening-amount" name="amount" inputMode="decimal" required maxLength={16} value={values.amount} onChange={e => setValues(v => ({ ...v, amount: e.target.value }))} /></div>
    <div><label htmlFor="opening-reference" className="mb-2 block text-sm font-semibold">Referencia única de origen</label><Input id="opening-reference" name="reference" required minLength={3} maxLength={100} placeholder="Documento o apertura revisada" value={values.reference} onChange={e => setValues(v => ({ ...v, reference: e.target.value }))} /></div>
    <div><label htmlFor="opening-date" className="mb-2 block text-sm font-semibold">Fecha de apertura</label><Input id="opening-date" name="date" type="date" required value={values.date} onChange={e => setValues(v => ({ ...v, date: e.target.value }))} /></div>
    <div className="sm:col-span-2"><label htmlFor="opening-evidence" className="mb-2 block text-sm font-semibold">Respaldo de conciliación</label><textarea id="opening-evidence" name="evidence" required minLength={10} maxLength={1000} rows={3} className="w-full rounded border border-input p-3" value={values.evidence} onChange={e => setValues(v => ({ ...v, evidence: e.target.value }))} /></div>
    <label className="flex items-start gap-3 text-sm sm:col-span-2"><input name="reconciled" type="checkbox" required checked={values.reconciled} onChange={e => setValues(v => ({ ...v, reconciled: e.target.checked }))} className="mt-1" /><span>Revisé el saldo y su respaldo. Esta referencia no se está contando también como otra obligación.</span></label>
    {state.error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{state.error}</p>}<div className="sm:col-span-2"><Button disabled={pending}>{pending ? "Registrando…" : "Registrar apertura conciliada"}</Button></div></form>;
}
