import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Camera,
  Eye,
  FileText,
  Heart,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const pillars = [
  { icon: ScanLine, number: "01", title: "Multimodal screening", body: "A structured workflow for a skin image and your reported symptoms — when a validated model is connected." },
  { icon: Eye, number: "02", title: "Explainable by design", body: "See the model signals and uncertainty that are actually returned. No invented heatmaps or hidden confidence claims." },
  { icon: Activity, number: "03", title: "SkinTrack", body: "Keep observations organized over time. Compare submissions without turning change into an unvalidated clinical score." },
  { icon: ShieldCheck, number: "04", title: "Responsible AI", body: "Screening assistance, not diagnosis. Your care decisions stay with you and your qualified healthcare professional." },
];

const workflow = [
  ["Upload", "Add a close-up image in good, natural light. Your image stays private to your account."],
  ["Image quality check", "Start with file integrity and basic technical checks. An unconnected model cannot assess skin visibility or clinical image quality."],
  ["Symptom assessment", "Share only the structured details needed for a screening workflow."],
  ["AI screening", "A validated model must be connected before any screening output can be produced."],
  ["Explainable result", "When available, review the model output, contributing signals, uncertainty, and limitations."],
  ["Track over time", "Organize follow-up observations and compare submissions without claiming a diagnosis or improvement score."],
];

const faqs = [
  ["Does VozSkin diagnose a skin condition?", "No. VozSkin Scan AI is designed for AI-assisted screening information. It does not diagnose, rule out a condition, or replace a qualified healthcare professional."],
  ["Is an AI model connected today?", "No validated screening model is connected in this build. The app will not generate or display a screening prediction until a real, validated model is configured."],
  ["Is my image publicly accessible?", "No. The intended storage design uses private Supabase buckets and access-controlled signed URLs. Configure Supabase and review the deployment security checklist before handling real images."],
  ["Can I use it without an account?", "An account is required for private screening records. The scan workflow preview can be explored, but a real screening cannot be completed while the model is unavailable."],
];

function ScanIllustration() {
  return <div aria-label="Abstract illustration of a responsible skin-screening workflow" className="hero-visual" role="img">
    <div className="visual-glow" />
    <div className="scan-art">
      <div className="scan-art-top"><span>VOZSKIN / VISUAL WORKSPACE</span><span className="live-indicator"><span /> CONCEPT VIEW</span></div>
      <div className="orbital-stage" aria-hidden="true">
        <div className="orbital-ring ring-one" /><div className="orbital-ring ring-two" /><div className="orbital-ring ring-three" />
        <div className="orbital-core"><i className="scan-corner tl" /><i className="scan-corner tr" /><i className="scan-corner bl" /><i className="scan-corner br" /></div>
        <i className="orbit-point one" /><i className="orbit-point two" /><i className="orbit-point three" />
      </div>
      <div className="float-chip top"><span className="float-icon"><Sparkles size={15} /></span><span><strong>Image + reported symptoms</strong><span>Designed as a multimodal workflow</span></span></div>
      <div className="float-chip bottom"><span className="float-icon"><ShieldCheck size={15} /></span><span><strong>Screening, not diagnosis</strong><span>Professional judgment matters</span></span></div>
      <div className="art-label"><div><strong>Responsible skin insights</strong><span>Transparent limitations at every step</span></div><div className="art-status"><LockKeyhole size={12} /> MODEL NOT CONNECTED</div></div>
    </div>
  </div>;
}

export default function HomePage() {
  return <div className="page-backdrop">
    <SiteHeader />
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> VOZLOOK STUDIOS · RESPONSIBLE SKIN HEALTH TECH</div>
            <h1>Understand your skin.<br /><span className="gradient-text">Earlier. Smarter.</span></h1>
            <p className="hero-description">AI-assisted skin screening, explainable insights, and longitudinal skin tracking — designed to help you understand patterns and make informed decisions about professional care.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/scan">Start Skin Scan <ArrowUpRight size={16} /></Link>
              <Link className="button button-outline" href="/how-it-works">Explore how it works <ArrowRight size={15} /></Link>
            </div>
            <div className="hero-note"><ShieldCheck size={15} /> Screening information only · Not a medical diagnosis</div>
          </div>
          <ScanIllustration />
        </div>
      </section>

      <section className="section" id="product">
        <div className="container">
          <div className="section-head-row">
            <div><div className="section-kicker">A clearer way to observe</div><h2 className="section-heading">Your skin story is more than a single image.</h2></div>
            <p className="section-description">VozSkin brings image observations, reported symptoms, and responsible explanations into one considered experience — with uncertainty made visible.</p>
          </div>
          <div className="pillar-grid">
            {pillars.map(({ icon: Icon, number, title, body }) => <article className="pillar-card" key={number}>
              <span className="pillar-index">{number}</span><span className="pillar-icon"><Icon size={18} /></span><h3>{title}</h3><p>{body}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="container">
          <div className="workflow-panel">
            <div className="workflow-copy">
              <div className="section-kicker">A transparent process</div>
              <h2 className="section-heading">Thoughtful at every step.</h2>
              <p className="section-description">The workflow is ready for a validated screening model. Until one is connected, the product clearly says so — and will not invent a result.</p>
              <Link className="button button-outline button-small" href="/how-it-works">View the full process <ArrowRight size={14} /></Link>
            </div>
            <div className="workflow-list">
              {workflow.map(([title, body], index) => <div className="workflow-item" key={title}><span className="workflow-number">{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{body}</p></div></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="explainable-ai">
        <div className="container">
          <div className="section-head-row">
            <div><div className="section-kicker">Model output, made understandable</div><h2 className="section-heading">Explain what the model sees. Never what it doesn’t.</h2></div>
            <p className="section-description">Only signals returned by the configured model should appear. Visual evidence is never simulated to make a result look more certain.</p>
          </div>
          <div className="explain-grid">
            <article className="explain-card"><span className="pillar-icon"><Eye size={18} /></span><h3>Signals with context</h3><p>A future result can show validated model signals alongside the answers you provided, keeping the source of each observation clear.</p><div className="signal-list"><div className="signal-row"><span>Visual signals</span><small>Shown only when returned by a model</small></div><div className="signal-row"><span>Reported symptoms</span><small>From your questionnaire</small></div><div className="signal-row"><span>Model uncertainty</span><small>Not the same as accuracy</small></div></div></article>
            <article className="explain-card"><span className="pillar-icon"><FileText size={18} /></span><h3>Honest about the current state</h3><p>There is no validated screening model connected to this build, so no heatmap, prediction, probability, or confidence score is shown.</p><div className="signal-placeholder"><div><LockKeyhole size={18} /><div style={{ marginTop: 10 }}>Model output unavailable<br />until a validated model is connected</div></div></div></article>
          </div>
        </div>
      </section>

      <section className="section" id="skin-track">
        <div className="container">
          <div className="section-head-row">
            <div><div className="section-kicker">SkinTrack · longitudinal observations</div><h2 className="section-heading">Notice change. Keep the right context.</h2></div>
            <p className="section-description">Follow-up submissions can be viewed side by side with their dates and reported symptoms. The product does not turn visual differences into unvalidated claims of improvement.</p>
          </div>
          <div className="compare-grid">
            <div className="compare-slot"><Camera size={21} /><div><strong>Previous observation</strong><span>Added only when you submit an image</span></div></div>
            <div className="compare-slot"><Camera size={21} /><div><strong>Latest observation</strong><span>Side-by-side comparison, without a diagnosis</span></div></div>
          </div>
        </div>
      </section>

      <section className="section" id="responsible-ai">
        <div className="container">
          <div className="privacy-callout">
            <div><div className="section-kicker">Our responsible AI commitment</div><h2>AI should assist understanding — not replace clinical judgment.</h2><p>Transparent limitations. Uncertainty handling. Privacy-first data controls. Traceable model versions. Professional evaluation when relevant.</p></div>
            <Link className="button button-outline" href="/privacy">Explore our principles <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      <section className="section" id="for-clinics">
        <div className="container">
          <div className="section-head-row">
            <div><div className="section-kicker">For care teams</div><h2 className="section-heading">A considered workspace for clinical collaboration.</h2></div>
            <p className="section-description">The clinic workspace is designed for authorized access to longitudinal records. It requires configured accounts and explicit patient authorization before it can show data.</p>
          </div>
          <div className="pillar-grid">
            <article className="pillar-card"><span className="pillar-icon"><LockKeyhole size={18} /></span><h3>Permission-first access</h3><p>Clinic users should see only the patient records they are explicitly authorized to access.</p></article>
            <article className="pillar-card"><span className="pillar-icon"><FileText size={18} /></span><h3>Clear reporting</h3><p>Reports preserve the model version, uncertainty, and screening-only disclaimer alongside the result.</p></article>
            <article className="pillar-card"><span className="pillar-icon"><Heart size={18} /></span><h3>Care stays human</h3><p>AI-assisted screening is not a substitute for the judgment of a qualified healthcare professional.</p></article>
            <article className="pillar-card"><span className="pillar-icon"><Stethoscope size={18} /></span><h3>Not a connected service</h3><p>No clinic integration or patient data is fabricated. Connect and validate integrations before use.</p></article>
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="container">
          <div className="section-head-row"><div><div className="section-kicker">A few important answers</div><h2 className="section-heading">Clarity before you begin.</h2></div><Link className="text-link" href="/about">Learn about VozSkin <ArrowRight size={14} /></Link></div>
          <div className="faq-grid">{faqs.map(([question, answer]) => <article className="faq-item" key={question}><h3>{question}</h3><p>{answer}</p></article>)}</div>
        </div>
      </section>

      <section className="cta-section"><div className="container"><div className="cta-panel"><div className="section-kicker">Scan. Understand. Track.</div><h2>Begin with an informed next step.</h2><p>Explore the guided screening workflow. A screening prediction remains unavailable until a validated model is connected.</p><Link className="button button-primary" href="/scan">Start Skin Scan <ArrowUpRight size={16} /></Link></div></div></section>
    </main>
    <SiteFooter />
  </div>;
}
