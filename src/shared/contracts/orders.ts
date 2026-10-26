import { z } from "zod";

export const orderStatuses = ["queued", "completed", "delivered"] as const;
export type OrderStatus = typeof orderStatuses[number];
export const statusLabels: Record<OrderStatus, string> = { queued: "TURNO", completed: "TERMINADO", delivered: "ENTREGADO" };
export const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = { queued: "completed", completed: "delivered" };
const shortText = z.string().trim().max(160);
const longText = z.string().trim().max(4000);
export const technicalSchema = z.object({
  diagnosis: longText,
  workDone: longText,
  workedMinutes: z.coerce.number().int().min(0).max(10000000),
});
export const orderFieldsSchema = z.object({
  equipment: shortText.min(2, "Indicá el equipo (al menos dos caracteres)."),
  brand: shortText,
  model: shortText,
  serialNumber: shortText,
  intake: longText.min(3, "Describí el motivo de ingreso (al menos tres caracteres)."),
  notes: longText,
  location: shortText,
  assignedTo: z.union([z.literal(""), z.uuid()]).transform(value => value || null),
  budget: z.string().trim().transform(value => value.replace(",", ".")).refine(value => !value || /^\d{1,12}(\.\d{1,2})?$/.test(value), "Usá un presupuesto positivo, sin separador de miles y con hasta dos decimales.").transform(value => value ? `${value.split(".")[0].replace(/^0+(?=\d)/, "")}.${(value.split(".")[1] ?? "").padEnd(2, "0")}` : null),
  approval: longText,
  ...technicalSchema.shape,
});
export const newOrderSchema = orderFieldsSchema.extend({ id: z.uuid(), customerId: z.uuid() });
export const orderVersionSchema = z.object({ id: z.uuid(), version: z.coerce.number().int().positive() });
export const statusChangeSchema = orderVersionSchema.extend({ status: z.enum(orderStatuses), reason: z.string().trim().max(1000) });
export type OrderFields = z.output<typeof orderFieldsSchema>;
