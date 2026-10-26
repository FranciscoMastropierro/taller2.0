import type { Role } from "../../shared/contracts/auth";
export type Permission = "work:read" | "work:write" | "work:correct" | "work:technical" | "customers:write" | "finance:read" | "users:manage";
const permissions: Record<Role, readonly Permission[]> = {
  admin: ["work:read", "work:write", "work:correct", "work:technical", "customers:write", "finance:read", "users:manage"],
  reception: ["work:read", "work:write", "customers:write", "finance:read"],
  technician: ["work:read", "work:technical"],
  readonly: ["work:read"],
};
export function can(role: Role, permission: Permission) { return permissions[role]?.includes(permission) ?? false; }
export class AccessError extends Error {
  constructor(public status: 401 | 403) { super(status === 401 ? "UNAUTHORIZED" : "FORBIDDEN"); }
}
