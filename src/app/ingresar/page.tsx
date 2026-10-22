import { Wrench, ClipboardList, Users, ShieldCheck } from "lucide-react";
import { LoginForm } from "./form";
import { isConfigured } from "@/server/env";
export const dynamic = "force-dynamic";
export default function LoginPage() {
  const enabled = isConfigured();
  return <main className="min-h-screen lg:grid lg:grid-cols-[1.1fr_1fr]">
    <section className="relative flex flex-col justify-between overflow-hidden bg-[#183d30] p-8 text-white md:p-14 lg:min-h-screen lg:p-16">
      <div className="flex items-center gap-3"><div className="rounded-xl border border-white/20 p-3"><Wrench className="size-6" /></div><div><p className="text-xl font-bold tracking-tight">GALANTE</p><p className="text-xs tracking-[0.22em] text-emerald-100/60">TALLER 2.0</p></div></div>
      <div className="max-w-lg py-14 lg:py-20"><p className="mb-5 text-xs font-semibold tracking-[0.2em] text-emerald-200">CADA TRABAJO, EN SU LUGAR</p><h1 className="text-4xl leading-tight font-semibold tracking-tight md:text-5xl">El taller sigue.<br /><span className="text-[#a8d1b8]">La gestión evoluciona.</span></h1><p className="mt-6 max-w-md text-base leading-7 text-white/65">Un espacio para acompañar cada reparación, desde el ingreso hasta la entrega.</p>
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80"><span className="flex items-center gap-2"><Users className="size-4" />Clientes</span><span className="flex items-center gap-2"><ClipboardList className="size-4" />Trabajos</span><span className="flex items-center gap-2"><ShieldCheck className="size-4" />Acceso por rol</span></div></div>
      <p className="text-xs text-white/40">Ricardo Galante · Gestión de taller</p>
    </section>
    <section className="flex items-center justify-center px-6 py-14 md:p-16"><div className="w-full max-w-sm"><span className="rounded-full border border-[#d2ddd5] px-3 py-1 text-xs font-medium text-[#52715f]">Acceso al sistema</span><h2 className="mt-7 text-3xl font-semibold tracking-tight">Buen trabajo empieza<br />con todo en orden.</h2><p className="mt-3 text-sm leading-6 text-neutral-500">Ingresá con tu cuenta para abrir el taller.</p>
      {!enabled && <div role="status" className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Instalación en preparación. Falta configurar la conexión y el acceso inicial.</div>}
      <LoginForm enabled={enabled} /><p className="mt-10 border-t border-[#dce2dc] pt-5 text-xs text-neutral-400">Versión inicial · Acceso y base del sistema</p>
    </div></section>
  </main>;
}
