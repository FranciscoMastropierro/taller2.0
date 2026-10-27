import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, AccessError } from "@/server/auth/access";
import { getDb } from "@/server/db";
import { listDeliveryNotes } from "@/server/documents/service";
import { listReceipts } from "@/server/payments/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ pagina?: string; remitosPagina?: string }> }) {
  let user;
  try { user = await requireUser("finance:read"); }
  catch (error) { if (error instanceof AccessError) redirect("/ingresar"); throw error; }
  const query = await searchParams;
  const page = Math.min(100000, Math.max(1, Number.parseInt(query.pagina ?? "1", 10) || 1));
  const { rows, total } = await listReceipts(getDb(), user, page);
  const notePage = Math.min(100000, Math.max(1, Number.parseInt(query.remitosPagina ?? "1", 10) || 1));
  const notes = await listDeliveryNotes(getDb(), user, notePage);
  return <main className="mx-auto max-w-6xl px-6 py-10"><Link href="/" className="text-sm text-primary">← Inicio</Link><h1 className="mt-7 text-4xl font-semibold">Comprobantes</h1><p className="mt-3 text-neutral-500">Recibos, constancias internas de entrega y reportes disponibles. Facturación ARCA pendiente.</p>
    <section className="mt-8 rounded-xl border border-input bg-white p-6"><h2 className="text-xl font-semibold">Recibos de cobro</h2><p className="mt-3 text-sm text-neutral-500">Se registran desde la cuenta del cliente. Son independientes de las facturas.</p><ul className="mt-5 divide-y divide-input">{rows.map(row => <li key={row.id} className="flex flex-wrap justify-between gap-3 py-4"><Link className="font-semibold text-primary" href={`/comprobantes/recibos/${row.id}`}>R-{String(row.number).padStart(6, "0")} · {row.customerName}</Link><span className="text-sm">{row.date} · ARS {row.total}</span></li>)}</ul>{!rows.length && <p className="mt-5 text-sm">Todavía no hay recibos registrados.</p>}{(page > 1 || total > 25) && <nav aria-label="Páginas de recibos" className="mt-5 flex justify-between">{page > 1 ? <Link href={`?pagina=${page - 1}`}>Anterior</Link> : <span />}<span>Página {page}</span>{page * 25 < total ? <Link href={`?pagina=${page + 1}`}>Siguiente</Link> : <span />}</nav>}</section>
    <section className="mt-7 rounded-xl border border-input bg-white p-6"><h2 className="text-xl font-semibold">Constancias internas de entrega</h2><p className="mt-3 text-sm text-neutral-500">Se preparan desde una orden ya entregada. Validación del remito definitivo pendiente.</p><ul className="mt-5 divide-y divide-input">{notes.rows.map(document => <li key={document.id} className="py-4"><Link className="font-semibold text-primary" href={`/comprobantes/remitos/${document.id}`}>RI-{String(document.number).padStart(6, "0")} · {document.snapshot.customer.name} · Orden #{document.snapshot.orderNumber}</Link></li>)}</ul>{!notes.rows.length && <p className="mt-5 text-sm">Todavía no hay constancias de entrega.</p>}{(notePage > 1 || notes.total > 25) && <nav aria-label="Páginas de constancias" className="mt-5 flex justify-between">{notePage > 1 ? <Link href={`?remitosPagina=${notePage - 1}`}>Anterior</Link> : <span />}<span>Página {notePage}</span>{notePage * 25 < notes.total ? <Link href={`?remitosPagina=${notePage + 1}`}>Siguiente</Link> : <span />}</nav>}</section>
    <section className="mt-7 rounded-xl border border-input bg-white p-6"><h2 className="text-xl font-semibold">Consultas y reportes</h2><p className="mt-3 text-sm text-neutral-500">Pendientes, deudores y cobros con los mismos filtros al imprimir. Ventas fiscales pendiente de facturación.</p><Link href="/comprobantes/reportes" className="mt-4 inline-block font-semibold text-primary underline">Abrir reportes</Link></section>
    <section className="mt-7 rounded-xl border border-dashed border-input p-6"><h2 className="font-semibold">Facturación ARCA — pendiente</h2><p className="mt-3 text-sm text-neutral-500">Modalidad, tipos de comprobante y punto de venta sin confirmar. No hay emisión fiscal habilitada.</p></section></main>;
}
