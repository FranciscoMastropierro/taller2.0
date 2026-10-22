import { z } from "zod";
export const roles = ["admin", "reception", "technician", "readonly"] as const;
export type Role = typeof roles[number];
export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(3).max(80).regex(/^[a-z0-9._@-]+$/),
  password: z.string().min(1).max(128),
});
export const newPasswordSchema = z.string().min(12).max(128);
export const roleLabels: Record<Role, string> = { admin: "Administración", reception: "Recepción", technician: "Técnico", readonly: "Consulta" };
