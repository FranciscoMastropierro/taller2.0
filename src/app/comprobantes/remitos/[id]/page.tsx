import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser, AccessError } from "@/server/auth/access";
import { getDb } from "@/server/db";
import { readDeliveryNote } from "@/server/documents/service";
import { PrintButton } from "@/app/fichas/[id]/print-button";
import styles from "@/components/internal-document.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function DeliveryNotePage({ params }: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await requireUser("work:read"); }
  catch (error) { if (error instanceof AccessError) redirect("/ingresar"); throw error; }
  const document = await readDeliveryNote(getDb(), user, (await params).id);
  if (!document) notFound();
  const data = document.snapshot;
  return <><div className={styles.toolbar}><div className="flex flex-wrap justify-between gap-4"><Link href={`/ordenes/${document.orderId}`} className="text-primary">← Orden de trabajo</Link><Link href="/comprobantes" className="text-primary">Comprobantes</Link><PrintButton label="Imprimir constancia" /></div></div>
    <article className={styles.paper} aria-label="Constancia imprimible"><header className={styles.header}><div><p>GALANTE</p><h1 className="mt-2 text-2xl font-semibold">CONSTANCIA INTERNA DE ENTREGA</h1><p className="mt-2">RI-{String(document.number).padStart(6, "0")}</p></div><p>Fecha: {data.date}</p></header><section className="mt-6 space-y-3"><p><strong>Cliente:</strong> {data.customer.name}</p><p>Documento: {data.customer.document || "Sin registrar"}</p><p>Dirección: {data.customer.address || "Sin registrar"}</p><p>Orden interna #{data.orderNumber}{data.legacyNumber !== null && ` · Ficha anterior #${data.legacyNumber}`} · Revisión {data.orderVersion}</p><p><strong>Equipo:</strong> {data.equipment}</p><p>Marca: {data.brand || "—"} · Modelo: {data.model || "—"} · Serie: {data.serialNumber || "—"}</p><h2 className="pt-4 font-semibold">Trabajo realizado registrado</h2><p className="whitespace-pre-wrap">{data.workDone || "Sin descripción registrada"}</p><p className="pt-5"><strong>Retiró:</strong> {data.receiver}</p>{data.note && <p className={styles.note}>{data.note}</p>}</section><p className="mt-8 border-t border-input pt-4 text-xs">Remito interno / constancia del retiro registrado. No es factura. Reimprimir no registra otra entrega ni cobro. Validación de remito definitivo pendiente.</p></article></>;
}
