import { z } from "zod";
import { businessDateSchema, positiveMoneySchema } from "./money";
import { chequeDetailsSchema, type ChequeDetails } from "./cheques";

const allocationSchema = z.object({ debtId: z.uuid(), amount: positiveMoneySchema });
const allocationsSchema = z.array(allocationSchema).max(100).refine(rows => new Set(rows.map(row => row.debtId)).size === rows.length, "No repitas una obligación.");
const componentFields = { id: z.uuid(), amount: positiveMoneySchema };
const componentSchema = z.discriminatedUnion("method", [
  z.object({ ...componentFields, method: z.literal("cash") }),
  z.object({ ...componentFields, method: z.literal("transfer") }),
  z.object({ ...componentFields, method: z.literal("cheque"), cheque: chequeDetailsSchema }),
]);
export const receiptSchema = z.object({
  id: z.uuid(), customerId: z.uuid(), date: businessDateSchema, note: z.string().trim().max(1000),
  components: z.array(componentSchema).min(1).max(20).refine(rows => new Set(rows.map(row => row.id)).size === rows.length, "Componentes repetidos."),
  allocations: allocationsSchema,
});
export const applyCreditSchema = z.object({ id: z.uuid(), customerId: z.uuid(), creditId: z.uuid(), allocations: allocationsSchema.refine(rows => rows.length > 0, "Indicá al menos una aplicación.") });
export type ReceiptSnapshot = {
  customer: { name: string; document: string; address: string };
  date: string; note: string; total: string;
  components: { id: string; method: "cash" | "transfer" | "cheque"; amount: string; cheque?: ChequeDetails }[];
  allocations: { reference: string; amount: string }[];
  unapplied: string;
};
