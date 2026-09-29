import type { Metadata } from "next";
import { PublicPageFrame } from "@/components/public-page-frame";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return <PublicPageFrame><section className="public-page"><div className="container public-content">
    <div className="eyebrow"><span className="eyebrow-dot" /> PRIVACY PRINCIPLES</div>
    <h1>Your skin data deserves care.</h1>
    <p className="lead">Images and screening information can be sensitive. This page describes the product’s intended privacy approach and the safeguards that must be configured before production use.</p>
    <div className="prose-grid">
      <article className="prose-card"><h2>Image handling</h2><p>In this build, a selected image is previewed locally in your browser for basic validation. It is not uploaded to a model or saved as a screening record. A production deployment should use private storage and short-lived signed URLs.</p></article>
      <article className="prose-card"><h2>User control and deletion</h2><p>Account data and stored images should be deletable through authenticated server-side operations that remove both database records and associated private files. Retention behavior must be configured and documented before launch.</p></article>
      <article className="prose-card"><h2>Consent and data minimization</h2><p>The scan flow requires explicit consent before image selection. Collect only structured information needed for the screening workflow. Do not submit another person’s image or information without the appropriate authority and consent.</p></article>
      <article className="prose-card"><h2>AI limitations</h2><p>No validated screening model is connected in this build. No screening result is generated. Future model processing must be documented, validated, access-controlled, and monitored before it is made available.</p></article>
    </div>
    <div className="legal-meta">Implementation note: Supabase credentials are intentionally not included. Configure your own project, review the included RLS policies, retention plan, and deployment settings, and obtain appropriate privacy and legal review before handling real user data.</div>
  </div></section></PublicPageFrame>;
}
