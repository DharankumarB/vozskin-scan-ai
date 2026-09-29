import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight, CalendarDays, FileText, LockKeyhole, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DashboardEmpty, DashboardGreeting, DashboardMetric } from "@/components/dashboard-copy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const configured = isSupabaseConfigured();
  const supabase = await createSupabaseServerClient();
  let scanCount: number | null = null;
  let latestDate: string | null = null;
  let displayName: string | null = null;
  let readError = false;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const [profileResult, countResult, latestResult] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("screening_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("screening_sessions").select("created_at").eq("user_id", user.id).eq("status", "completed").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      displayName = profileResult.data?.display_name ?? null;
      if (countResult.error || latestResult.error) readError = true;
      else {
        scanCount = countResult.count ?? 0;
        latestDate = latestResult.data?.created_at ?? null;
      }
    }
  }
  const greetingName = displayName?.trim().split(/\s+/)[0];
  const dateLabel = latestDate ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(latestDate)) : null;

  return <AppShell><DashboardGreeting name={greetingName ?? null} />
    <section className="dashboard-hero-card"><div><span className="page-eyebrow">A GUIDED, RESPONSIBLE WORKFLOW</span><h2>Start with what you’ve noticed.</h2><p>Upload an image, share structured symptoms, and review the limits before continuing. No model prediction is available in this build.</p><Link className="button button-primary button-small" href="/scan">Start New Skin Scan <ArrowRight size={14} /></Link></div><div aria-hidden="true" className="dashboard-hero-icon"><ScanLine size={30} /></div></section>
    <section aria-label="Screening overview" className="metric-grid">
      <DashboardMetric icon={<CalendarDays size={15} />} labelKey="dashboard.lastScreening" value={dateLabel ?? (readError ? "Unavailable" : "—")} caption={dateLabel ? "Most recent completed session" : "No completed screening record"} />
      <DashboardMetric icon={<ShieldCheck size={15} />} labelKey="dashboard.screeningLevel" value="Unavailable" caption="No validated model connected" />
      <DashboardMetric icon={<FileText size={15} />} labelKey="dashboard.totalScans" value={scanCount === null ? "—" : String(scanCount)} caption={readError ? "History could not be loaded" : configured ? "Based on your account records" : "Connect Supabase to save records"} />
      <DashboardMetric icon={<Activity size={15} />} labelKey="dashboard.trackingStatus" value={scanCount === null ? "Unavailable" : scanCount ? "Started" : "Not started"} caption={scanCount ? "No validated trend score available" : "Add an observation to begin"} />
    </section>
    <div className="dashboard-grid">
      <section className="panel"><div className="panel-heading"><h2>Recent observations</h2><Link className="text-link" href="/history" style={{ fontSize: 10 }}>View history <ArrowRight size={13} /></Link></div><div className="panel-body"><DashboardEmpty /></div></section>
      <section className="panel"><div className="panel-heading"><h2>Privacy & model status</h2><span>Current environment</span></div><div className="panel-body" style={{ display: "grid", gap: 11 }}>
        <div className="notice-card"><LockKeyhole size={17} /><div><strong>{configured ? "Supabase authentication configured" : "Authentication not connected"}</strong><p>{configured ? "Private database and storage policies still need to be deployed and reviewed." : "No profile, image, or screening record can be saved until Supabase is configured."}</p></div></div>
        <div className="notice-card"><Sparkles size={17} /><div><strong>AI model not connected</strong><p>No screening output, confidence, probability, signals, or accuracy value is being generated.</p></div></div>
        <Link className="text-link" href="/privacy" style={{ fontSize: 10, marginTop: 2 }}>Review privacy principles <ArrowRight size={13} /></Link>
      </div></section>
    </div>
    <div className="dashboard-footnote"><ShieldCheck size={13} /> AI-assisted screening information only. Not a medical diagnosis.</div>
  </AppShell>;
}
