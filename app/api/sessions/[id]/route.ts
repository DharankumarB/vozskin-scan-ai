import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { allowRateLimit, isSameOriginMutation } from "@/lib/security/rate-limit";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginMutation(request, request.nextUrl.origin)) return NextResponse.json({ error: "REQUEST_ORIGIN_INVALID" }, { status: 403 });
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!allowRateLimit(`delete:${user.id}`, 10, 60_000).allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

  const { data: session, error: sessionError } = await supabase.from("screening_sessions").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (sessionError || !session) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const [{ data: images, error: imagesError }, { data: reports, error: reportsError }] = await Promise.all([
    supabase.from("skin_images").select("storage_path").eq("session_id", id),
    supabase.from("reports").select("storage_path").eq("session_id", id).eq("user_id", user.id),
  ]);
  if (imagesError || reportsError) return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });

  const imagePaths = (images ?? []).map((row) => row.storage_path).filter((path): path is string => typeof path === "string");
  const reportPaths = (reports ?? []).map((row) => row.storage_path).filter((path): path is string => typeof path === "string");
  if (imagePaths.length) {
    const { error } = await supabase.storage.from("skin-images").remove(imagePaths);
    if (error) return NextResponse.json({ error: "IMAGE_DELETE_FAILED" }, { status: 500 });
  }
  if (reportPaths.length) {
    const { error } = await supabase.storage.from("reports").remove(reportPaths);
    if (error) return NextResponse.json({ error: "REPORT_DELETE_FAILED" }, { status: 500 });
  }
  const { error: deleteError } = await supabase.from("screening_sessions").delete().eq("id", id).eq("user_id", user.id);
  if (deleteError) return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
}
