"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowRight, Camera, Clock3, Eye, ShieldCheck, TrendingUp } from "lucide-react";

export type TrackingObservation = { id: string; createdAt: string; status: string; imageUrl: string | null; quality: string | null; level: string | null };

export function TrackingView({ observations, connected, loadError, initialCompare }: { observations: TrackingObservation[]; connected: boolean; loadError: boolean; initialCompare: string }) {
  const initialLatest = observations.findIndex((item) => item.id === initialCompare);
  const [latestId, setLatestId] = useState(initialLatest >= 0 ? observations[initialLatest].id : observations[0]?.id ?? "");
  const [previousId, setPreviousId] = useState(() => {
    const latest = initialLatest >= 0 ? initialLatest : 0;
    return observations[latest + 1]?.id ?? "";
  });
  const latest = useMemo(() => observations.find((item) => item.id === latestId) ?? null, [observations, latestId]);
  const previous = useMemo(() => observations.find((item) => item.id === previousId) ?? null, [observations, previousId]);
  const comparisonReady = Boolean(previous && latest && previous.id !== latest.id);

  if (!connected) return <div className="empty-state"><span className="empty-icon"><TrendingUp size={20} /></span><h3>SkinTrack is not connected yet.</h3><p>Connect authentication, the private image-storage pipeline, and a validated screening model before observations can be saved or compared.</p><Link className="button button-outline button-small" href="/privacy">Review the privacy setup <ArrowRight size={13} /></Link></div>;
  if (loadError) return <div className="alert error" role="alert">Tracking observations could not be loaded. Please try again later.</div>;

  return <div className="tracking-stack">
    <div className="tracking-disclaimer"><ShieldCheck size={15} /><span>Comparisons describe differences between submitted images. They do not establish diagnosis, worsening, or improvement.</span></div>
    {observations.length === 0 ? <div className="empty-state"><span className="empty-icon"><Camera size={20} /></span><h3>Your timeline will appear here.</h3><p>No saved observations were found. The current scan preview does not store images, so nothing is added to this timeline.</p><Link className="button button-primary button-small" href="/scan">Open scan workflow <ArrowRight size={13} /></Link></div> : <>
      <section className="panel tracking-comparison">
        <div className="panel-heading"><h2>Image comparison</h2><span>Choose two saved observations</span></div>
        <div className="panel-body">
          <div className="compare-selects">
            <label className="field"><span>Previous</span><select onChange={(event) => setPreviousId(event.target.value)} value={previousId}><option value="">Choose previous</option>{observations.map((item) => <option key={item.id} value={item.id}>{formatDate(item.createdAt)}</option>)}</select></label>
            <span className="versus">VS</span>
            <label className="field"><span>Latest</span><select onChange={(event) => setLatestId(event.target.value)} value={latestId}>{observations.map((item) => <option key={item.id} value={item.id}>{formatDate(item.createdAt)}</option>)}</select></label>
          </div>
          {comparisonReady ? <>
            <div className="compare-grid">{[previous, latest].map((item, index) => item && <article className="comparison-image" key={`${index}-${item.id}`}><div className="comparison-image-heading"><strong>{index === 0 ? "Previous" : "Latest"}</strong><span>{formatDate(item.createdAt)}</span></div>{item.imageUrl ? <><a aria-label="Open full-size private image in a new tab" className="comparison-image-open" href={item.imageUrl} rel="noreferrer" target="_blank"><Eye size={13} /> Open full image</a><Image alt={`${index === 0 ? "Previous" : "Latest"} skin observation`} fill sizes="(max-width: 620px) 100vw, 45vw" src={item.imageUrl} unoptimized /></> : <div className="comparison-no-image"><Camera size={20} /><span>No private image is available for this observation.</span></div>}</article>)}</div>
            <div className="comparison-metadata">{[previous, latest].map((item, index) => item && <div key={item.id}><span>{index === 0 ? "Previous" : "Latest"} technical quality</span><strong>{item.quality ?? "Not available"}</strong><span>Model output</span><strong>{item.level ?? "Not available"}</strong></div>)}</div>
          </> : <div className="comparison-empty"><Camera size={18} /><strong>Choose two different saved observations.</strong><span>At least two records are needed for a side-by-side comparison. No visual change score is calculated.</span></div>}
        </div>
      </section>
      <section className="panel"><div className="panel-heading"><h2>Observation timeline</h2><span>{observations.length} saved record{observations.length === 1 ? "" : "s"}</span></div><div className="timeline-list">{observations.map((item) => <article className="timeline-item" key={item.id}><span className="timeline-marker"><Clock3 size={13} /></span><div className="timeline-date">{formatDate(item.createdAt)}</div><div className="timeline-description"><strong>{item.level ?? "Screening output unavailable"}</strong><span>{item.quality ? `Image technical status · ${item.quality}` : "Image quality status not available"}</span></div><Link aria-label="View screening record" className="icon-plain" href={`/scan/result/${item.id}`}><ArrowRight size={15} /></Link></article>)}</div></section>
    </>}
  </div>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)); }
