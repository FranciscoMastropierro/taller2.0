import { z } from "zod";
export const roles = ["admin", "reception", "technician", "readonly"] as const;
export type Role = typeof roles[number];
// Los demás roles se conservan exclusivamente como datos históricos.
export const appRoles = ["admin", "reception"] as const;
export function isAppRole(role: Role): boolean {
  return appRoles.some(enabled => enabled === role);
}
export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(3).max(80).regex(/^[a-z0-9._@-]+$/),
  password: z.string().min(1).max(128),
});
export const newPasswordSchema = z.string().min(12).max(128);
export const roleLabels: Record<Role, string> = { admin: "Administración", reception: "Recepción", technician: "Técnico", readonly: "Consulta" };
