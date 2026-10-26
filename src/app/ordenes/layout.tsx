import Link from "next/link";
import { ClipboardList, Wrench } from "lucide-react";
import { requireOrderReader } from "./access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function OrdersLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOrderReader();
  return <main className="min-h-screen"><header className="border-b border-input bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5"><Link href="/" className="flex items-center gap-3 font-bold"><Wrench className="size-6 text-primary" />GALANTE <span className="hidden text-xs font-normal text-neutral-400 sm:inline">TALLER 2.0</span></Link><span className="text-sm text-neutral-500">{user.displayName}</span></div></header><div className="mx-auto max-w-6xl px-6 py-8"><nav className="flex gap-5 text-sm text-neutral-500"><Link href="/" className="hover:text-primary">Inicio</Link><Link href="/clientes" className="hover:text-primary">Clientes</Link><Link href="/ordenes" className="font-semibold text-primary">Órdenes</Link></nav><div className="mb-8 mt-8 flex items-center gap-2 text-xs font-semibold tracking-widest text-primary"><ClipboardList className="size-4" />GESTIÓN DEL TALLER</div>{children}</div></main>;
}
