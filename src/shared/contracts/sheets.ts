import { z } from "zod";

export const sheetRequestSchema = z.object({ orderId: z.uuid(), version: z.coerce.number().int().positive(), kind: z.enum(["intake", "work"]) });
export type SheetSnapshot = {
  layoutVersion: 1;
  number: number;
  legacyNumber: number | null;
  orderVersion: number;
  date: string;
  customer: { name: string; address: string; phone: string; locality: string };
  equipment: string; brand: string; model: string; serialNumber: string;
  intake: string; notes: string; budget: string | null;
  technician: string; workedMinutes: number; diagnosis: string; workDone: string;
};
