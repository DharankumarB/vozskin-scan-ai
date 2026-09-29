import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { TrackingView, type TrackingObservation } from "@/components/tracking-view";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "SkinTrack" };
export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ compare?: string }> };

export default async function TrackingPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const configured = isSupabaseConfigured();
  const supabase = await createSupabaseServerClient();
  let observations: TrackingObservation[] = [];
  let loadError = false;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: sessions, error } = await supabase.from("screening_sessions").select("id,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
      if (error) loadError = true;
      else if (sessions?.length) {
        const ids = sessions.map((row) => row.id);
        const [imageQuery, resultQuery] = await Promise.all([
          supabase.from("skin_images").select("session_id,storage_path,quality_status").in("session_id", ids),
          supabase.from("screening_results").select("session_id,screening_level").in("session_id", ids),
        ]);
        if (imageQuery.error || resultQuery.error) loadError = true;
        const imageBySession = new Map((imageQuery.data ?? []).map((row) => [row.session_id, row]));
        const levelBySession = new Map((resultQuery.data ?? []).map((row) => [row.session_id, row.screening_level]));
        observations = await Promise.all(sessions.map(async (session) => {
          const image = imageBySession.get(session.id);
          let imageUrl: string | null = null;
          if (image?.storage_path) {
            const signed = await supabase.storage.from("skin-images").createSignedUrl(image.storage_path, 60);
            if (!signed.error) imageUrl = signed.data.signedUrl;
          }
          return { id: session.id, createdAt: session.created_at, status: session.status, imageUrl, quality: image?.quality_status ? imageQualityLabel(image.quality_status) : null, level: levelBySession.get(session.id) ?? null };
        }));
      }
    }
  }
  return <AppShell><div className="page-heading-row"><div><span className="page-eyebrow">SKINTRACK · LONGITUDINAL OBSERVATIONS</span><h1>Track over time</h1><p>Compare saved image submissions side by side. Visual differences are descriptive and are not a diagnosis or validated improvement score.</p></div></div><TrackingView connected={configured} initialCompare={query.compare ?? ""} loadError={loadError} observations={observations} /></AppShell>;
}

function imageQualityLabel(status: string) { return status === "passed" ? "Basic technical checks passed" : status === "rejected" ? "Insufficient technical quality" : "Pending"; }
