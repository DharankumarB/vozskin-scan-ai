import type { Metadata } from "next";
import { PublicPageFrame } from "@/components/public-page-frame";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return <PublicPageFrame><section className="public-page"><div className="container public-content">
    <div className="eyebrow"><span className="eyebrow-dot" /> TERMS OF USE</div>
    <h1>Terms for using the service.</h1>
    <p className="lead">This page is a drafting placeholder and is not a final contract. Have qualified counsel review and adapt it to the service, jurisdiction, and operating model before publication.</p>
    <div className="legal-meta">Draft status: placeholder text. These terms do not create or represent a completed legal agreement. No production service should rely on this page without legal review.</div>
    <div className="prose-grid">
      <article className="prose-card"><h2>Service purpose</h2><p>VozSkin Scan AI is intended to provide AI-assisted screening information and tools for organizing skin observations. It does not provide medical diagnosis, treatment, or professional medical advice.</p></article>
      <article className="prose-card"><h2>Not for emergencies</h2><p>The service is not designed for urgent or emergency needs. It does not provide emergency triage or treatment instructions. Do not use an automated screening tool as a substitute for appropriate professional care.</p></article>
      <article className="prose-card"><h2>Responsible use</h2><p>Users are responsible for providing information they are authorized to share and for protecting account credentials. Do not attempt to access another person’s records or bypass security controls.</p></article>
      <article className="prose-card"><h2>Availability and limitations</h2><p>Features may be unavailable, incomplete, or changed. Screening outputs, if offered in a future configured deployment, can be uncertain and should be reviewed by a qualified healthcare professional.</p></article>
    </div>
  </div></section></PublicPageFrame>;
}
