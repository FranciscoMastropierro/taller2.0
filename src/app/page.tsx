import Link from "next/link";
import { redirect } from "next/navigation";
import { Banknote, ClipboardList, Files, Users, Wrench, LogOut, ShieldCheck, ArrowUpRight } from "lucide-react";
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
      <section className="mt-9 rounded-xl border border-[#d8e3da] bg-[#edf3ed] p-6"><div className="flex items-center gap-3"><ShieldCheck className="size-5 text-primary" /><h2 className="font-semibold">Tu acceso: {roleLabels[user.role]}</h2></div><p className="mt-3 max-w-2xl text-sm leading-6 text-[#5e7264]">Clientes y órdenes ya están disponibles. Cheques y comprobantes se incorporarán en las próximas entregas.</p></section>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[
        { title: "Clientes", text: "Datos de contacto e historial de cada cliente.", Icon: Users, href: "/clientes", link: "Abrir clientes", pending: false },
        { title: "Órdenes de trabajo", text: "Ingreso, terminación y entrega de reparaciones.", Icon: ClipboardList, href: "/ordenes", link: "Abrir órdenes", pending: false },
        { title: "Cheques", text: "Cartera de terceros, depósitos, acreditaciones y rechazos.", Icon: Banknote, href: "/cheques", link: "Ver cheques", pending: true },
        { title: "Comprobantes", text: "Remitos, consultas y facturación integrada con ARCA.", Icon: Files, href: "/comprobantes", link: "Ver comprobantes", pending: true },
      ].map(({ title, text, Icon, href, link, pending }) => <section key={title} className="flex flex-col rounded-xl border border-[#dce2dc] bg-white p-6"><div className="flex items-center justify-between gap-2"><Icon className="size-6 shrink-0 text-[#5b7867]" />{pending && <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-500">Pendiente</span>}</div><h2 className="mt-6 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-neutral-500">{text}</p><Link href={href} className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-primary">{link}<ArrowUpRight className="size-4" /></Link></section>)}</div>
      <p className="mt-10 text-xs text-neutral-400">El sistema requiere conexión a Internet para consultar y guardar datos.</p>
    </div></main>;
}
