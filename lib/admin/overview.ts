import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminOverview = {
  totalUsers: number | null;
  activeUsers: number | null;
  totalScans: number | null;
  completedScreenings: number | null;
  failedImageChecks: number | null;
  reportsGenerated: number | null;
  aiRequests: number | null;
  systemErrors: number | null;
  scanTrend: { day: string; total: number }[] | null;
  registrationTrend: { day: string; total: number }[] | null;
  screeningDistribution: { level: string; total: number }[] | null;
  qualityDistribution: { status: string; total: number }[] | null;
  uncertaintyDistribution: { uncertainty: string; total: number }[] | null;
  imageQualityRejectionRate: number | null;
};

export async function loadAdminOverview(admin: SupabaseClient): Promise<AdminOverview> {
  const [users, scans, results, rejected, reports, daily, distribution, quality, uncertainty, totalImages] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("screening_sessions").select("id", { count: "exact", head: true }),
    admin.from("screening_results").select("id", { count: "exact", head: true }),
    admin.from("skin_images").select("id", { count: "exact", head: true }).eq("quality_status", "rejected"),
    admin.from("reports").select("id", { count: "exact", head: true }),
    admin.from("admin_daily_analytics").select("metric,day,total").order("day", { ascending: true }),
    admin.from("admin_screening_distribution").select("level,total"),
    admin.from("admin_image_quality_summary").select("status,total"),
    admin.from("admin_uncertainty_distribution").select("uncertainty,total"),
    admin.from("skin_images").select("id", { count: "exact", head: true }),
  ]);

  const scansSeries = daily.error ? null : (daily.data ?? []).filter((row) => row.metric === "scans").map((row) => ({ day: String(row.day), total: Number(row.total) }));
  const registrationsSeries = daily.error ? null : (daily.data ?? []).filter((row) => row.metric === "registrations").map((row) => ({ day: String(row.day), total: Number(row.total) }));
  const totalRejected = rejected.count;
  const totalImageCount = totalImages.count;
  const rejectionRate = totalRejected !== null && totalImageCount !== null && totalImageCount > 0 ? totalRejected / totalImageCount : null;

  return {
    totalUsers: users.error ? null : users.count,
    activeUsers: null,
    totalScans: scans.error ? null : scans.count,
    completedScreenings: results.error ? null : results.count,
    failedImageChecks: rejected.error ? null : rejected.count,
    reportsGenerated: reports.error ? null : reports.count,
    aiRequests: null,
    systemErrors: null,
    scanTrend: scansSeries,
    registrationTrend: registrationsSeries,
    screeningDistribution: distribution.error ? null : (distribution.data ?? []).map((row) => ({ level: row.level, total: Number(row.total) })),
    qualityDistribution: quality.error ? null : (quality.data ?? []).map((row) => ({ status: row.status, total: Number(row.total) })),
    uncertaintyDistribution: uncertainty.error ? null : (uncertainty.data ?? []).map((row) => ({ uncertainty: row.uncertainty, total: Number(row.total) })),
    imageQualityRejectionRate: rejected.error || totalImages.error ? null : rejectionRate,
  };
}
