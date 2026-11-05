import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, AccessError } from "@/server/auth/access";
import { getDb } from "@/server/db";
import { listCheques } from "@/server/cheques/service";
import { chequeLabels, chequeStates } from "@/shared/contracts/cheques";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function ChequesPage({ searchParams }: { searchParams: Promise<{ estado?: string; banco?: string; pagina?: string }> }) {
  let user;
  try { user = await requireUser("finance:read"); }
  catch (error) { if (error instanceof AccessError) redirect("/ingresar"); throw error; }
  const query = await searchParams;
  const status = z.enum(chequeStates).safeParse(query.estado);
  const bank = typeof query.banco === "string" ? query.banco.trim().slice(0, 100) : "";
  const page = Math.min(100000, Math.max(1, Number.parseInt(query.pagina ?? "1", 10) || 1));
  const { rows, total } = await listCheques(getDb(), user, { status: status.success ? status.data : undefined, bank, page });
  const url = (value: number) => `/cheques?${new URLSearchParams({ estado: status.success ? status.data : "", banco: bank, pagina: String(value) })}`;
  return <main className="mx-auto max-w-6xl px-6 py-10"><Link href="/" className="text-primary">← Inicio</Link><h1 className="mt-7 text-4xl font-semibold">Cheques de terceros</h1><p className="mt-3 text-neutral-500">Se reciben como medio de pago desde la cuenta del cliente. Depósito y acreditación no vuelven a acreditar la cuenta.</p>
    <form className="my-7 flex flex-wrap gap-3"><div><label htmlFor="cheque-status" className="mb-2 block text-sm">Estado</label><select id="cheque-status" name="estado" defaultValue={status.success ? status.data : ""} className="rounded border border-input p-3"><option value="">Todos</option>{chequeStates.map(value => <option key={value} value={value}>{chequeLabels[value]}</option>)}</select></div><div><label htmlFor="cheque-bank" className="mb-2 block text-sm">Banco</label><Input id="cheque-bank" name="banco" defaultValue={bank} /></div><Button className="self-end">Buscar</Button></form>
    <p className="mb-4 text-sm">{total} cheques</p><ul className="divide-y divide-input rounded-xl border border-input bg-white">{rows.map(row => <li key={row.cheque.id} className="p-5"><div className="flex flex-wrap justify-between gap-3"><Link href={`/cheques/${row.cheque.id}`} className="font-semibold text-primary">{row.cheque.bank} · Cheque {row.cheque.number}</Link><span>ARS {row.amount} · {chequeLabels[row.cheque.status]}</span></div><p className="mt-2 text-sm">{row.customerName} · Fecha de pago {row.cheque.payableOn}</p></li>)}</ul>{!rows.length && <p className="mt-5">No hay cheques para estos filtros.</p>}<nav aria-label="Páginas de cheques" className="mt-6 flex justify-between">{page > 1 ? <Link href={url(page - 1)}>Anterior</Link> : <span />}<span>Página {page}</span>{page * 25 < total ? <Link href={url(page + 1)}>Siguiente</Link> : <span />}</nav></main>;
}
