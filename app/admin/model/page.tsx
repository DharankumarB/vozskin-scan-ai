import type { Metadata } from "next";
import { Activity, AlertTriangle, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getVerifiedAdminContext } from "@/lib/auth/admin";
import { loadAdminOverview } from "@/lib/admin/overview";

export const metadata: Metadata = { title: "AI model monitoring" };
export const dynamic = "force-dynamic";

export default async function AdminModelPage() {
  const context = await getVerifiedAdminContext();
  if (!context) return <main className="admin-denied"><strong>403 Unauthorized</strong><p>This account is not authorized for model monitoring.</p></main>;
  let latestModel: { model_name: string; model_version: string; prediction_timestamp: string } | null = null;
  let uncertainty: { uncertainty: string; total: number }[] | null = null;
  let rejectionRate: number | null = null;
  if (context.admin) {
    const [latest, distribution, overview] = await Promise.all([
      context.admin.from("screening_results").select("model_name,model_version,prediction_timestamp").order("prediction_timestamp", { ascending: false }).limit(1).maybeSingle(),
      context.admin.from("admin_uncertainty_distribution").select("uncertainty,total"),
      loadAdminOverview(context.admin),
    ]);
    latestModel = latest.data ?? null;
    uncertainty = distribution.error ? null : (distribution.data ?? []).map((row) => ({ uncertainty: row.uncertainty, total: Number(row.total) }));
    rejectionRate = overview.imageQualityRejectionRate;
  }
  return <AppShell accessRole="admin"><div className="page-heading-row"><div><span className="page-eyebrow">VOZLOOK STUDIOS · MODEL GOVERNANCE</span><h1>AI model monitoring</h1><p>Operational traceability and evaluation status. Values are shown only when connected records exist.</p></div></div>
    {!context.admin && <div className="unavailable-banner" style={{ marginBottom: 16 }}><AlertTriangle size={16} /><div><strong>Model monitoring data is not connected</strong><p>Configure the server-only service-role key and apply the database migration. No model metrics are fabricated.</p></div></div>}
    <div className="model-monitor-grid">
      <Metric label="Model version" value={latestModel ? `${latestModel.model_name} · ${latestModel.model_version}` : "Not available — no connected model."} note={latestModel ? `Latest stored prediction · ${formatDate(latestModel.prediction_timestamp)}` : "Validated inference adapter is not connected."} />
      <Metric label="Inference count" value="Not available — telemetry not connected." note="Inference request telemetry is not connected." />
      <Metric label="Failed inference count" value="Not available — telemetry not connected." note="Session failures are not counted as inference failures." />
      <Metric label="Average inference time" value="Not available — timing is not stored." note="No inference timing instrumentation is configured." />
      <Metric label="Image-quality rejection rate" value={rejectionRate === null ? "Not available — no quality data." : `${(rejectionRate * 100).toFixed(1)}%`} note="Calculated from stored technical rejection records only." />
      <Metric label="Deployment version" value={process.env.DEPLOYMENT_VERSION ?? "Not available — deployment metadata not configured."} note="Set DEPLOYMENT_VERSION in the server environment." />
    </div>
    <section className="admin-charts model-charts">
      <div className="panel"><div className="panel-heading"><h2>Uncertainty distribution</h2><span>Stored model output only</span></div><div className="panel-body">{uncertainty === null ? <div className="chart-placeholder"><div><Activity size={18} /><span>Not available — uncertainty data not connected.</span></div></div> : uncertainty.length === 0 ? <div className="chart-placeholder"><div><Activity size={18} /><span>No model outputs are stored.</span></div></div> : <div className="distribution-list">{uncertainty.map((row) => <div className="distribution-row" key={row.uncertainty}><span>{row.uncertainty} uncertainty</span><strong>{row.total.toLocaleString()}</strong></div>)}</div>}</div></div>
      <div className="panel"><div className="panel-heading"><h2>Drift monitoring</h2><span>Placeholder · not connected</span></div><div className="panel-body"><div className="chart-placeholder"><div><Activity size={18} /><span>Not available — reference distributions and production feature telemetry have not been connected.</span></div></div></div></div>
      <div className="panel"><div className="panel-heading"><h2>Evaluation metrics</h2><span>Clinical validation</span></div><div className="panel-body"><div className="evaluation-grid">{["Sensitivity", "Specificity", "Precision", "Recall", "F1", "AUROC", "AUPRC", "Calibration"].map((label) => <div key={label}><span>{label}</span><strong>Not available</strong></div>)}</div><p className="model-small-note">Evaluation data is not connected. No clinical accuracy or performance claims are displayed.</p></div></div>
      <div className="model-governance-card"><ShieldCheck size={17} /><div><strong>Safety gate</strong><p>A model output must be schema-validated, traceable to a version, and written through a trusted server-side inference path. This deployment intentionally returns no prediction.</p></div></div>
    </section>
  </AppShell>;
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="admin-stat model-stat"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}
function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
