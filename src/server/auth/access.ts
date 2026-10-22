import "server-only";
import { auth } from "@/auth";
import { getDb } from "../db";
import { authorizeIdentity } from "./service";
import { AccessError, type Permission } from "./permissions";
export { AccessError };
export async function requireUser(permission: Permission = "work:read") {
  const session = await auth();
  if (!session?.user) throw new AccessError(401);
  return authorizeIdentity(getDb(), session.user, permission);
}
