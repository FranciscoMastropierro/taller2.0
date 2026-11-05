import { z } from "zod";
import { businessDateSchema } from "./money";
export const deliveryNoteSchema = z.object({ id: z.uuid(), orderId: z.uuid(), version: z.coerce.number().int().positive(), receiver: z.string().trim().min(2).max(160), date: businessDateSchema, note: z.string().trim().max(1000) });
export type DeliverySnapshot = {
  orderNumber: number; legacyNumber: number | null; orderVersion: number;
  customer: { name: string; document: string; address: string };
  equipment: string; brand: string; model: string; serialNumber: string; workDone: string;
  receiver: string; date: string; note: string;
};
export const reportSchema = z.object({ type: z.enum(["pending", "debtors", "collections"]).default("pending"), customer: z.string().trim().max(160).default(""), from: z.union([businessDateSchema, z.literal("")]).default(""), to: z.union([businessDateSchema, z.literal("")]).default("") }).refine(row => !row.from || !row.to || row.from <= row.to, "La fecha inicial no puede ser posterior a la final.");
