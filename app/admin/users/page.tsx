import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { AdminUserManagement } from "@/components/admin-user-management";
import { getVerifiedAdminContext } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "User management" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const context = await getVerifiedAdminContext();
  if (!context) return <main className="admin-denied"><strong>403 Unauthorized</strong><p>This account is not authorized for user management.</p></main>;
  return <AppShell accessRole="admin"><div className="page-heading-row"><div><span className="page-eyebrow">VOZLOOK STUDIOS · ADMIN</span><h1>User management</h1><p>Search account information, review role and creation date, and deactivate accounts. Medical images are not shown here.</p></div></div><AdminUserManagement /></AppShell>;
}
