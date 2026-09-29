import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ClinicDashboard, type ClinicPatient } from "@/components/clinic-dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Clinic workspace" };
export const dynamic = "force-dynamic";

export default async function ClinicPage() {
  const connected = isSupabaseConfigured();
  const supabase = await createSupabaseServerClient();
  let patients: ClinicPatient[] = [];
  let loadError = false;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: accessRows, error: accessError } = await supabase.from("patient_access").select("patient_user_id,created_at").eq("clinic_user_id", user.id);
      if (accessError) loadError = true;
      else if (accessRows?.length) {
        const patientIds = accessRows.map((row) => row.patient_user_id);
        const [profiles, sessions] = await Promise.all([
          supabase.from("profiles").select("user_id,display_name").in("user_id", patientIds),
          supabase.from("screening_sessions").select("id,user_id,status,created_at").in("user_id", patientIds).order("created_at", { ascending: false }).limit(500),
        ]);
        if (profiles.error || sessions.error) loadError = true;
        const sessionRows = sessions.data ?? [];
        const sessionIds = sessionRows.map((row) => row.id);
        const resultQuery = sessionIds.length ? await supabase.from("screening_results").select("session_id,screening_level").in("session_id", sessionIds) : { data: [], error: null };
        if (resultQuery.error) loadError = true;
        const names = new Map((profiles.data ?? []).map((row) => [row.user_id, row.display_name]));
        const levels = new Map((resultQuery.data ?? []).map((row) => [row.session_id, row.screening_level]));
        patients = accessRows.map((access) => ({
          id: access.patient_user_id,
          name: names.get(access.patient_user_id) ?? null,
          createdAt: access.created_at,
          sessions: sessionRows.filter((row) => row.user_id === access.patient_user_id).map((row) => ({ id: row.id, createdAt: row.created_at, status: row.status, level: levels.get(row.id) ?? null })),
        }));
      }
    }
  }
  return <AppShell><div className="page-heading-row"><div><span className="page-eyebrow">VOZLOOK STUDIOS · CLINIC</span><h1>Clinic workspace</h1><p>Review screening records only for patients who have explicitly authorized this clinic account.</p></div></div><ClinicDashboard connected={connected} loadError={loadError} patients={patients} /></AppShell>;
}
