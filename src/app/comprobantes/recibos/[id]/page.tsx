import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser, AccessError } from "@/server/auth/access";
import { getDb } from "@/server/db";
import { readReceipt } from "@/server/payments/service";
import { PrintButton } from "@/app/fichas/[id]/print-button";
import styles from "@/components/internal-document.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await requireUser("finance:read"); }
  catch (error) { if (error instanceof AccessError) redirect("/ingresar"); throw error; }
  const receipt = await readReceipt(getDb(), user, (await params).id);
  if (!receipt) notFound();
  const data = receipt.snapshot;
  return <><div className={styles.toolbar}><div className="flex flex-wrap justify-between gap-4"><Link href={`/clientes/${receipt.customerId}/cuenta?recibo=${receipt.id}`} className="text-primary">← Cuenta del cliente</Link><Link href="/comprobantes" className="text-primary">Comprobantes</Link><PrintButton label="Imprimir recibo" /></div><p className="mt-3 text-sm text-neutral-500">Recibo interno guardado. Reimprimir conserva el contenido y no registra otro cobro.</p></div>
    <article className={styles.paper} aria-label="Recibo imprimible"><header className={styles.header}><div><p>GALANTE</p><h1 className="mt-2 text-2xl font-semibold">RECIBO DE COBRO</h1><p className="mt-2">R-{String(receipt.number).padStart(6, "0")}</p></div><p>Fecha: {data.date}</p></header><section className="mt-6"><p><strong>Recibimos de:</strong> {data.customer.name}</p><p className="mt-2">Documento: {data.customer.document || "Sin registrar"}</p><p className="mt-2">Dirección: {data.customer.address || "Sin registrar"}</p><p className="mt-5 text-2xl font-semibold">Total recibido: ARS {data.total}</p></section>
      <table className={styles.table}><thead><tr><th>Medio de pago</th><th>Importe ARS</th></tr></thead><tbody>{data.components.map(component => <tr key={component.id}><td>{component.method === "cash" ? "Efectivo" : component.method === "transfer" ? "Transferencia" : "Cheque de terceros"}{component.cheque && <><p className="mt-2 text-xs">{component.cheque.bank} · N° {component.cheque.number} · Pago {component.cheque.payableOn}</p><Link href={`/cheques/${component.id}`} className="text-xs text-primary underline">Consultar estado vigente</Link></>}</td><td>{component.amount}</td></tr>)}</tbody></table>
      <h2 className="mt-7 font-semibold">Aplicaciones al registrar el cobro</h2>{data.allocations.length ? <table className={styles.table}><thead><tr><th>Obligación</th><th>Aplicado ARS</th></tr></thead><tbody>{data.allocations.map((allocation, index) => <tr key={index}><td>{allocation.reference}</td><td>{allocation.amount}</td></tr>)}</tbody></table> : <p className="mt-3">Anticipo sin aplicaciones.</p>}
      <p className="mt-5 font-semibold">Crédito sin aplicar al emitir: ARS {data.unapplied}</p>{data.note && <p className={styles.note}>{data.note}</p>}<p className="mt-8 border-t border-input pt-4 text-xs">Recibo de cobro. No es factura ni autorización fiscal. Aplicaciones y saldo posteriores se consultan en cuenta corriente.</p></article></>;
}
