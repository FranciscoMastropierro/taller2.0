import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser, AccessError } from "@/server/auth/access";
import { getDb } from "@/server/db";
import { readCheque } from "@/server/cheques/service";
import { chequeLabels } from "@/shared/contracts/cheques";
import { ChequeMovementForm } from "../movement-form";
import { can } from "@/server/auth/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function ChequePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ guardado?: string }> }) {
  let user;
  try { user = await requireUser("finance:read"); }
  catch (error) { if (error instanceof AccessError) redirect("/ingresar"); throw error; }
  const result = await readCheque(getDb(), user, (await params).id);
  if (!result) notFound();
  const { cheque, customerName, amount, events } = result;
  const query = await searchParams;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return <main className="mx-auto max-w-4xl px-6 py-10"><Link href="/cheques" className="text-primary">← Cartera de cheques</Link><h1 className="mt-6 text-3xl font-semibold">Cheque {cheque.number}</h1><p className="mt-3 text-lg">{chequeLabels[cheque.status]} · ARS {amount}</p><Link href={`/clientes/${cheque.customerId}/cuenta`} className="mt-3 inline-block text-primary">Cuenta de {customerName}</Link>{query.guardado === "1" && <p role="status" className="mt-5 rounded border border-emerald-200 bg-emerald-50 p-4">Movimiento registrado.</p>}
    <dl className="mt-7 grid gap-5 rounded-xl border border-input bg-white p-6 sm:grid-cols-2">{[["Banco", cheque.bank], ["Cuenta libradora", cheque.account], ["Entregante", cheque.deliveredBy], ["Emisión", cheque.issuedOn], ["Fecha de pago", cheque.payableOn]].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase text-neutral-500">{label}</dt><dd className="mt-2">{value}</dd></div>)}</dl>
    {can(user.role, "finance:write") && cheque.status !== "rejected" && <section className="mt-7 rounded-xl border border-input bg-white p-6"><h2 className="text-xl font-semibold">Registrar movimiento</h2><p className="mt-3 text-sm text-neutral-500">Registrar sólo movimientos confirmados. Esta pantalla no realiza operaciones bancarias.</p><ChequeMovementForm key={cheque.version} id={randomUUID()} chequeId={cheque.id} version={cheque.version} status={cheque.status} today={today} /></section>}
    <section className="mt-7 rounded-xl border border-input bg-white p-6"><h2 className="text-xl font-semibold">Historial</h2><ol className="mt-4 divide-y divide-input">{events.map(event => <li key={event.id} className="py-4"><strong>{event.toStatus in chequeLabels ? chequeLabels[event.toStatus as keyof typeof chequeLabels] : event.toStatus}</strong><p className="mt-2 text-xs text-neutral-500">{event.businessDate} · Revisión {event.version}</p><p className="mt-2 whitespace-pre-wrap text-sm">{event.reason}</p></li>)}</ol></section></main>;
}
