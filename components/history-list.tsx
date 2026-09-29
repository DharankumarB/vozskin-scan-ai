"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowRight, CalendarDays, Eye, Search, Trash2 } from "lucide-react";

export type HistoryRecord = {
  id: string;
  status: string;
  createdAt: string;
  level: string | null;
  imageQuality: string | null;
  reportId: string | null;
};

export function HistoryList({ records, connected, loadError }: { records: HistoryRecord[]; connected: boolean; loadError: boolean }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("all");
  const [range, setRange] = useState("all");
  const [rangeCutoff, setRangeCutoff] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => records.filter((record) => {
    if (level !== "all" && (record.level ?? "unavailable").toLowerCase() !== level) return false;
    if (rangeCutoff !== null && new Date(record.createdAt).getTime() < rangeCutoff) return false;
    const haystack = `${record.id} ${record.status} ${record.level ?? ""}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  }), [records, query, level, rangeCutoff]);

  async function deleteRecord(id: string) {
    if (!window.confirm("Delete this screening record and its associated private image/report files? This action cannot be undone.")) return;
    setDeleting(id);
    setMessage("");
    try {
      const response = await fetch(`/api/sessions/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" } });
      if (!response.ok) throw new Error("delete failed");
      window.location.reload();
    } catch {
      setMessage("We couldn’t delete this record. Its information was not intentionally removed from your account; try again or contact support.");
    } finally { setDeleting(null); }
  }

  if (!connected) return <div className="empty-state"><span className="empty-icon"><CalendarDays size={20} /></span><h3>History is not connected yet.</h3><p>Connect Supabase authentication, database tables, and private storage to save and review your own screening records.</p><Link className="button button-outline button-small" href="/privacy">Review privacy setup <ArrowRight size={13} /></Link></div>;
  if (loadError) return <div className="alert error" role="alert">Your screening history could not be loaded. Please try again later.</div>;
  if (records.length === 0) return <div className="empty-state"><span className="empty-icon"><CalendarDays size={20} /></span><h3>No previous scans</h3><p>Your skin journey starts here. Complete a screening when a validated model is connected to begin saving observations.</p><Link className="button button-primary button-small" href="/scan">Start a new scan <ArrowRight size={13} /></Link></div>;

  return <>
    <div className="toolbar"><label className="search-field"><Search aria-hidden="true" size={14} /><span className="sr-only">Search history</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Search by ID or status" value={query} /></label><select aria-label="Filter by screening level" className="filter-select" onChange={(event) => setLevel(event.target.value)} value={level}><option value="all">All levels</option><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="insufficient_information">Insufficient information</option><option value="unavailable">Unavailable</option></select><select aria-label="Filter by date" className="filter-select" onChange={(event) => { const value = event.target.value; setRange(value); setRangeCutoff(value === "all" ? null : Date.now() - Number(value) * 86400000); }} value={range}><option value="all">Any date</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option></select></div>
    {message && <div className="alert error" role="alert" style={{ marginBottom: 12 }}>{message}</div>}
    {filtered.length === 0 ? <div className="panel empty-filter"><strong>No records match these filters.</strong><span>Change or clear your search and filters.</span></div> : <>
      <div className="table-wrap history-desktop"><table className="data-table"><thead><tr><th>Date</th><th>Screening level</th><th>Image quality</th><th>Status</th><th>Record</th><th>Actions</th></tr></thead><tbody>{filtered.map((record) => <tr key={record.id}><td>{formatDate(record.createdAt)}</td><td>{record.level ?? "Not available"}</td><td>{record.imageQuality ?? "Not available"}</td><td><Status record={record} /></td><td className="muted-cell">{shortId(record.id)}</td><td><div className="row-actions"><Link aria-label={`View screening ${shortId(record.id)}`} className="icon-plain" href={`/scan/result/${record.id}`}><Eye size={14} /></Link><Link aria-label={`Compare screening ${shortId(record.id)}`} className="icon-plain" href={`/tracking?compare=${record.id}`}><ArrowRight size={14} /></Link>{record.reportId && <a aria-label="Download report" className="icon-plain" href={`/api/reports/${record.reportId}/download`}><ArrowDownToLine size={14} /></a>}<button aria-label="Delete screening record" className="icon-plain danger-icon" disabled={deleting === record.id} onClick={() => void deleteRecord(record.id)} type="button"><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>
      <div className="history-mobile-list">{filtered.map((record) => <article className="history-mobile-card" key={record.id}><div className="history-mobile-top"><span>{formatDate(record.createdAt)}</span><Status record={record} /></div><div className="history-mobile-level">{record.level ?? "Screening unavailable"}</div><div className="history-mobile-meta">Image quality: {record.imageQuality ?? "Not available"} · ID {shortId(record.id)}</div><div className="history-mobile-actions"><Link className="button button-outline button-small" href={`/scan/result/${record.id}`}><Eye size={13} /> View</Link><Link className="button button-quiet button-small" href={`/tracking?compare=${record.id}`}>Compare</Link>{record.reportId && <a className="button button-quiet button-small" href={`/api/reports/${record.reportId}/download`}><ArrowDownToLine size={13} /> PDF</a>}<button className="button button-quiet button-small danger-button" disabled={deleting === record.id} onClick={() => void deleteRecord(record.id)} type="button"><Trash2 size={13} /> Delete</button></div></article>)}</div>
    </>}
  </>;
}

function Status({ record }: { record: HistoryRecord }) {
  const status = record.status.replaceAll("_", " ");
  const connected = status === "completed";
  return <span className={`status-pill${connected ? " connected" : " available"}`}><span aria-hidden="true">●</span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function shortId(id: string) { return id.slice(0, 8).toUpperCase(); }
function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
