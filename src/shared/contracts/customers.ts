import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Ingresá al menos dos caracteres.").max(160),
  document: z.string().trim().max(30),
  phone: z.string().trim().max(60),
  email: z.string().trim().max(160).refine(value => !value || z.email().safeParse(value).success, "Revisá el correo electrónico."),
  address: z.string().trim().max(240),
  notes: z.string().trim().max(2000),
});
export type CustomerInput = z.infer<typeof customerSchema>;
