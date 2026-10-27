"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveChequeMovement } from "./actions";
import type { ChequeState } from "@/shared/contracts/cheques";

export function ChequeMovementForm({ id, chequeId, version, status, today }: { id: string; chequeId: string; version: number; status: ChequeState; today: string }) {
  const [state, action, pending] = useActionState(saveChequeMovement, { error: "" });
  const [values, setValues] = useState({ action: status === "received" ? "deposit" : status === "deposited" ? "credit" : "reject", date: today, reason: "" });
  return <form action={action} className="mt-6 space-y-5"><input type="hidden" name="id" value={id} /><input type="hidden" name="chequeId" value={chequeId} /><input type="hidden" name="version" value={version} />
    <div><label htmlFor="cheque-action" className="mb-2 block font-semibold">Movimiento confirmado</label><select id="cheque-action" name="action" value={values.action} onChange={e => setValues(v => ({ ...v, action: e.target.value }))} className="w-full rounded border border-input p-3">{status === "received" && <option value="deposit">Registrar depósito</option>}{status === "deposited" && <option value="credit">Registrar acreditación</option>}<option value="reject">Registrar rechazo</option></select></div>
    <div><label htmlFor="cheque-date" className="mb-2 block font-semibold">Fecha del movimiento</label><Input id="cheque-date" name="date" type="date" required value={values.date} onChange={e => setValues(v => ({ ...v, date: e.target.value }))} /></div>
    <div><label htmlFor="cheque-reason" className="mb-2 block font-semibold">Motivo / respaldo</label><textarea id="cheque-reason" name="reason" required minLength={3} maxLength={1000} rows={3} className="w-full rounded border border-input p-3" value={values.reason} onChange={e => setValues(v => ({ ...v, reason: e.target.value }))} /></div>
    {values.action === "reject" && <p className="text-sm text-neutral-600">El rechazo revierte el crédito de este cheque y libera sólo sus aplicaciones. Otros componentes del cobro se conservan.</p>}{state.error && <p role="alert" className="text-red-700">{state.error}</p>}<Button disabled={pending}>{pending ? "Registrando…" : "Registrar movimiento"}</Button></form>;
}
