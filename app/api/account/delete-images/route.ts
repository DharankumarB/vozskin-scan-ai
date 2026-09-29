import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { allowRateLimit, isSameOriginMutation } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  if (!isSameOriginMutation(request, request.nextUrl.origin)) return NextResponse.json({ error: "REQUEST_ORIGIN_INVALID" }, { status: 403 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!allowRateLimit(`delete-images:${user.id}`, 3, 60_000).allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

  const { data: sessions, error: sessionError } = await supabase.from("screening_sessions").select("id").eq("user_id", user.id);
  if (sessionError) return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  const sessionIds = (sessions ?? []).map((row) => row.id);
  if (!sessionIds.length) return NextResponse.json({ deleted: 0 }, { headers: { "Cache-Control": "no-store" } });
  const { data: images, error: imageError } = await supabase.from("skin_images").select("id,storage_path").in("session_id", sessionIds);
  if (imageError) return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  const paths = (images ?? []).map((row) => row.storage_path).filter((path): path is string => typeof path === "string");
  if (paths.length) {
    const { error } = await supabase.storage.from("skin-images").remove(paths);
    if (error) return NextResponse.json({ error: "IMAGE_DELETE_FAILED" }, { status: 500 });
  }
  const imageIds = (images ?? []).map((row) => row.id);
  if (imageIds.length) {
    const { error } = await supabase.from("tracking_images").delete().in("image_id", imageIds);
    if (error) return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
    const { error: rowError } = await supabase.from("skin_images").delete().in("id", imageIds);
    if (rowError) return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  }
  return NextResponse.json({ deleted: imageIds.length }, { headers: { "Cache-Control": "no-store" } });
}
