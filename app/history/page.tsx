import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { HistoryList, type HistoryRecord } from "@/components/history-list";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Screening history" };
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const configured = isSupabaseConfigured();
  const supabase = await createSupabaseServerClient();
  let records: HistoryRecord[] = [];
  let loadError = false;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: sessions, error } = await supabase.from("screening_sessions").select("id, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
      if (error) loadError = true;
      else if (sessions?.length) {
        const ids = sessions.map((row) => row.id);
        const [results, images, reports] = await Promise.all([
          supabase.from("screening_results").select("session_id, screening_level").in("session_id", ids),
          supabase.from("skin_images").select("session_id, quality_status").in("session_id", ids),
          supabase.from("reports").select("id, session_id").eq("user_id", user.id).in("session_id", ids),
        ]);
        if (results.error || images.error || reports.error) loadError = true;
        const resultBySession = new Map((results.data ?? []).map((row) => [row.session_id, row.screening_level]));
        const imageBySession = new Map((images.data ?? []).map((row) => [row.session_id, row.quality_status]));
        const reportBySession = new Map((reports.data ?? []).map((row) => [row.session_id, row.id]));
        records = sessions.map((row) => ({
          id: row.id,
          status: row.status,
          createdAt: row.created_at,
          level: resultBySession.get(row.id) ?? null,
          imageQuality: imageBySession.get(row.id) ? qualityLabel(imageBySession.get(row.id)!) : null,
          reportId: reportBySession.get(row.id) ?? null,
        }));
      }
    }
  }
  return <AppShell><div className="page-heading-row"><div><span className="page-eyebrow">YOUR PRIVATE RECORDS</span><h1>Screening history</h1><p>Review, compare, download, or delete your own screening records. No sample records are shown.</p></div></div><HistoryList connected={configured} loadError={loadError} records={records} /></AppShell>;
}

function qualityLabel(status: string) {
  if (status === "passed") return "Technical checks passed";
  if (status === "rejected") return "Insufficient";
  return "Pending";
}
