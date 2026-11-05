import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser, AccessError } from "@/server/auth/access";
import { getDb } from "@/server/db";
import { readOrderSheet } from "@/server/orders/sheets";
import { PrintButton } from "./print-button";
import styles from "@/components/order-sheet.module.css";
import { OrderSheet } from "@/components/order-sheet";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function SheetPage({ params }: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await requireUser(); }
  catch (error) { if (error instanceof AccessError) redirect("/ingresar"); throw error; }
  const sheet = await readOrderSheet(getDb(), user, (await params).id);
  if (!sheet) notFound();
  const data = sheet.snapshot;
  return <><div className={styles.toolbar}><div className="flex items-center justify-between gap-4"><Link className="text-primary" href={`/ordenes/${sheet.orderId}`}>← Volver a la orden</Link><PrintButton /></div><p className="mt-4 text-sm text-neutral-500">Papel 15 × 20 cm · escala 100 % · desactivar encabezados y pies del navegador. El talón se corta para identificar el equipo. Reimpresión de revisión {sheet.orderVersion}; conserva el contenido guardado.</p></div>
    <OrderSheet data={data} kind={sheet.kind} /></>;
}
