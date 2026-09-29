import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getVerifiedAdminContext } from "@/lib/auth/admin";
import { loadAdminOverview } from "@/lib/admin/overview";

export const metadata: Metadata = { title: "Admin dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const context = await getVerifiedAdminContext();
  if (!context) return <main className="admin-denied"><strong>403 Unauthorized</strong><p>This account is not authorized for the VozSkin admin workspace.</p></main>;
  const overview = context.admin ? await loadAdminOverview(context.admin) : null;
  return <AppShell accessRole="admin"><div className="page-heading-row"><div><span className="page-eyebrow">VOZLOOK STUDIOS · ADMIN</span><h1>Platform overview</h1><p>Monitor real operational data without exposing identifiable medical information.</p></div></div><AdminDashboard configured={Boolean(context.admin)} overview={overview} /></AppShell>;
}
