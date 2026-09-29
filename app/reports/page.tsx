import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownToLine, ArrowRight, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const connected = isSupabaseConfigured();
  const supabase = await createSupabaseServerClient();
  let reports: { id: string; session_id: string; created_at: string }[] = [];
  let error = false;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error: queryError } = await supabase.from("reports").select("id,session_id,created_at").eq("user_id", user.id).order("created_at", { ascending: false });
      if (queryError) error = true;
      else reports = data ?? [];
    }
  }
  return <AppShell><div className="page-heading-row"><div><span className="page-eyebrow">YOUR PRIVATE DOCUMENTS</span><h1>Reports</h1><p>Download your screening report or print a verified result page as a PDF.</p></div></div>
    {!connected ? <div className="empty-state panel"><span className="empty-icon"><FileText size={20} /></span><h3>Reports are not connected yet.</h3><p>Configure authentication, database access, and private report storage before reports can be saved.</p></div> : error ? <div className="alert error" role="alert">Reports could not be loaded. Please try again later.</div> : reports.length === 0 ? <div className="empty-state panel"><span className="empty-icon"><FileText size={20} /></span><h3>No reports available</h3><p>No report files are stored for your account. A report can only be produced from a validated screening record.</p><Link className="button button-outline button-small" href="/history">Review history <ArrowRight size={13} /></Link></div> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Created</th><th>Screening session</th><th>Actions</th></tr></thead><tbody>{reports.map((report) => <tr key={report.id}><td>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.created_at))}</td><td>{report.session_id.slice(0, 8).toUpperCase()}</td><td><div className="row-actions"><Link aria-label="Open screening record" className="icon-plain" href={`/scan/result/${report.session_id}`}><ArrowRight size={14} /></Link><a aria-label="Download screening report" className="icon-plain" href={`/api/reports/${report.id}/download`}><ArrowDownToLine size={14} /></a></div></td></tr>)}</tbody></table></div>}
  </AppShell>;
}
