import { PendingModule } from "@/components/pending-module";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default function ComprobantesPage() {
  return <PendingModule title="Comprobantes" description="Documentos del taller, consultas y facturación: un lugar para preparar, encontrar e imprimir cada comprobante." sections={[
    { title: "Remitos", description: "Documentos vinculados a órdenes y entregas, con contenido conservado para su reimpresión." },
    { title: "Consultas y listados", description: "Búsqueda por cliente y documento, pendientes y reportes del taller." },
    { title: "Facturación ARCA", description: "Emisión, autorización, consulta y representación imprimible de comprobantes fiscales." },
  ]} />;
}
