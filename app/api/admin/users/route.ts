import { NextRequest, NextResponse } from "next/server";
import { getVerifiedAdminContext } from "@/lib/auth/admin";
import { allowRateLimit } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  const context = await getVerifiedAdminContext();
  if (!context) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  if (!context.admin) return NextResponse.json({ error: "ADMIN_USER_MANAGEMENT_NOT_CONFIGURED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (!allowRateLimit(`admin-users:${context.user.id}`, 30, 60_000).allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Math.min(1000, Number(params.get("page") ?? 1) || 1));
  const search = (params.get("search") ?? "").trim().slice(0, 100).toLowerCase();
  const roleFilter = params.get("role") ?? "all";
  if (!(["all", "user", "admin", "clinic"] as const).includes(roleFilter as "all" | "user" | "admin" | "clinic")) return NextResponse.json({ error: "INVALID_FILTER" }, { status: 400 });

  const { data: userPage, error: userError } = await context.admin.auth.admin.listUsers({ page, perPage: 100 });
  if (userError) return NextResponse.json({ error: "USER_LIST_UNAVAILABLE" }, { status: 503 });
  const ids = userPage.users.map((item) => item.id);
  const [profiles, scanCounts] = ids.length ? await Promise.all([
    context.admin.from("profiles").select("user_id,display_name,role,created_at").in("user_id", ids),
    context.admin.from("admin_user_scan_counts").select("user_id,total").in("user_id", ids),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  if (profiles.error || scanCounts.error) return NextResponse.json({ error: "USER_LIST_UNAVAILABLE" }, { status: 503 });
  const profileById = new Map((profiles.data ?? []).map((profile) => [profile.user_id, profile]));
  const countById = new Map((scanCounts.data ?? []).map((row) => [row.user_id, Number(row.total)]));
  const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const users = userPage.users.map((user) => {
    const profile = profileById.get(user.id);
    const role = configuredAdminEmail && user.email?.toLowerCase() === configuredAdminEmail ? "admin" : profile?.role ?? (user.app_metadata?.role === "admin" || user.app_metadata?.role === "clinic" ? user.app_metadata.role : "user");
    const bannedUntil = "banned_until" in user && typeof user.banned_until === "string" ? user.banned_until : null;
    const row = {
      id: user.id,
      email: user.email ?? "",
      displayName: profile?.display_name ?? null,
      role,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      scanCount: countById.get(user.id) ?? 0,
      deactivated: Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now()),
    };
    return row;
  }).filter((user) => {
    const matchesSearch = !search || `${user.email} ${user.displayName ?? ""}`.toLowerCase().includes(search);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return NextResponse.json({ users, page, perPage: 100, hasMore: page < userPage.lastPage }, { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
