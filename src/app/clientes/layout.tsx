import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Users, Wrench } from "lucide-react";
import { requireUser, AccessError } from "@/server/auth/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CustomersLayout({ children }: { children: React.ReactNode }) {
  let user;
  try { user = await requireUser(); }
  catch (error) { if (error instanceof AccessError) redirect("/ingresar"); throw error; }
  return <main className="min-h-screen"><header className="border-b border-input bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5"><Link href="/" className="flex items-center gap-3 font-bold"><Wrench className="size-6 text-primary" />GALANTE <span className="hidden text-xs font-normal text-neutral-400 sm:inline">TALLER 2.0</span></Link><span className="text-sm text-neutral-500">{user.displayName}</span></div></header><div className="mx-auto max-w-6xl px-6 py-8 sm:py-10"><Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-primary"><ArrowLeft className="size-4" />Inicio</Link><div className="mb-8 mt-8 flex items-center gap-2 text-xs font-semibold tracking-widest text-primary"><Users className="size-4" />GESTIÓN DEL TALLER</div>{children}</div></main>;
}
