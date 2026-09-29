import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { AssistantChat } from "@/components/assistant-chat";

export const metadata: Metadata = { title: "Safe AI assistant" };

export default function AssistantPage() {
  return <AppShell><div className="page-heading-row"><div><span className="page-eyebrow">SAFE EXPLANATION · VOICE READY</span><h1>Ask VozSkin</h1><p>Designed to explain screening terminology and process limits. No generative AI service is connected, so this preview will not create answers or interpret medical data.</p></div></div><div className="unavailable-banner" style={{ marginBottom: 16 }}><span aria-hidden="true">i</span><div><strong>AI assistant not connected</strong><p>The guide below uses fixed safety messages only. Typed questions are not sent to an AI service and no result-specific answer is generated.</p></div></div><AssistantChat /></AppShell>;
}
