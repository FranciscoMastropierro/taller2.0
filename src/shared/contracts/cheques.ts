import { z } from "zod";
import { businessDateSchema } from "./money";
export const chequeStates = ["received", "deposited", "credited", "rejected"] as const;
export type ChequeState = typeof chequeStates[number];
export const chequeLabels: Record<ChequeState, string> = { received: "En cartera", deposited: "Depositado", credited: "Acreditado", rejected: "Rechazado" };
export const chequeDetailsSchema = z.object({
  bank: z.string().trim().min(2).max(100), account: z.string().trim().min(3).max(80), number: z.string().trim().min(1).max(60),
  deliveredBy: z.string().trim().min(2).max(160), issuedOn: businessDateSchema, payableOn: businessDateSchema,
}).refine(row => row.payableOn >= row.issuedOn, "La fecha de pago no puede ser anterior a la emisión.");
export type ChequeDetails = z.infer<typeof chequeDetailsSchema>;
export const chequeMovementSchema = z.object({ id: z.uuid(), chequeId: z.uuid(), version: z.coerce.number().int().positive(), action: z.enum(["deposit", "credit", "reject"]), date: businessDateSchema, reason: z.string().trim().min(3).max(1000) });
