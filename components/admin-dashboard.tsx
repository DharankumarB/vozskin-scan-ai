import Link from "next/link";
import { Activity, AlertTriangle, ArrowRight, FileText, ScanLine, ShieldCheck, UsersRound } from "lucide-react";
import type { AdminOverview } from "@/lib/admin/overview";

export function AdminDashboard({ overview, configured }: { overview: AdminOverview | null; configured: boolean }) {
  const format = (value: number | null) => value === null ? "Not available" : value.toLocaleString();
  return <>
    <div className="admin-context-note"><ShieldCheck size={14} /><span>Aggregated operational data only. This dashboard does not display medical images or identifiable screening details.</span></div>
    {!configured && <div className="unavailable-banner" style={{ marginBottom: 15 }}><AlertTriangle size={16} /><div><strong>Admin analytics not connected</strong><p>Configure a server-only Supabase service-role key and apply the database migration to load real, aggregated metrics. No sample data is shown.</p></div></div>}
    <section aria-label="Platform metrics" className="admin-stat-grid">
      <Metric icon={<UsersRound size={15} />} label="Total users" value={format(overview?.totalUsers ?? null)} note="Profiles in Supabase" />
      <Metric icon={<Activity size={15} />} label="Active users" value={format(overview?.activeUsers ?? null)} note="Activity metric not connected" />
      <Metric icon={<ScanLine size={15} />} label="Total scans" value={format(overview?.totalScans ?? null)} note="Stored screening sessions" />
      <Metric icon={<ShieldCheck size={15} />} label="Completed screenings" value={format(overview?.completedScreenings ?? null)} note="Stored validated model outputs" />
      <Metric icon={<AlertTriangle size={15} />} label="Failed image checks" value={format(overview?.failedImageChecks ?? null)} note="Recorded technical rejections" />
      <Metric icon={<FileText size={15} />} label="Reports generated" value={format(overview?.reportsGenerated ?? null)} note="Stored report metadata" />
      <Metric icon={<Activity size={15} />} label="AI requests" value={format(overview?.aiRequests ?? null)} note="Request telemetry not connected" />
      <Metric icon={<AlertTriangle size={15} />} label="System errors" value={format(overview?.systemErrors ?? null)} note="Error telemetry not connected" />
    </section>
    <section className="admin-charts">
      <Chart title="Scans per day" subtitle="Last 14 days · aggregated from screening sessions" series={overview?.scanTrend ?? null} labelKey="day" valueKey="total" />
      <Chart title="User registrations" subtitle="Last 14 days · aggregated from profiles" series={overview?.registrationTrend ?? null} labelKey="day" valueKey="total" />
      <Distribution title="Screening distribution" rows={overview?.screeningDistribution ?? null} labelKey="level" />
      <Distribution title="Image-quality checks" rows={overview?.qualityDistribution ?? null} labelKey="status" />
    </section>
    <section className="admin-bottom-grid">
      <div className="panel"><div className="panel-heading"><h2>Operational notes</h2><span>Current connection state</span></div><div className="panel-body"><div className="admin-note-row"><span>Image-quality rejection rate</span><strong>{overview?.imageQualityRejectionRate == null ? "Not available — quality data unavailable or no images." : `${(overview.imageQualityRejectionRate * 100).toFixed(1)}%`}</strong></div><div className="admin-note-row"><span>Language usage</span><strong>Not available — language telemetry is not connected.</strong></div><div className="admin-note-row"><span>Performance and latency</span><strong>Not available — inference telemetry is not connected.</strong></div><div className="admin-note-row"><span>Model uncertainty</span><strong>{overview?.uncertaintyDistribution ? "See model monitoring" : "Not available — no evaluation data."}</strong></div></div></div>
      <div className="panel"><div className="panel-heading"><h2>Administration</h2><span>Server-side protected</span></div><div className="panel-body admin-links"><Link href="/admin/users"><span><UsersRound size={15} /> User management</span><ArrowRight size={14} /></Link><Link href="/admin/model"><span><ScanLine size={15} /> AI model monitoring</span><ArrowRight size={14} /></Link><div className="admin-safe-note">Admin access is checked against the configured email or server-managed role. User metadata cannot grant admin access.</div></div></div>
    </section>
    <p className="admin-disclaimer">Operational analytics are aggregated and are not clinical performance metrics. Clinical accuracy, sensitivity, specificity, AUROC, and other evaluation metrics are not available unless independently evaluated data is connected.</p>
  </>;
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <article className="admin-stat"><div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div><strong>{value}</strong><small>{note}</small></article>;
}

function Chart({ title, subtitle, series, labelKey, valueKey }: { title: string; subtitle: string; series: Record<string, string | number>[] | null; labelKey: string; valueKey: string }) {
  if (!series) return <div className="panel chart-card"><div className="panel-heading"><h2>{title}</h2></div><div className="panel-body"><div className="chart-placeholder"><div><Activity size={18} /><span>Not available — aggregated analytics view is not connected.</span></div></div></div></div>;
  const values = series.map((row) => Number(row[valueKey]));
  const max = Math.max(...values, 1);
  const width = 560;
  const height = 150;
  const gap = 8;
  const barWidth = Math.max(7, (width - gap * Math.max(series.length - 1, 0)) / Math.max(series.length, 1));
  return <section className="panel chart-card"><div className="panel-heading"><div><h2>{title}</h2><span>{subtitle}</span></div></div><div className="panel-body"><div className="bar-chart-wrap"><svg aria-label={`${title}, ${series.reduce((sum, row) => sum + Number(row[valueKey]), 0)} total events`} className="bar-chart" role="img" viewBox={`0 0 ${width} ${height + 25}`}>
    {[0, .5, 1].map((fraction) => <line key={fraction} stroke="rgba(255,255,255,.08)" x1="0" x2={width} y1={height - fraction * (height - 8)} y2={height - fraction * (height - 8)} />)}
    {series.map((row, index) => { const value = Number(row[valueKey]); const barHeight = value ? Math.max(3, (value / max) * (height - 12)) : 1; const x = index * (barWidth + gap); const label = String(row[labelKey]); return <g key={`${label}-${index}`}><title>{`${label}: ${value}`}</title><rect fill="url(#barGradient)" height={barHeight} rx="4" width={barWidth} x={x} y={height - barHeight} /><text fill="#777986" fontSize="8" textAnchor="middle" x={x + barWidth / 2} y={height + 15}>{label.slice(-2)}</text></g>; })}
    <defs><linearGradient id="barGradient" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#b8a9ff" /><stop offset="1" stopColor="#667ac0" stopOpacity=".62" /></linearGradient></defs>
  </svg></div></div></section>;
}

function Distribution({ title, rows, labelKey }: { title: string; rows: Record<string, string | number>[] | null; labelKey: string }) {
  return <section className="panel chart-card"><div className="panel-heading"><h2>{title}</h2><span>Stored records only</span></div><div className="panel-body">{rows === null ? <div className="chart-placeholder"><div><Activity size={18} /><span>Not available — analytics data is not connected.</span></div></div> : rows.length === 0 ? <div className="chart-placeholder"><div><Activity size={18} /><span>No records available for this period.</span></div></div> : <div className="distribution-list">{rows.map((row) => <div className="distribution-row" key={String(row[labelKey])}><span>{String(row[labelKey]).replaceAll("_", " ")}</span><strong>{Number(row.total).toLocaleString()}</strong></div>)}</div>}</div></section>;
}
