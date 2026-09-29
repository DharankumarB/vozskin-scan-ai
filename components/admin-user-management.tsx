"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, UserRound, UserX, UserCheck } from "lucide-react";

type ManagedUser = { id: string; email: string; displayName: string | null; role: string; createdAt: string; lastSignInAt: string | null; scanCount: number; deactivated: boolean };
type UsersResponse = { users: ManagedUser[]; page: number; perPage: number; hasMore: boolean };

export function AdminUserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(true);
  const [changingId, setChangingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (nextPage: number, nextSearch: string, nextRole: string) => {
    setBusy(true); setError("");
    try {
      const params = new URLSearchParams({ page: String(nextPage), search: nextSearch, role: nextRole });
      const response = await fetch(`/api/admin/users?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error("list unavailable");
      const result = await response.json() as UsersResponse;
      setUsers(result.users); setPage(result.page); setHasMore(result.hasMore);
    } catch { setError("User records are unavailable. Confirm admin authorization, Supabase service-role configuration, and database migrations."); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/admin/users?page=1&search=&role=all", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("list unavailable");
        return await response.json() as UsersResponse;
      })
      .then((result) => {
        if (!active) return;
        setUsers(result.users); setPage(result.page); setHasMore(result.hasMore); setBusy(false);
      })
      .catch(() => {
        if (!active) return;
        setError("User records are unavailable. Confirm admin authorization, Supabase service-role configuration, and database migrations."); setBusy(false);
      });
    return () => { active = false; };
  }, []);

  async function setActivation(user: ManagedUser) {
    const action = user.deactivated ? "activate" : "deactivate";
    const wording = user.deactivated ? "Reactivate this account?" : "Deactivate this account? The user will no longer be able to sign in until reactivated.";
    if (!window.confirm(wording)) return;
    setChangingId(user.id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      if (!response.ok) throw new Error("update failed");
      setNotice(`Account ${action === "deactivate" ? "deactivated" : "reactivated"}.`);
      await load(page, searchInput, role);
    } catch { setError("The account status could not be changed. The action was not reported as successful."); }
    finally { setChangingId(null); }
  }

  function changePage(nextPage: number) { void load(nextPage, searchInput, role); }

  return <>
    <section className="admin-users-toolbar"><form className="toolbar" onSubmit={(event) => { event.preventDefault(); void load(1, searchInput, role); }}><label className="search-field"><Search aria-hidden="true" size={14} /><span className="sr-only">Search name or email on this page</span><input onChange={(event) => setSearchInput(event.target.value)} placeholder="Search this user page by name or email" value={searchInput} /></label><select aria-label="Filter by role" className="filter-select" onChange={(event) => setRole(event.target.value)} value={role}><option value="all">All roles</option><option value="user">User</option><option value="clinic">Clinic</option><option value="admin">Admin</option></select><button className="button button-outline button-small" disabled={busy} type="submit">Search</button></form><div className="admin-page-note">Showing up to 100 accounts per page. Search filters the current page of Supabase Auth users.</div></section>
    {error && <div className="alert error" role="alert" style={{ marginBottom: 12 }}>{error}</div>}{notice && <div className="alert success" role="status" style={{ marginBottom: 12 }}>{notice}</div>}
    {busy ? <div className="loading-panel"><span className="loading-spinner" />Loading authorized user records…</div> : users.length === 0 ? <div className="empty-state panel"><span className="empty-icon"><UserRound size={20} /></span><h3>No users match this page and filter.</h3><p>Try clearing the search or reviewing another page. No sample users are displayed.</p></div> : <>
      <div className="table-wrap admin-users-desktop"><table className="data-table"><thead><tr><th>User</th><th>Role</th><th>Created</th><th>Last sign in</th><th>Scan count</th><th>Account</th><th>Action</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><strong>{user.displayName || "—"}</strong><span className="admin-email">{user.email}</span></td><td>{user.role}</td><td>{formatDate(user.createdAt)}</td><td className="muted-cell">{user.lastSignInAt ? formatDate(user.lastSignInAt) : "Not available"}</td><td>{user.scanCount}</td><td><span className={`status-pill${user.deactivated ? " available" : " connected"}`}>{user.deactivated ? "Deactivated" : "Active"}</span></td><td><button className={`button button-small ${user.deactivated ? "button-outline" : "button-quiet"}`} disabled={changingId === user.id || user.role === "admin"} onClick={() => void setActivation(user)} type="button">{user.deactivated ? <UserCheck size={13} /> : <UserX size={13} />}{user.deactivated ? "Reactivate" : "Deactivate"}</button></td></tr>)}</tbody></table></div>
      <div className="admin-users-mobile">{users.map((user) => <article className="admin-user-card" key={user.id}><div className="admin-user-card-top"><span className="avatar">{user.displayName?.slice(0, 1).toUpperCase() || user.email.slice(0, 1).toUpperCase() || "U"}</span><div><strong>{user.displayName || "Account"}</strong><span>{user.email}</span></div><span className={`status-pill${user.deactivated ? " available" : " connected"}`}>{user.deactivated ? "Inactive" : "Active"}</span></div><div className="admin-user-card-meta"><span>Role: {user.role}</span><span>Scans: {user.scanCount}</span><span>Joined: {formatDate(user.createdAt)}</span></div><button className="button button-outline button-small" disabled={changingId === user.id || user.role === "admin"} onClick={() => void setActivation(user)} type="button">{user.deactivated ? <UserCheck size={13} /> : <UserX size={13} />}{user.deactivated ? "Reactivate" : "Deactivate"}</button></article>)}</div>
      <div className="pagination"><button className="button button-quiet button-small" disabled={page <= 1 || busy} onClick={() => changePage(page - 1)} type="button">Previous</button><span>Page {page}</span><button className="button button-quiet button-small" disabled={!hasMore || busy} onClick={() => changePage(page + 1)} type="button">Next</button></div>
    </>}
  </>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)); }
