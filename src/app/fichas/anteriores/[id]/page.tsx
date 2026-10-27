import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireUser, AccessError } from "@/server/auth/access";
import { getDb } from "@/server/db";
import { customers } from "@/server/db/schema";
import { readHistoricalOrder } from "@/server/legacy/service";
import { OrderSheet } from "@/components/order-sheet";
import styles from "@/components/order-sheet.module.css";
import { PrintButton } from "../../[id]/print-button";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function HistoricalSheetPage({ params }: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await requireUser(); }
  catch (error) { if (error instanceof AccessError) redirect("/ingresar"); throw error; }
  const db = getDb();
  const result = await readHistoricalOrder(db, user, (await params).id);
  if (!result) notFound();
  const { history } = result;
  const [customer] = history.customerId ? await db.select({ original: customers.legacyOriginal }).from(customers).where(eq(customers.id, history.customerId)) : [];
  const raw = history.original;
  const client = customer?.original ?? {};
  const text = (value: unknown) => value === null || value === undefined ? "" : String(value);
  return <><div className={styles.toolbar}><div className="flex items-center justify-between gap-4"><Link href={`/ordenes/historico/${history.id}?original=1`} className="text-primary">← Volver a la orden anterior</Link><PrintButton /></div><p className="mt-4 text-sm text-neutral-500">Papel 15 × 20 cm · escala 100 % · sin encabezados/pies del navegador. Copia de los datos originales: presupuesto y tiempo se muestran tal como fueron recuperados, sin interpretar importes ni unidades. Imprimir no continúa ni modifica la reparación.</p></div>
    <OrderSheet kind="work" original={{ time: text(raw.tiempo_original), budget: text(raw.presupuesto_original) }} data={{
      layoutVersion: 1, number: 0, legacyNumber: history.legacyNumber, orderVersion: 0,
      date: text(raw.fecha_ingreso), customer: { name: text(client.cliente) || text(client.nombre) || "Cliente no identificado en la copia", address: text(client.direccion), phone: text(client.telefono), locality: text(client.localidad) },
      equipment: [text(raw.marca), text(raw.modelo)].filter(Boolean).join(" · ") || "Equipo anterior", brand: text(raw.marca), model: text(raw.modelo), serialNumber: "",
      intake: text(raw.descripcion_ingreso), notes: text(raw.observaciones), budget: null,
      technician: text(raw.personal_original), workedMinutes: 0, diagnosis: "", workDone: text(raw.descripcion_terminacion),
    }} /></>;
}
