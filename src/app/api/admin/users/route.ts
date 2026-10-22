import { getDb } from "@/server/db";
import { appUsers } from "@/server/db/schema";
import { requireUser, AccessError } from "@/server/auth/access";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    await requireUser("users:manage");
    const users = await getDb().select({ id: appUsers.id, username: appUsers.username, name: appUsers.displayName, role: appUsers.role, active: appUsers.active }).from(appUsers).limit(100);
    return Response.json({ users }, { headers });
  } catch (error) {
    if (error instanceof AccessError) return Response.json({ error: error.message }, { status: error.status, headers });
    return Response.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503, headers });
  }
}
