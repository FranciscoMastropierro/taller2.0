"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveDeliveryNote } from "./delivery-actions";
export function DeliveryNoteForm({ id, orderId, version, today }: { id: string; orderId: string; version: number; today: string }) {
  const [commandId] = useState(id);
  const [state, action, pending] = useActionState(saveDeliveryNote, { error: "" });
  const [values, setValues] = useState({ receiver: "", date: today, note: "" });
  return <form action={action} className="mt-5 space-y-4"><input type="hidden" name="id" value={commandId} /><input type="hidden" name="orderId" value={orderId} /><input type="hidden" name="version" value={version} />
    <div><label htmlFor="delivery-receiver" className="mb-2 block text-sm font-semibold">Persona que retiró</label><Input id="delivery-receiver" name="receiver" required minLength={2} maxLength={160} value={values.receiver} onChange={e => setValues(v => ({ ...v, receiver: e.target.value }))} /></div>
    <div><label htmlFor="delivery-date" className="mb-2 block text-sm font-semibold">Fecha de la constancia</label><Input id="delivery-date" name="date" type="date" required value={values.date} onChange={e => setValues(v => ({ ...v, date: e.target.value }))} /></div>
    <div><label htmlFor="delivery-note" className="mb-2 block text-sm font-semibold">Observaciones de entrega</label><textarea id="delivery-note" name="note" rows={2} maxLength={1000} className="w-full rounded border border-input p-3" value={values.note} onChange={e => setValues(v => ({ ...v, note: e.target.value }))} /></div>
    {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}<Button disabled={pending}>{pending ? "Guardando…" : "Guardar constancia interna"}</Button></form>;
}
