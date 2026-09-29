import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, ArrowLeft, CheckCircle2, Eye, FileText, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ResultActions } from "@/components/result-actions";
import { Brand } from "@/components/brand";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ScreeningOutputSchema, SymptomAnswersSchema, type ScreeningOutput, type SymptomAnswers } from "@/lib/screening/schema";

export const metadata: Metadata = { title: "Screening report" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function ScreeningResultPage({ params }: PageProps) {
  const { id } = await params;
  const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  const supabase = await createSupabaseServerClient();
  let session: { id: string; user_id: string; status: string; created_at: string; model_name: string | null; model_version: string | null } | null = null;
  let viewerId: string | null = null;
  let output: ScreeningOutput | null = null;
  let answers: SymptomAnswers | null = null;
  let imageUrl: string | null = null;
  let reportId: string | null = null;
  let dataError = false;

  if (validId && supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      viewerId = user.id;
      const { data: storedSession, error: sessionError } = await supabase.from("screening_sessions").select("id,user_id,status,created_at,model_name,model_version").eq("id", id).maybeSingle();
      if (sessionError) dataError = true;
      if (storedSession) {
        session = storedSession;
        const [resultQuery, answerQuery, imageQuery, reportQuery] = await Promise.all([
          supabase.from("screening_results").select("screening_level,probability,confidence,uncertainty,signals_json,recommendation,model_name,model_version,input_schema_version,prediction_timestamp").eq("session_id", id).maybeSingle(),
          supabase.from("symptom_assessments").select("answers_json").eq("session_id", id).maybeSingle(),
          supabase.from("skin_images").select("storage_path").eq("session_id", id).limit(1).maybeSingle(),
          supabase.from("reports").select("id").eq("session_id", id).maybeSingle(),
        ]);
        if (resultQuery.error || answerQuery.error || imageQuery.error || reportQuery.error) dataError = true;
        if (resultQuery.data) {
          const parsedOutput = ScreeningOutputSchema.safeParse({
            screening_level: resultQuery.data.screening_level,
            probability: resultQuery.data.probability === null ? undefined : Number(resultQuery.data.probability),
            confidence: resultQuery.data.confidence === null ? undefined : Number(resultQuery.data.confidence),
            uncertainty: resultQuery.data.uncertainty,
            signals: resultQuery.data.signals_json,
            recommendation: resultQuery.data.recommendation,
            model_name: resultQuery.data.model_name,
            model_version: resultQuery.data.model_version,
            input_schema_version: resultQuery.data.input_schema_version,
            prediction_timestamp: new Date(resultQuery.data.prediction_timestamp).toISOString(),
          });
          if (parsedOutput.success) output = parsedOutput.data;
          else dataError = true;
        }
        if (answerQuery.data?.answers_json) {
          const parsedAnswers = SymptomAnswersSchema.safeParse(answerQuery.data.answers_json);
          if (parsedAnswers.success) answers = parsedAnswers.data;
          else dataError = true;
        }
        if (imageQuery.data?.storage_path) {
          const signed = await supabase.storage.from("skin-images").createSignedUrl(imageQuery.data.storage_path, 60);
          if (!signed.error) imageUrl = signed.data.signedUrl;
          else {
            const admin = createSupabaseAdminClient();
            if (admin) {
              const authorizedSigned = await admin.storage.from("skin-images").createSignedUrl(imageQuery.data.storage_path, 60);
              if (!authorizedSigned.error) imageUrl = authorizedSigned.data.signedUrl;
            }
          }
        }
        reportId = reportQuery.data?.id ?? null;
      }
    }
  }

  const date = session ? new Intl.DateTimeFormat("en", { dateStyle: "long", timeStyle: "short" }).format(new Date(session.created_at)) : null;
  const summary = output ? descriptions[output.screening_level] : null;
  return <AppShell>
    <div className="report-masthead"><Brand /><span>SCREENING REPORT · {id.slice(0, 8).toUpperCase()}</span></div>
    <div className="page-heading-row print-hide"><div><span className="page-eyebrow">VOZSKIN SCAN AI · SCREENING REPORT</span><h1>Screening assessment</h1><p>Results are screening information only and should be reviewed with a qualified healthcare professional.</p></div><Link className="button button-outline button-small" href="/history"><ArrowLeft size={14} /> History</Link></div>
    {dataError && <div className="alert error" role="alert" style={{ marginBottom: 16 }}>This record could not be fully verified. Some report details have been hidden for safety.</div>}
    {!session ? <div className="result-empty panel"><span className="empty-icon"><FileText size={20} /></span><h2>No screening record found</h2><p>This record is unavailable in your account. It may have been deleted, or the database is not connected.</p><Link className="button button-outline button-small print-hide" href="/history">Return to history</Link></div> : output && !dataError ? <>
      <section className={`result-risk-card risk-${output.screening_level.toLowerCase()}`}>
        <div className="result-risk-top"><span className="result-risk-icon"><ShieldCheck size={19} /></span><span className="page-eyebrow">MODEL OUTPUT · NOT A DIAGNOSIS</span><span className="status-pill connected">{output.uncertainty.toUpperCase()} UNCERTAINTY</span></div>
        <h2>{output.screening_level.replaceAll("_", " ")} SCREENING RISK</h2><p>{summary}</p>
        <div className="result-meta"><span>Screening ID <strong>{id.slice(0, 8).toUpperCase()}</strong></span><span>Created <strong>{date}</strong></span><span>Model version <strong>{output.model_name} · {output.model_version}</strong></span></div>
      </section>
      <div className="result-actions print-hide"><ResultActions reportUrl={reportId ? `/api/reports/${reportId}/download` : null} />{viewerId === session.user_id ? <Link className="button button-quiet button-small" href={`/tracking?compare=${id}`}>Compare in SkinTrack</Link> : <Link className="button button-quiet button-small" href="/dashboard">Back to workspace</Link>}</div>
      <section className="result-detail-grid">
        <article className="panel result-panel"><div className="panel-heading"><h2><Eye size={14} /> Visual signals</h2><span>Returned by the screening model</span></div><div className="panel-body">{output.signals.filter((signal) => signal.type === "visual").length ? <div className="result-signal-list">{output.signals.filter((signal) => signal.type === "visual").map((signal, index) => <div className="signal-row" key={`${signal.name}-${index}`}><span>{formatSignal(signal.name)}</span><span className={signal.detected ? "signal-detected" : "signal-not-detected"}>{signal.detected ? "Detected" : "Not detected"}</span></div>)}</div> : <p className="result-muted">The model did not return visual signals for this screening.</p>}
          {imageUrl ? <figure className="result-image"><div className="result-image-frame"><Image alt="Private image attached to this screening" fill sizes="(max-width: 620px) 100vw, 45vw" src={imageUrl} unoptimized /></div><figcaption>Original submitted image. No model attention visualization is available for this result.</figcaption></figure> : <div className="result-muted">No model-generated attention visualization is available. A heatmap is not fabricated.</div>}</div></article>
        <article className="panel result-panel"><div className="panel-heading"><h2><CheckCircle2 size={14} /> Reported symptoms</h2><span>From your questionnaire</span></div><div className="panel-body">{answers ? <div className="answer-list">{Object.entries(answerLabels(answers)).map(([label, value]) => <div className="review-line" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div> : <p className="result-muted">No validated questionnaire record is available for this session.</p>}
          <div className="uncertainty-box"><span>MODEL UNCERTAINTY</span><strong>{formatValue(output.uncertainty)}</strong><p>Uncertainty is not a measure of model accuracy. No accuracy estimate is available unless supported by independent evaluation.</p></div>
        </div></article>
      </section>
      {(output.probability !== undefined || output.confidence !== undefined) && <section className="panel result-probability"><div className="panel-heading"><h2>Model-reported values</h2><span>Not accuracy</span></div><div className="panel-body">{output.probability !== undefined && <div className="result-value"><span>Model-estimated probability</span><strong>{(output.probability * 100).toFixed(1)}%</strong></div>}{output.confidence !== undefined && <div className="result-value"><span>Model confidence</span><strong>{(output.confidence * 100).toFixed(1)}%</strong></div>}<p>Probability, confidence, and accuracy are different measures. These values are model-reported and do not establish a diagnosis.</p></div></section>}
      <section className="next-step-card"><div><AlertTriangle size={18} /><div><strong>Recommended next step</strong><p>{output.recommendation === "professional_evaluation" ? "Consider discussing this result with a qualified dermatologist." : output.recommendation === "routine_follow_up" ? "If you remain concerned or notice changes, consider discussing them with a qualified healthcare professional." : "The available image or information is not sufficient for a meaningful screening assessment."}</p></div></div></section>
      <div className="disclaimer-result result-disclaimer"><ShieldCheck size={16} /><strong>VozSkin Scan AI provides AI-assisted screening information and does not provide a medical diagnosis. Results should be reviewed with a qualified healthcare professional.</strong></div>
      <div className="report-footer"><span>VozSkin Scan AI · VozLook Studios</span><span>AI-assisted screening information only. Not a medical diagnosis.</span></div>
    </> : <>
      <section className="model-unavailable-card result-unavailable"><div className="model-unavailable-icon"><AlertTriangle size={18} /></div><div><span className="model-status-label">AI MODEL NOT CONNECTED</span><h3>No screening prediction is stored for this record.</h3><p>This session does not contain a validated model result. No screening level, probability, confidence, visual signal, or accuracy value can be reported.</p>{session && <div className="result-meta"><span>Session <strong>{id.slice(0, 8).toUpperCase()}</strong></span><span>Status <strong>{session.status}</strong></span><span>Created <strong>{date}</strong></span></div>}</div></section>
      <div className="disclaimer-result result-disclaimer"><ShieldCheck size={16} /><strong>VozSkin Scan AI provides AI-assisted screening information and does not provide a medical diagnosis. Results should be reviewed with a qualified healthcare professional.</strong></div>
      <div className="result-actions print-hide"><ResultActions reportUrl={null} /><Link className="button button-quiet button-small" href="/history">Back to history</Link></div>
    </>}
  </AppShell>;
}

const descriptions: Record<ScreeningOutput["screening_level"], string> = {
  LOW: "The submitted information shows fewer patterns associated with the screening target. This does not rule out a medical condition.",
  MODERATE: "Some visual and reported symptom patterns are associated with the screening target. Consider discussing the findings with a qualified healthcare professional.",
  HIGH: "The submitted information contains multiple patterns associated with the screening target. Professional dermatological evaluation is recommended.",
  INSUFFICIENT_INFORMATION: "The available image or information is not sufficient for a meaningful screening assessment.",
};

function formatValue(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatSignal(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function answerLabels(answers: SymptomAnswers) {
  return {
    "Age range": formatValue(answers.age_range),
    "Body location": formatValue(answers.body_location),
    "Duration": `${answers.duration_days} days`,
    "Redness": answers.redness ? "Reported" : "Not reported",
    "Scaling or flaking": answers.scaling ? "Reported" : "Not reported",
    "Itching": answers.itching ? "Reported" : "Not reported",
    "Dryness": answers.dryness ? "Reported" : "Not reported",
    "Pain": answers.pain ? "Reported" : "Not reported",
    "Burning": answers.burning ? "Reported" : "Not reported",
    "Swelling": answers.swelling ? "Reported" : "Not reported",
    "Recurrence": answers.recurrence ? "Reported" : "Not reported",
    "Previous similar episodes": formatValue(answers.previous_similar_episodes),
    "Family history": formatValue(answers.family_history),
    "Previous professional diagnosis": formatValue(answers.previous_professional_diagnosis),
    ...(answers.relevant_skin_history ? { "Relevant skin history": answers.relevant_skin_history } : {}),
  };
}
