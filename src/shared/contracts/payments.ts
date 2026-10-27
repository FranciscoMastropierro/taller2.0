import { z } from "zod";
import { businessDateSchema, positiveMoneySchema } from "./money";

const allocationSchema = z.object({ debtId: z.uuid(), amount: positiveMoneySchema });
const allocationsSchema = z.array(allocationSchema).max(100).refine(rows => new Set(rows.map(row => row.debtId)).size === rows.length, "No repitas una obligación.");
export const receiptSchema = z.object({
  id: z.uuid(), customerId: z.uuid(), date: businessDateSchema, note: z.string().trim().max(1000),
  components: z.array(z.object({ id: z.uuid(), method: z.enum(["cash", "transfer"]), amount: positiveMoneySchema })).min(1).max(20).refine(rows => new Set(rows.map(row => row.id)).size === rows.length, "Componentes repetidos."),
  allocations: allocationsSchema,
});
export const applyCreditSchema = z.object({ id: z.uuid(), customerId: z.uuid(), creditId: z.uuid(), allocations: allocationsSchema.refine(rows => rows.length > 0, "Indicá al menos una aplicación.") });
export type ReceiptSnapshot = {
  customer: { name: string; document: string; address: string };
  date: string; note: string; total: string;
  components: { id: string; method: "cash" | "transfer"; amount: string }[];
  allocations: { reference: string; amount: string }[];
  unapplied: string;
};
