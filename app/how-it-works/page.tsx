import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Camera, ClipboardList, FileCheck2, ScanLine, ShieldCheck } from "lucide-react";
import { PublicPageFrame } from "@/components/public-page-frame";

export const metadata: Metadata = { title: "How it works" };

const steps = [
  { icon: Camera, title: "Upload", text: "Choose a JPEG, PNG, or WEBP image. The scan flow checks the file type, size, and whether it can be decoded before continuing." },
  { icon: ScanLine, title: "Image quality check", text: "The current client checks basic image integrity and dimensions. It does not validate visible skin area or make a clinical quality judgment." },
  { icon: ClipboardList, title: "Symptom assessment", text: "Answer a small set of structured questions about location, duration, and symptoms. Only information relevant to screening should be collected." },
  { icon: ShieldCheck, title: "AI screening", text: "A screening model must be validated, configured, and connected on the server. No prediction is generated while that model is unavailable." },
  { icon: FileCheck2, title: "Explainable result", text: "When enabled, the result can include structured signals, model uncertainty, the model version, your actual answers, and the screening disclaimer." },
  { icon: ArrowRight, title: "Track over time", text: "Keep dated observations together and compare submissions. Differences are descriptive, not a diagnosis or validated improvement score." },
];

export default function HowItWorksPage() {
  return <PublicPageFrame><section className="public-page"><div className="container public-content">
    <div className="eyebrow"><span className="eyebrow-dot" /> A TRANSPARENT WORKFLOW</div>
    <h1>From observation to a clearer conversation.</h1>
    <p className="lead">A guided, six-step experience is planned to make image and symptom information easier to review. Each step is designed to surface its limits — not hide them.</p>
    <div className="process-steps">{steps.map(({ icon: Icon, title, text }, index) => <article className="process-step" key={title}><span className="process-step-num"><Icon size={18} /></span><div><h2>{String(index + 1).padStart(2, "0")} · {title}</h2><p>{text}</p></div></article>)}</div>
    <div className="legal-meta" style={{ marginTop: 22 }}>Current integration status: no validated screening model is connected. The workflow will not create or display a model prediction until a real model is configured.</div>
    <div style={{ marginTop: 25 }}><Link className="button button-primary" href="/scan">Explore the scan flow <ArrowRight size={15} /></Link></div>
  </div></section></PublicPageFrame>;
}
