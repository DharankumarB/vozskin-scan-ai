import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { allowRateLimit, isSameOriginMutation } from "@/lib/security/rate-limit";

export async function DELETE(request: NextRequest) {
  if (!isSameOriginMutation(request, request.nextUrl.origin)) return NextResponse.json({ error: "REQUEST_ORIGIN_INVALID" }, { status: 403 });
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "ACCOUNT_DELETION_NOT_CONFIGURED" }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!allowRateLimit(`delete-account:${user.id}`, 1, 60_000).allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

  let confirmation: unknown;
  try { confirmation = (await request.json()).confirmation; } catch { return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 }); }
  if (confirmation !== "DELETE MY ACCOUNT") return NextResponse.json({ error: "CONFIRMATION_REQUIRED" }, { status: 400 });

  const { data: sessions, error: sessionsError } = await admin.from("screening_sessions").select("id").eq("user_id", user.id);
  if (sessionsError) return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  const ids = (sessions ?? []).map((row) => row.id);
  const [{ data: images, error: imagesError }, { data: reports, error: reportsError }] = ids.length ? await Promise.all([
    admin.from("skin_images").select("storage_path").in("session_id", ids),
    admin.from("reports").select("storage_path").eq("user_id", user.id),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  if (imagesError || reportsError) return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  const imagePaths = (images ?? []).map((row) => row.storage_path).filter((path): path is string => typeof path === "string");
  const reportPaths = (reports ?? []).map((row) => row.storage_path).filter((path): path is string => typeof path === "string");
  if (imagePaths.length) {
    const { error } = await admin.storage.from("skin-images").remove(imagePaths);
    if (error) return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  }
  if (reportPaths.length) {
    const { error } = await admin.storage.from("reports").remove(reportPaths);
    if (error) return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  }

  const { error: deletionError } = await admin.auth.admin.deleteUser(user.id);
  if (deletionError) return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  await supabase.auth.signOut();
  return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
}
