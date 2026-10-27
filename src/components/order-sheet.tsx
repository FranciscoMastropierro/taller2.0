import type { SheetSnapshot } from "@/shared/contracts/sheets";
import styles from "./order-sheet.module.css";

export function OrderSheet({ data, kind, original }: { data: SheetSnapshot; kind: "intake" | "work"; original?: { time: string; budget: string } }) {
  const number = data.legacyNumber ?? data.number;
  const date = data.legacyNumber !== null ? data.date.slice(0, 10).split("-").reverse().join("/") : new Date(data.date).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
  return <article className={styles.paper} aria-label="Ficha imprimible">
      <div className={styles.heading}><div>FICHA N°: <strong className={styles.number} data-testid="sheet-number">{number}</strong></div><div className={styles.right}>FECHA: <strong>{date}</strong><p className={styles.line}>PRESUPUESTO: {original ? original.budget || "Sin registrar" : data.budget === null ? "Sin registrar" : `ARS ${data.budget}`}</p></div></div>
      <p className={styles.line}>SEÑOR: <strong>{data.customer.name}</strong></p><p className={styles.line}>DIRECCIÓN: {data.customer.address || "—"}</p><div className={styles.row}><p className={styles.line}>TELÉFONO: {data.customer.phone || "—"}</p><p className={styles.line}>LOCALIDAD: {data.customer.locality || "—"}</p></div>
      <div className={styles.section}><div className={styles.row}><p>MARCA: <strong>{data.brand || data.equipment}</strong></p><p>MODELO: <strong>{data.model || "—"}</strong></p></div>{data.serialNumber && <p className={styles.line}>SERIE: {data.serialNumber}</p>}<h1 className={styles.title}>TRABAJOS A REALIZAR</h1><p className={styles.line}><strong>{data.intake}</strong></p>{data.notes && <p className={styles.line}>OBSERVACIONES: {data.notes}</p>}</div>
      <div className={styles.section}><div className={styles.row}><p>PERSONAL: {data.technician || "________________"}</p><p>TIEMPO: {original ? original.time || "Sin registrar" : kind === "work" ? `${data.workedMinutes} min` : "____________"}</p></div><h2 className={styles.title}>TRABAJOS REALIZADOS</h2><div className={styles.work}>{kind === "work" && <>{data.diagnosis && <p>Diagnóstico: {data.diagnosis}</p>}<p>{data.workDone}</p></>}</div></div>
      <div className={styles.space} /><p className={styles.metadata}>{original ? `Registro histórico original · Ficha anterior ${data.legacyNumber}` : `${kind === "intake" ? "Ficha de ingreso" : "Ficha de trabajo"} · ${data.legacyNumber !== null ? `Número anterior ${data.legacyNumber} · ` : ""}Orden interna ${data.number} · Revisión ${data.orderVersion}`} · No es factura ni recibo.</p>
      <footer className={styles.stub}><strong className={styles.number} data-testid="sheet-number">{number}</strong><div><small>CORTAR Y COLOCAR EN EL EQUIPO · {data.legacyNumber !== null ? "FICHA ANTERIOR" : "FICHA INTERNA"}</small><p>{data.equipment}</p></div></footer>
    </article>;
}
