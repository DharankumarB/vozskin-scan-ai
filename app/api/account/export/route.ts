import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const [{ data: profile }, { data: sessions, error: sessionsError }, { data: trackingSessions, error: trackingError }] = await Promise.all([
    supabase.from("profiles").select("display_name,avatar_url,role,created_at,updated_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("screening_sessions").select("id,status,consent_given,created_at,completed_at,model_name,model_version,input_schema_version,prediction_timestamp").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("tracking_sessions").select("id,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);
  if (sessionsError || trackingError) return NextResponse.json({ error: "EXPORT_UNAVAILABLE" }, { status: 503 });
  const sessionIds = (sessions ?? []).map((row) => row.id);
  const [imagesQuery, answersQuery, resultsQuery, reportsQuery] = sessionIds.length ? await Promise.all([
    supabase.from("skin_images").select("id,session_id,mime_type,file_size,image_quality_score,quality_status,width,height,created_at").in("session_id", sessionIds),
    supabase.from("symptom_assessments").select("id,session_id,answers_json,created_at").in("session_id", sessionIds),
    supabase.from("screening_results").select("id,session_id,screening_level,probability,confidence,uncertainty,signals_json,recommendation,model_name,model_version,input_schema_version,prediction_timestamp,created_at").in("session_id", sessionIds),
    supabase.from("reports").select("id,session_id,created_at").eq("user_id", user.id),
  ]) : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
  if (imagesQuery.error || answersQuery.error || resultsQuery.error || reportsQuery.error) return NextResponse.json({ error: "EXPORT_UNAVAILABLE" }, { status: 503 });

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email ?? null, created_at: user.created_at },
    profile,
    screening_sessions: sessions ?? [],
    skin_images: imagesQuery.data ?? [],
    symptom_assessments: answersQuery.data ?? [],
    screening_results: resultsQuery.data ?? [],
    reports: reportsQuery.data ?? [],
    tracking_sessions: trackingSessions ?? [],
    note: "This export includes stored metadata and records. It does not include image or PDF file bytes.",
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="vozskin-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
