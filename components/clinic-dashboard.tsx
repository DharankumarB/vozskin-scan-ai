"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileText, Search, ShieldCheck, UsersRound } from "lucide-react";

export type ClinicPatient = { id: string; name: string | null; createdAt: string; sessions: { id: string; createdAt: string; status: string; level: string | null }[] };

export function ClinicDashboard({ patients, connected, loadError }: { patients: ClinicPatient[]; connected: boolean; loadError: boolean }) {
  const [query, setQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const filtered = useMemo(() => patients.filter((patient) => `${patient.name ?? ""} ${patient.id}`.toLowerCase().includes(query.toLowerCase().trim())), [patients, query]);
  const totalSessions = patients.reduce((total, patient) => total + patient.sessions.length, 0);
  if (!connected) return <div className="empty-state panel"><span className="empty-icon"><UsersRound size={20} /></span><h3>Clinic access is not connected.</h3><p>Configure Supabase roles and patient authorization before records can be shared with a clinic workspace.</p></div>;
  if (loadError) return <div className="alert error" role="alert">Authorized clinic records could not be loaded. Please try again later.</div>;

  return <>
    <div className="admin-stat-grid clinic-stat-grid"><div className="admin-stat"><span>Authorized patients</span><strong>{patients.length}</strong><small>Explicit access records only</small></div><div className="admin-stat"><span>Screening sessions</span><strong>{totalSessions}</strong><small>Limited to authorized accounts</small></div><div className="admin-stat"><span>Clinical records</span><strong>Private</strong><small>No public images</small></div><div className="admin-stat"><span>Model status</span><strong>Not connected</strong><small>No new predictions</small></div></div>
    {patients.length === 0 ? <div className="empty-state panel clinic-empty"><span className="empty-icon"><ShieldCheck size={20} /></span><h3>No patient records are shared with this account.</h3><p>Records appear only after an authorized patient or administrator grants access. Clinic role alone does not grant visibility.</p></div> : <div className="clinic-grid">
      <section className="panel"><div className="panel-heading"><h2>Authorized patients</h2><span>{filtered.length} of {patients.length}</span></div><div className="panel-body"><label className="search-field"><Search aria-hidden="true" size={14} /><span className="sr-only">Search authorized patients</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Search patients" value={query} /></label><div className="clinic-patient-list">{filtered.map((patient) => <button aria-pressed={selectedPatient === patient.id} className={`clinic-patient-row${selectedPatient === patient.id ? " active" : ""}`} key={patient.id} onClick={() => setSelectedPatient(patient.id)} type="button"><span className="avatar">{patient.name?.trim().slice(0, 1).toUpperCase() || "P"}</span><span className="clinic-patient-info"><strong>{patient.name || "Authorized patient"}</strong><small>Added {formatDate(patient.createdAt)}</small></span><span className="clinic-count">{patient.sessions.length} sessions</span></button>)}</div></div></section>
      <section className="panel"><div className="panel-heading"><h2>Screening history</h2><span>Permission-scoped</span></div><div className="panel-body">{!selectedPatient ? <div className="clinic-select-prompt"><UsersRound size={21} /><span>Select an authorized patient to view available session history.</span></div> : (() => {
        const patient = patients.find((item) => item.id === selectedPatient);
        if (!patient) return null;
        return <><div className="clinic-detail-header"><div className="avatar">{patient.name?.trim().slice(0, 1).toUpperCase() || "P"}</div><div><strong>{patient.name || "Authorized patient"}</strong><span>Patient ID · {patient.id.slice(0, 8).toUpperCase()}</span></div></div>{patient.sessions.length ? <div className="clinic-session-list">{patient.sessions.map((session) => <article className="clinic-session-row" key={session.id}><div><strong>{session.level ?? "No model output available"}</strong><span>{formatDate(session.createdAt)} · {session.status}</span></div><Link aria-label="Open authorized screening record" className="icon-plain" href={`/scan/result/${session.id}`}><FileText size={14} /></Link></article>)}</div> : <div className="empty-state"><span className="empty-icon"><FileText size={18} /></span><h3>No screening sessions</h3><p>No screening history is available for this patient.</p></div>}{patient.sessions.length > 0 && <div className="clinic-detail-note"><ShieldCheck size={13} /> Results remain screening information only. No diagnosis is provided.</div>}</>;
      })()}</div></section>
    </div>}
    <div className="clinic-footnote"><ShieldCheck size={13} /> Patient access is enforced by Supabase row-level security, not only by this interface.</div>
  </>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)); }
