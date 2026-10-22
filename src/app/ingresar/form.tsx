"use client";
import { useActionState, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function LoginForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(login, { error: "" });
  const [username, setUsername] = useState("");
  return <form action={action} className="mt-8 space-y-5">
    <div className="space-y-2"><label htmlFor="username" className="text-sm font-semibold">Usuario</label><Input id="username" name="username" value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" placeholder="Tu usuario" minLength={3} maxLength={80} required disabled={!enabled || pending} /></div>
    <div className="space-y-2"><label htmlFor="password" className="text-sm font-semibold">Contraseña</label><Input id="password" name="password" type="password" autoComplete="current-password" placeholder="Tu contraseña" maxLength={128} required disabled={!enabled || pending} /></div>
    {state.error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
    <Button type="submit" className="w-full" disabled={!enabled || pending}>{pending ? <><LoaderCircle className="size-4 animate-spin" />Ingresando…</> : <>Ingresar al taller<ArrowRight className="size-4" /></>}</Button>
    <p className="text-center text-xs leading-5 text-neutral-500">Si necesitás recuperar tu acceso, contactá a la persona que administra el sistema.</p>
  </form>;
}
