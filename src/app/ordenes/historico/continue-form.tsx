"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { continueHistory } from "./actions";

export function ContinueForm({ id, customerId, choices }: { id: string; customerId: string | null; choices: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(continueHistory, { error: "" });
  const [customer, setCustomer] = useState(customerId ?? "");
  const [status, setStatus] = useState("queued");
  return <form action={action} className="mt-5 space-y-5"><input type="hidden" name="id" value={id} />
    <div><label htmlFor="history-customer" className="mb-2 block font-semibold">Cliente para continuar</label><select id="history-customer" name="customerId" required value={customer} onChange={event => setCustomer(event.target.value)} className="w-full rounded border border-input p-3"><option value="">Seleccionar cliente</option>{choices.map(choice => <option key={choice.id} value={choice.id}>{choice.name}</option>)}</select></div>
    <div><label htmlFor="history-status" className="mb-2 block font-semibold">Estado confirmado</label><select id="history-status" name="status" value={status} onChange={event => setStatus(event.target.value)} className="w-full rounded border border-input p-3"><option value="queued">TURNO — reparación abierta</option><option value="completed">TERMINADO — permanece en taller</option></select></div>
    <p className="text-sm text-neutral-500">Conserva el número anterior. No registra entrega, deuda ni cobro. El presupuesto y tiempo originales siguen en el histórico y no se convierten automáticamente.</p>
    {state.error && <p role="alert" className="text-red-700">{state.error}</p>}<Button disabled={pending}>{pending ? "Continuando…" : "Continuar reparación"}</Button></form>;
}
