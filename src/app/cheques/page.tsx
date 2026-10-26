import { PendingModule } from "@/components/pending-module";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default function ChequesPage() {
  return <PendingModule title="Cheques" description="Gestión de cheques de terceros y seguimiento de su situación, desde la recepción hasta la acreditación o el rechazo." sections={[
    { title: "Cartera de terceros", description: "Consulta de instrumentos recibidos, clientes, importes y vencimientos." },
    { title: "Movimientos", description: "Registro de depósitos, acreditaciones y rechazos con su historial." },
    { title: "Relación con cobros", description: "Vinculación con cobros y cuenta corriente sin duplicar movimientos." },
  ]} />;
}
