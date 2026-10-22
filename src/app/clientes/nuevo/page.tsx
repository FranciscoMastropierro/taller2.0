import { requireCustomerReader } from "../access";
import { can } from "@/server/auth/permissions";
import { CustomerForm } from "../form";

export default async function NewCustomerPage() {
  const user = await requireCustomerReader();
  if (!can(user.role, "customers:write")) return <p role="alert">Tu cuenta tiene acceso de consulta. No podés crear clientes.</p>;
  return <><h1 className="text-3xl font-semibold tracking-tight">Nuevo cliente</h1><p className="mt-3 text-neutral-500">Completá sus datos de contacto. Podés ampliarlos más adelante.</p><section className="mt-8 rounded-xl border border-input bg-white p-6 sm:p-8"><CustomerForm /></section></>;
}
