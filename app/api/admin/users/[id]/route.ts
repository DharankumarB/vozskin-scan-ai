import { NextRequest, NextResponse } from "next/server";
import { getVerifiedAdminContext } from "@/lib/auth/admin";
import { allowRateLimit, isSameOriginMutation } from "@/lib/security/rate-limit";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginMutation(request, request.nextUrl.origin)) return NextResponse.json({ error: "REQUEST_ORIGIN_INVALID" }, { status: 403 });
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "INVALID_USER" }, { status: 400 });
  const verified = await getVerifiedAdminContext();
  if (!verified) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (!verified.admin) return NextResponse.json({ error: "ADMIN_USER_MANAGEMENT_NOT_CONFIGURED" }, { status: 503 });
  if (verified.user.id === id) return NextResponse.json({ error: "CANNOT_CHANGE_OWN_ACCESS" }, { status: 400 });
  if (!allowRateLimit(`admin-user-update:${verified.user.id}`, 20, 60_000).allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

  let action: unknown;
  try { action = (await request.json()).action; } catch { return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 }); }
  if (action !== "activate" && action !== "deactivate") return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
  const { data: targetResult, error: targetError } = await verified.admin.auth.admin.getUserById(id);
  if (targetError || !targetResult.user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  const target = targetResult.user;
  const { data: profile } = await verified.admin.from("profiles").select("role").eq("user_id", id).maybeSingle();
  const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isAdminTarget = profile?.role === "admin" || target.app_metadata?.role === "admin" || Boolean(configuredAdminEmail && target.email?.toLowerCase() === configuredAdminEmail);
  if (isAdminTarget) return NextResponse.json({ error: "ADMIN_ACCOUNT_PROTECTED" }, { status: 403 });

  const { error: updateError } = await verified.admin.auth.admin.updateUserById(id, { ban_duration: action === "deactivate" ? "876000h" : "none" });
  if (updateError) return NextResponse.json({ error: "USER_UPDATE_FAILED" }, { status: 503 });
  await verified.admin.from("audit_logs").insert({ actor_id: verified.user.id, action: `user_${action}`, resource_type: "auth_user", resource_id: id, metadata: {} });
  return NextResponse.json({ updated: true, deactivated: action === "deactivate" }, { headers: { "Cache-Control": "no-store" } });
}
