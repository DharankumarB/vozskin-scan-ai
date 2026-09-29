"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Database, Download, FileText, LockKeyhole, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { LanguageSelector } from "@/components/language-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ProfileSettings({ displayName, email, connected, deleteAccountAvailable, recordCount }: { displayName: string; email: string; connected: boolean; deleteAccountAvailable: boolean; recordCount: number | null }) {
  const router = useRouter();
  const [tab, setTab] = useState("profile");
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setFeedback(""); setError("");
    if (!connected) { setError("Supabase is not configured. Profile changes are not stored in preview mode."); setSaving(false); return; }
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("unauthorized");
      const { error: updateError } = await supabase.from("profiles").update({ display_name: name.trim() || null }).eq("user_id", user.id);
      if (updateError) throw updateError;
      setFeedback("Profile updated.");
      router.refresh();
    } catch { setError("We couldn’t save your profile. Try again later."); }
    finally { setSaving(false); }
  }

  async function deleteImages() {
    if (!window.confirm("Permanently delete all uploaded skin image files? Screening records and questionnaire information will remain.")) return;
    setError(""); setFeedback("");
    try {
      const response = await fetch("/api/account/delete-images", { method: "POST", headers: { "Content-Type": "application/json" } });
      if (!response.ok) throw new Error("delete failed");
      const result = await response.json() as { deleted: number };
      setFeedback(`${result.deleted} image record${result.deleted === 1 ? "" : "s"} removed. Screening records and questionnaire information were retained.`);
      router.refresh();
    } catch { setError("Image deletion could not be completed. Please try again or contact support."); }
  }

  async function deleteAccount() {
    if (confirmation !== "DELETE MY ACCOUNT") return;
    setDeleting(true); setError("");
    try {
      const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation }) });
      if (!response.ok) throw new Error("delete failed");
      router.push("/login?deleted=1"); router.refresh();
    } catch { setError("Account deletion could not be completed. No success was reported. Contact support or try again later."); setDeleting(false); }
  }

  return <div className="profile-grid">
    <nav aria-label="Profile settings" className="profile-nav">
      <button aria-current={tab === "profile" ? "page" : undefined} className={`profile-tab${tab === "profile" ? " active" : ""}`} onClick={() => { setTab("profile"); setError(""); setFeedback(""); }} type="button"><UserRound size={14} />Profile</button>
      <button aria-current={tab === "privacy" ? "page" : undefined} className={`profile-tab${tab === "privacy" ? " active" : ""}`} onClick={() => { setTab("privacy"); setError(""); setFeedback(""); }} type="button"><LockKeyhole size={14} />Privacy</button>
      <button aria-current={tab === "data" ? "page" : undefined} className={`profile-tab${tab === "data" ? " active" : ""}`} onClick={() => { setTab("data"); setError(""); setFeedback(""); }} type="button"><Database size={14} />Data & consent</button>
    </nav>
    <section className="settings-card">
      {tab === "profile" && <><h2>Profile details</h2><p>Manage the account information associated with your VozSkin workspace.</p>{!connected && <div className="alert" style={{ marginBottom: 14 }}>Supabase is not connected. Profile values are not stored in preview mode.</div>}<form className="profile-form" onSubmit={saveProfile}><div className="field"><label htmlFor="profile-name">Display name</label><input id="profile-name" maxLength={80} onChange={(event) => setName(event.target.value)} placeholder="Your display name" value={name} /></div><div className="field"><label htmlFor="profile-email">Email address</label><input id="profile-email" readOnly value={email || "Not available"} /><span className="field-hint">Email changes are managed by your authentication provider.</span></div><div className="field"><label>Language</label><LanguageSelector /></div><div className="profile-form-actions"><button className="button button-primary button-small" disabled={saving} type="submit">{saving ? "Saving…" : "Save profile"}</button></div></form></>}
      {tab === "privacy" && <><h2>Privacy & control</h2><p>Access and deletion controls for personal screening information.</p><div className="settings-row"><div><strong>AI screening consent</strong><span>Consent is requested before the local scan preview. It is not persisted in this build.</span></div><span className="status-pill available">Preview only</span></div><div className="settings-row"><div><strong>Uploaded skin images</strong><span>Remove image files from your private image bucket. This keeps related records and answers.</span></div><button className="button button-outline button-small" disabled={!connected} onClick={() => void deleteImages()} type="button"><Trash2 size={13} /> Delete images</button></div><div className="settings-row"><div><strong>Screening records</strong><span>Delete individual sessions and their associated files from your history.</span></div><Link className="button button-quiet button-small" href="/history"><FileText size={13} /> View history</Link></div><div className="settings-row"><div><strong>Account</strong><span>Delete your account and associated database records and private image/report files.</span></div><button className="button button-quiet button-small danger-button" disabled={!connected || !deleteAccountAvailable} onClick={() => setDeleteModal(true)} type="button"><Trash2 size={13} /> Delete account</button></div>{!deleteAccountAvailable && connected && <div className="field-hint">Account deletion is not enabled until the server-side service-role key is configured.</div>}</>}
      {tab === "data" && <><h2>Your data</h2><p>Export stored account metadata and review how records are handled.</p><div className="data-summary-grid"><div><span>Saved screening sessions</span><strong>{recordCount === null ? "Unavailable" : recordCount}</strong></div><div><span>Screening model</span><strong>Not connected</strong></div><div><span>AI assistant</span><strong>Not connected</strong></div></div><div className="settings-row"><div><strong>Download your data</strong><span>Export stored profile, screening metadata, questionnaire answers, and results as JSON. Image/PDF bytes are not included.</span></div><a className={`button button-outline button-small${connected ? "" : " disabled-link"}`} href={connected ? "/api/account/export" : undefined} onClick={connected ? undefined : (event) => event.preventDefault()}><Download size={13} /> Export data</a></div><div className="privacy-callout-mini"><ShieldCheck size={16} /><span>Images are intended for private storage. No image or questionnaire data is uploaded in the current preview scan flow.</span></div><Link className="text-link" href="/privacy" style={{ fontSize: 10 }}>Read privacy principles ↗</Link></>}
      {error && <div className="alert error" role="alert" style={{ marginTop: 14 }}>{error}</div>}{feedback && <div className="alert success" role="status" style={{ marginTop: 14 }}>{feedback}</div>}
    </section>
    {deleteModal && <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget && !deleting) setDeleteModal(false); }}><section aria-labelledby="delete-account-title" aria-modal="true" className="confirm-dialog" role="dialog"><span className="confirm-icon"><Trash2 size={18} /></span><h2 id="delete-account-title">Delete your account?</h2><p>This permanently deletes your account and associated screening records, database metadata, private image files, and reports. This cannot be undone.</p><div className="field"><label htmlFor="delete-confirmation">Type <strong>DELETE MY ACCOUNT</strong> to confirm</label><input autoComplete="off" id="delete-confirmation" onChange={(event) => setConfirmation(event.target.value)} value={confirmation} /></div><div className="confirm-actions"><button className="button button-outline button-small" disabled={deleting} onClick={() => setDeleteModal(false)} type="button">Cancel</button><button className="button button-danger button-small" disabled={deleting || confirmation !== "DELETE MY ACCOUNT"} onClick={() => void deleteAccount()} type="button">{deleting ? "Deleting…" : "Delete account"}</button></div></section></div>}
  </div>;
}
