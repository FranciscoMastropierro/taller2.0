import Link from "next/link";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireUser, AccessError } from "@/server/auth/access";
import { getDb } from "@/server/db";
import { generateReport, ReportLimitError, type ReportResult } from "@/server/documents/reports";
import { PrintButton } from "@/app/fichas/[id]/print-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import styles from "@/components/internal-document.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  let user;
  try { user = await requireUser("finance:read"); }
  catch (error) { if (error instanceof AccessError) redirect("/ingresar"); throw error; }
  const query = await searchParams;
  const value = (key: string) => typeof query[key] === "string" ? query[key] as string : "";
  const type = value("type") || "pending";
  const input = { type, customer: value("customer"), from: type === "debtors" ? "" : value("from"), to: type === "debtors" ? "" : value("to") };
  let report: ReportResult | undefined;
  let error = "";
  try { report = await generateReport(getDb(), user, input); }
  catch (e) {
    if (e instanceof ReportLimitError) error = e.message;
    else if (e instanceof ZodError) error = e.issues[0]?.message ?? "Revisá los filtros.";
    else throw e;
  }
  const filters = report?.filters ?? input;
  const generated = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" });
  return <><div className={styles.toolbar}><Link href="/comprobantes" className="text-primary">← Comprobantes</Link><h1 className="mt-6 text-3xl font-semibold">Reportes del taller</h1><form className="mt-6 grid gap-4 sm:grid-cols-2"><div><label htmlFor="report-type" className="mb-2 block text-sm font-semibold">Reporte</label><select id="report-type" name="type" defaultValue={filters.type} className="w-full rounded border border-input p-3"><option value="pending">Órdenes pendientes</option><option value="debtors">Deudores actuales</option><option value="collections">Cobros comerciales</option><option disabled>Ventas fiscales — pendiente ARCA</option></select></div><div><label htmlFor="report-customer" className="mb-2 block text-sm font-semibold">Cliente (nombre o código interno)</label><Input id="report-customer" name="customer" defaultValue={filters.customer} maxLength={160} /></div><div><label htmlFor="report-from" className="mb-2 block text-sm font-semibold">Desde</label><Input id="report-from" name="from" type="date" defaultValue={filters.from} /></div><div><label htmlFor="report-to" className="mb-2 block text-sm font-semibold">Hasta</label><Input id="report-to" name="to" type="date" defaultValue={filters.to} /></div><p className="text-xs text-neutral-500 sm:col-span-2">Fechas de incorporación para pendientes y comerciales para cobros. Deudores muestra posición actual y no usa estas fechas. Máximo 2.000 filas por consulta.</p><Button>Consultar reporte</Button></form>{report && <div className="mt-5"><PrintButton label="Imprimir este reporte" /></div>}{error && <p role="alert" className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}</div>
    {report && <article className={styles.paper} aria-label="Reporte imprimible"><h2 className="text-2xl font-semibold">{report.title}</h2><p className="mt-3 text-sm">{report.description}</p><p className="mt-3 text-xs">Cliente: {report.filters.customer || "Todos"} · {report.filters.type === "debtors" ? "Posición actual" : `Desde ${report.filters.from || "inicio"} hasta ${report.filters.to || "sin límite"}`} · Consultado {generated}</p><p className="mt-3 text-sm font-semibold">{report.rows.length} {report.rows.length === 1 ? "registro" : "registros"}</p><div className="overflow-x-auto"><table className={styles.table}><thead><tr>{report.columns.map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{report.rows.map(row => <tr key={row.id}>{row.values.map((field, index) => <td key={index}>{field}</td>)}</tr>)}</tbody></table></div>{!report.rows.length && <p className="mt-5">No hay registros que coincidan con estos filtros.</p>}<dl className="mt-7 grid gap-4 sm:grid-cols-3">{report.totals.map(total => <div key={total.label}><dt className="text-sm">{total.label}</dt><dd className="mt-2 text-lg font-semibold">ARS {total.amount}</dd></div>)}</dl><p className="mt-7 border-t border-input pt-4 text-xs">La impresión usa estos mismos resultados y filtros. Ventas fiscales requiere facturas autorizadas; no se calcula sumando cobros, aperturas o presupuestos.</p></article>}</>;
}
