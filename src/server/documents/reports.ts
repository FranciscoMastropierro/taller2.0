import { sql } from "drizzle-orm";
import type { Database } from "../db";
import { authorizeIdentity } from "../auth/service";
import { reportSchema } from "../../shared/contracts/documents";
import { cents, decimal } from "../../shared/contracts/money";

export class ReportLimitError extends Error {}
const limit = 2000;
type PendingRow = { id: string; number: number; legacy_number: string; equipment: string; customer: string; status: string; location: string; date: string };
type DebtorRow = { id: string; customer: string; pending: string; available: string; net: string };
type CollectionRow = { id: string; reference: string; customer: string; date: string; amount: string; kind: string };
export type ReportResult = { title: string; description: string; columns: string[]; rows: { id: string; values: string[] }[]; totals: { label: string; amount: string }[]; filters: ReturnType<typeof reportSchema.parse> };
function bounded(rows: unknown[]) { if (rows.length > limit) throw new ReportLimitError("El reporte supera 2.000 filas. Acotá cliente o fechas antes de imprimir."); }

export async function generateReport(db: Database, identity: unknown, input: unknown): Promise<ReportResult> {
  await authorizeIdentity(db, identity, "finance:read");
  const parsed = reportSchema.parse(input);
  const filters = parsed.type === "debtors" ? { ...parsed, from: "", to: "" } : parsed;
  const pattern = `%${filters.customer.replace(/[\\%_]/g, "\\$&")}%`;
  const clientFilter = filters.customer ? sql`and (c.name ilike ${pattern} or c.code::text ilike ${pattern})` : sql``;
  if (filters.type === "pending") {
    const from = filters.from ? sql`and w.created_at >= (${filters.from}::date::timestamp at time zone 'America/Argentina/Buenos_Aires')` : sql``;
    const to = filters.to ? sql`and w.created_at < ((${filters.to}::date + interval '1 day') at time zone 'America/Argentina/Buenos_Aires')` : sql``;
    const result = await db.execute(sql`select w.id,w.number,coalesce(h.legacy_number::text,'') as legacy_number,w.equipment,c.name as customer,w.status,w.location,to_char(w.created_at at time zone 'America/Argentina/Buenos_Aires','YYYY-MM-DD') as date
      from work_orders w join customers c on c.id=w.customer_id left join historical_orders h on h.continued_order_id=w.id
      where w.status <> 'delivered' ${clientFilter} ${from} ${to} order by w.number desc limit ${limit + 1}`);
    const rows = result.rows as PendingRow[];
    bounded(rows);
    return { filters, title: "Órdenes pendientes", description: "Órdenes actuales aún no entregadas. La fecha corresponde a incorporación en el sistema nuevo; el histórico sin continuar no se incluye.", columns: ["Orden / anterior", "Cliente", "Equipo", "Estado", "Ubicación", "Incorporación"], rows: rows.map(row => ({ id: row.id, values: [`${row.number}${row.legacy_number ? ` / ${row.legacy_number}` : ""}`, row.customer, row.equipment, row.status === "queued" ? "TURNO" : "TERMINADO", row.location || "—", row.date] })), totals: [] };
  }
  if (filters.type === "debtors") {
    const result = await db.execute(sql`with positions as (
      select e.customer_id,
        sum(case when e.kind='opening_debt' then e.amount else 0 end) as debt,
        sum(case when e.kind in ('opening_credit','payment_credit') and not exists(select 1 from credit_reversals r where r.credit_id=e.id) then e.amount else 0 end) as credit,
        sum(case when e.kind='opening_debt' then e.amount-coalesce((select sum(a.amount) from credit_applications a where a.debt_id=e.id and not exists(select 1 from credit_reversals r where r.credit_id=a.credit_id)),0) else 0 end) as pending,
        sum(case when e.kind in ('opening_credit','payment_credit') and not exists(select 1 from credit_reversals r where r.credit_id=e.id) then e.amount-coalesce((select sum(a.amount) from credit_applications a where a.credit_id=e.id),0) else 0 end) as available
      from account_entries e group by e.customer_id
    ) select c.id,c.name as customer,p.pending::text,p.available::text,(p.debt-p.credit)::text as net from positions p join customers c on c.id=p.customer_id where p.debt-p.credit > 0 ${clientFilter} order by p.debt-p.credit desc,c.id limit ${limit + 1}`);
    const rows = result.rows as DebtorRow[];
    bounded(rows);
    const total = (key: "pending" | "available" | "net") => decimal(rows.reduce((sum, row) => sum + cents(row[key]), 0n));
    return { filters, title: "Deudores", description: "Posición actual con deuda neta positiva. Pendiente y crédito se muestran separados. Sin reconstrucción histórica por fecha; no incluye saldos anteriores aún sin conciliar.", columns: ["Cliente", "Pendiente ARS", "Crédito disponible ARS", "Saldo neto ARS"], rows: rows.map(row => ({ id: row.id, values: [row.customer, decimal(cents(row.pending)), decimal(cents(row.available)), decimal(cents(row.net))] })), totals: [{ label: "Deuda pendiente", amount: total("pending") }, { label: "Crédito disponible", amount: total("available") }, { label: "Deuda neta", amount: total("net") }] };
  }
  const fromReceipt = filters.from ? sql`and p.business_date >= ${filters.from}` : sql``;
  const toReceipt = filters.to ? sql`and p.business_date <= ${filters.to}` : sql``;
  const fromReversal = filters.from ? sql`and e.business_date >= ${filters.from}` : sql``;
  const toReversal = filters.to ? sql`and e.business_date <= ${filters.to}` : sql``;
  const result = await db.execute(sql`select * from (
    select p.id,'R-'||lpad(p.number::text,greatest(6,length(p.number::text)),'0') as reference,c.name as customer,p.business_date as date,p.total as amount,'Cobro' as kind from payment_receipts p join customers c on c.id=p.customer_id where true ${clientFilter} ${fromReceipt} ${toReceipt}
    union all
    select e.id,e.reference,c.name as customer,e.business_date as date,-e.amount as amount,'Rechazo de cheque' as kind from account_entries e join customers c on c.id=e.customer_id where e.kind='credit_reversal' ${clientFilter} ${fromReversal} ${toReversal}
    ) movements order by date desc,id limit ${limit + 1}`);
  const rows = result.rows as CollectionRow[];
  bounded(rows);
  const signedCents = (amount: string) => amount.startsWith("-") ? -cents(amount.slice(1)) : cents(amount);
  const gross = rows.filter(row => row.kind === "Cobro").reduce((sum, row) => sum + cents(row.amount), 0n);
  const net = rows.reduce((sum, row) => sum + signedCents(row.amount), 0n);
  return { filters, title: "Cobros comerciales registrados", description: "Recibos menos reversiones por fecha comercial. Incluye cheques al recibirlos; no equivale a fondos acreditados ni a ventas fiscales.", columns: ["Referencia", "Cliente", "Fecha", "Movimiento", "Importe ARS"], rows: rows.map(row => ({ id: row.id, values: [row.reference, row.customer, row.date, row.kind, decimal(signedCents(row.amount))] })), totals: [{ label: "Cobros brutos", amount: decimal(gross) }, { label: "Reversiones", amount: decimal(gross - net) }, { label: "Neto comercial", amount: decimal(net) }] };
}
