"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CustomerInput } from "@/shared/contracts/customers";
import { saveCustomer } from "./actions";

export function CustomerForm({ customer }: { customer?: CustomerInput & { id: string; version: number } }) {
  const [state, action, pending] = useActionState(saveCustomer, { error: "" });
  const [values, setValues] = useState<CustomerInput>({ name: customer?.name ?? "", document: customer?.document ?? "", phone: customer?.phone ?? "", email: customer?.email ?? "", address: customer?.address ?? "", notes: customer?.notes ?? "" });
  return <form action={action} className="space-y-7">
    {customer && <><input type="hidden" name="id" value={customer.id} /><input type="hidden" name="version" value={customer.version} /></>}
    <div className="grid gap-6 sm:grid-cols-2">
      {([
        ["name", "Nombre o razón social", "Ej. Taller San Martín", 160],
        ["document", "DNI / CUIT", "Documento del cliente", 30],
        ["phone", "Teléfono", "Número de contacto", 60],
        ["email", "Correo electrónico", "nombre@ejemplo.com", 160],
        ["address", "Dirección", "Calle, número y localidad", 240],
      ] as const).map(([name, label, placeholder, maxLength]) => <div key={name} className={name === "address" ? "sm:col-span-2" : ""}>
        <label htmlFor={name} className="mb-2 block text-sm font-semibold">{label}{name === "name" && " *"}</label>
        <Input id={name} name={name} value={values[name]} onChange={event => setValues(current => ({ ...current, [name]: event.target.value }))} placeholder={placeholder} required={name === "name"} minLength={name === "name" ? 2 : undefined} maxLength={maxLength} type={name === "email" ? "email" : name === "phone" ? "tel" : "text"} autoComplete={name === "name" ? "organization" : name === "phone" ? "tel" : name === "email" ? "email" : name === "address" ? "street-address" : "off"} />
      </div>)}
      <div className="sm:col-span-2"><label htmlFor="notes" className="mb-2 block text-sm font-semibold">Observaciones</label><textarea id="notes" name="notes" value={values.notes} onChange={event => setValues(current => ({ ...current, notes: event.target.value }))} maxLength={2000} rows={4} placeholder="Información útil para la atención del cliente" className="w-full rounded-md border border-input bg-background p-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
    </div>
    {state.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{state.error}</p>}
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-input pt-6"><p className="text-xs text-neutral-500">* Campo obligatorio · El guardado requiere conexión.</p><div className="flex gap-3"><Button asChild variant="outline"><Link href={customer ? `/clientes/${customer.id}` : "/clientes"}>Cancelar</Link></Button><Button disabled={pending}><Save className="size-4" />{pending ? "Guardando…" : "Guardar cliente"}</Button></div></div>
  </form>;
}
