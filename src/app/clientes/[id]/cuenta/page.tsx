import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser, AccessError } from "@/server/auth/access";
import { getDb } from "@/server/db";
import { readAccount } from "@/server/accounts/service";
import { ReceiptForm, ApplyCreditForm } from "./payment-form";
import { can } from "@/server/auth/permissions";
import { OpeningForm } from "./opening-form";

export default async function AccountPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ pagina?: string; guardado?: string; aplicado?: string; recibo?: string }> }) {
  let user;
  try { user = await requireUser("finance:read"); }
  catch (error) { if (error instanceof AccessError) redirect("/ingresar"); throw error; }
  const { id } = await params;
  const query = await searchParams;
  const page = Math.min(100000, Math.max(1, Number.parseInt(query.pagina ?? "1", 10) || 1));
  const commandCycle = [query.guardado ?? "", query.aplicado ?? "", query.recibo ?? ""].join(":");
  const account = await readAccount(getDb(), user, id, page);
  if (!account) notFound();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return <><Link href={`/clientes/${id}`} className="text-sm text-primary">← Volver al cliente</Link><h1 className="mt-5 text-3xl font-semibold">Cuenta corriente</h1><p className="mt-3 text-neutral-500">{account.customer.name} · ARS</p>
    {!!query.guardado && <p role="status" className="mt-5 rounded border border-emerald-200 bg-emerald-50 p-4">Apertura registrada.</p>}
    {!!query.aplicado && <p role="status" className="mt-5 rounded border border-emerald-200 bg-emerald-50 p-4">Crédito aplicado sin registrar otro cobro.</p>}
    <dl className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Deuda pendiente", account.pending], ["Crédito disponible", account.available], ["Saldo neto", account.net], ["Cheques pendientes de cobro", account.portfolio]].map(([label, amount]) => <div key={label} className="rounded-xl border border-input bg-white p-5"><dt className="text-sm text-neutral-500">{label}</dt><dd className="mt-2 text-2xl font-semibold">ARS {amount}</dd></div>)}</dl><p className="mt-4 text-sm text-neutral-500">Saldo positivo: deuda neta. Saldo negativo: crédito neto a favor. Las aplicaciones se eligen explícitamente. No hay compensación automática.</p>
    {!account.total && <p className="mt-7 rounded-xl border border-input bg-white p-5">Esta cuenta todavía no tiene aperturas conciliadas. Los trabajos y documentos de la copia anterior no se sumaron como deuda.</p>}
    <section className="mt-7 rounded-xl border border-input bg-white p-6"><h2 className="text-xl font-semibold">Movimientos</h2><ol className="mt-5 divide-y divide-input">{account.entries.map(entry => <li key={entry.id} className="py-4"><div className="flex flex-wrap justify-between gap-3"><strong>{entry.kind === "opening_debt" ? "Apertura de deuda" : entry.kind === "opening_credit" ? "Apertura de crédito" : entry.kind === "credit_reversal" ? "Reversión de cheque" : "Cobro"} · {entry.reference}</strong><span>ARS {entry.amount}</span></div><p className="mt-2 text-xs text-neutral-500">Fecha comercial: {entry.businessDate}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{entry.evidence}</p></li>)}</ol>{(page > 1 || account.total > 25) && <nav className="mt-5 flex justify-between" aria-label="Movimientos de cuenta">{page > 1 ? <Link href={`?pagina=${page - 1}`}>Anterior</Link> : <span />}<span>Página {page}</span>{page * 25 < account.total ? <Link href={`?pagina=${page + 1}`}>Siguiente</Link> : <span />}</nav>}</section>
    {can(user.role, "finance:write") && <section className="mt-7 rounded-xl border border-input bg-white p-6"><h2 className="text-xl font-semibold">Registrar cobro o anticipo</h2><ReceiptForm key={commandCycle} id={randomUUID()} componentId={randomUUID()} customerId={id} today={today} debts={account.debts} /></section>}
    {can(user.role, "finance:write") && account.credits.length > 0 && account.debts.length > 0 && <section className="mt-7 rounded-xl border border-input bg-white p-6"><h2 className="text-xl font-semibold">Aplicar crédito disponible</h2><ApplyCreditForm key={commandCycle} id={randomUUID()} customerId={id} debts={account.debts} credits={account.credits} /></section>}
    {user.role === "admin" && <section className="mt-7 rounded-xl border border-input bg-white p-6"><h2 className="text-xl font-semibold">Registrar apertura conciliada</h2><p className="mt-3 text-sm text-neutral-500">Una obligación o crédito por referencia revisada. El histórico importado conserva sus datos; no registra este movimiento por sí mismo.</p><OpeningForm key={commandCycle} customerId={id} id={randomUUID()} today={today} /></section>}</>;
}
