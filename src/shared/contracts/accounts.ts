import { z } from "zod";
import { businessDateSchema, positiveMoneySchema } from "./money";

export const openingSchema = z.object({
  id: z.uuid(), customerId: z.uuid(), direction: z.enum(["debt", "credit"]),
  reference: z.string().trim().min(3).max(100), amount: positiveMoneySchema,
  date: businessDateSchema, evidence: z.string().trim().min(10, "Indicá cómo se revisó la apertura (al menos 10 caracteres).").max(1000),
  reconciled: z.literal("on", { error: "Confirmá que la apertura fue conciliada." }),
});
