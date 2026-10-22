import { redirect } from "next/navigation";
import { ClipboardList, Users, Wrench, LogOut, ShieldCheck, ArrowUpRight } from "lucide-react";
import { requireUser, AccessError } from "@/server/auth/access";
import { isConfigured } from "@/server/env";
import { signOut } from "@/auth";
import { roleLabels } from "@/shared/contracts/auth";
import { Button } from "@/components/ui/button";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function Home() {
  if (!isConfigured()) redirect("/ingresar");
  let user;
  try { user = await requireUser(); }
  catch (error) { if (error instanceof AccessError) redirect("/ingresar"); throw error; }
  return <main className="min-h-screen"><header className="border-b border-[#dce2dc] bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5"><div className="flex items-center gap-3"><Wrench className="size-7 text-primary" /><span className="text-xl font-bold tracking-tight">GALANTE <span className="ml-2 text-xs font-normal text-neutral-400">TALLER 2.0</span></span></div><div className="flex items-center gap-5"><span className="text-sm text-neutral-500">{user.displayName}</span><form action={async () => { "use server"; await signOut({ redirectTo: "/ingresar" }); }}><Button variant="outline" size="sm"><LogOut className="size-4" />Salir</Button></form></div></div></header>
    <div className="mx-auto max-w-6xl px-6 py-12"><div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary"><span className="size-2 rounded-full bg-emerald-600" />ACCESO VERIFICADO</div><h1 className="mt-4 text-4xl font-semibold tracking-tight">Bienvenido al taller.</h1><p className="mt-3 text-neutral-500">La base del nuevo sistema ya está en marcha.</p>
      <section className="mt-9 rounded-xl border border-[#d8e3da] bg-[#edf3ed] p-6"><div className="flex items-center gap-3"><ShieldCheck className="size-5 text-primary" /><h2 className="font-semibold">Tu acceso: {roleLabels[user.role]}</h2></div><p className="mt-3 max-w-2xl text-sm leading-6 text-[#5e7264]">Esta primera versión verifica tu identidad y los permisos de tu cuenta. Los módulos del taller se incorporarán en las siguientes entregas.</p></section>
      <div className="mt-8 grid gap-5 md:grid-cols-3">{[{ title: "Clientes", text: "Datos de contacto e historial de cada cliente.", Icon: Users }, { title: "Órdenes de trabajo", text: "Ingreso, terminación y entrega de reparaciones.", Icon: ClipboardList }, { title: "Mesas de trabajo", text: "Ubicación y seguimiento de los equipos.", Icon: Wrench }].map(({ title, text, Icon }) => <section key={title} className="rounded-xl border border-[#dce2dc] bg-white p-6"><div className="flex items-center justify-between"><Icon className="size-6 text-[#5b7867]" /><ArrowUpRight className="size-4 text-neutral-300" /></div><h2 className="mt-6 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-neutral-500">{text}</p><p className="mt-6 text-xs font-medium text-neutral-400">Próxima etapa</p></section>)}</div>
      <p className="mt-10 text-xs text-neutral-400">El guardado sin conexión se habilitará después de verificar persistencia y sincronización.</p>
    </div></main>;
}
