import { statusLabels, type OrderStatus } from "@/shared/contracts/orders";
const colors = { queued: "bg-amber-50 text-amber-800 border-amber-200", completed: "bg-emerald-50 text-emerald-800 border-emerald-200", delivered: "bg-slate-100 text-slate-600 border-slate-200" };
export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${colors[status]}`}>{statusLabels[status]}</span>;
}
