import type { Metadata } from "next";
import { ArrowRight, Heart, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { PublicPageFrame } from "@/components/public-page-frame";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return <PublicPageFrame><section className="public-page"><div className="container public-content">
    <div className="eyebrow"><span className="eyebrow-dot" /> VOZLOOK STUDIOS</div>
    <h1>Technology with a more human point of view.</h1>
    <p className="lead">VozSkin Scan AI is being built by VozLook Studios as a responsible, AI-assisted skin screening and longitudinal monitoring platform. Its purpose is to help people understand visual and reported symptom patterns — without claiming to diagnose.</p>
    <div className="prose-grid">
      <article className="prose-card"><Sparkles size={19} /><h2>Why we’re building it</h2><p>Skin changes can be difficult to describe and remember. VozSkin is designed to make observations easier to organize, explain, and discuss with a qualified healthcare professional.</p></article>
      <article className="prose-card"><ShieldCheck size={19} /><h2>Responsible AI, first</h2><p>We will not fabricate model outputs, clinical accuracy, or explanations. If a validated screening model is unavailable, the product says so and does not produce a prediction.</p></article>
      <article className="prose-card"><LockKeyhole size={19} /><h2>Privacy by design</h2><p>Skin images and screening records are sensitive. The intended production design uses private storage, authentication, least-privilege access, and user-controlled deletion.</p></article>
      <article className="prose-card"><Heart size={19} /><h2>Care remains personal</h2><p>AI can assist understanding, but it cannot replace a clinician’s evaluation or judgment. Results, when a model is connected, are screening information only.</p></article>
    </div>
    <div style={{ marginTop: 32 }}><Link className="button button-outline" href="/how-it-works">Explore how it works <ArrowRight size={15} /></Link></div>
  </div></section></PublicPageFrame>;
}
