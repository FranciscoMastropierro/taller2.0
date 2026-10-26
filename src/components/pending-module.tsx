import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Clock3, Wrench } from "lucide-react";
import { requireUser, AccessError } from "@/server/auth/access";

export async function PendingModule({ title, description, sections }: { title: string; description: string; sections: { title: string; description: string }[] }) {
  let user;
  try { user = await requireUser("finance:read"); }
  catch (error) {
    if (error instanceof AccessError) {
      if (error.status === 401) redirect("/ingresar");
      return <main className="mx-auto max-w-3xl px-6 py-16"><p role="alert">Tu cuenta no tiene acceso a este módulo administrativo.</p><Link href="/" className="mt-6 inline-block text-sm font-semibold text-primary">Volver al inicio</Link></main>;
    }
    throw error;
  }
  return <main className="min-h-screen"><header className="border-b border-input bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5"><Link href="/" className="flex items-center gap-3 font-bold"><Wrench className="size-6 text-primary" />GALANTE <span className="hidden text-xs font-normal text-neutral-400 sm:inline">TALLER 2.0</span></Link><span className="text-sm text-neutral-500">{user.displayName}</span></div></header><div className="mx-auto max-w-6xl px-6 py-10"><Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-500"><ArrowLeft className="size-4" />Inicio</Link><div className="mb-3 mt-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-500"><Clock3 className="size-4" />Pendiente de implementación</div><h1 className="text-4xl font-semibold tracking-tight">{title}</h1><p className="mt-3 max-w-2xl text-neutral-500">{description}</p><div role="status" className="mt-8 rounded-xl border border-input bg-[#edf3ed] p-5 text-sm leading-6">Este módulo está en preparación. Las operaciones se habilitarán en una próxima entrega.</div><div className="mt-8 grid gap-5 md:grid-cols-3">{sections.map(section => <section key={section.title} className="rounded-xl border border-dashed border-input bg-white p-6"><p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Pendiente</p><h2 className="mt-4 text-lg font-semibold">{section.title}</h2><p className="mt-3 text-sm leading-6 text-neutral-500">{section.description}</p><div aria-hidden="true" className="mt-7 space-y-3"><div className="h-2 w-4/5 rounded bg-neutral-100" /><div className="h-2 w-3/5 rounded bg-neutral-100" /><div className="h-2 w-2/3 rounded bg-neutral-100" /></div></section>)}</div></div></main>;
}
