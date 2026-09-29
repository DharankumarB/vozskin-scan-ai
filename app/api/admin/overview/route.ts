import { NextResponse } from "next/server";
import { getVerifiedAdminContext } from "@/lib/auth/admin";
import { loadAdminOverview } from "@/lib/admin/overview";

export async function GET() {
  const context = await getVerifiedAdminContext();
  if (!context) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  if (!context.admin) return NextResponse.json({ error: "ADMIN_ANALYTICS_NOT_CONFIGURED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const metrics = await loadAdminOverview(context.admin);
  return NextResponse.json(metrics, { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
