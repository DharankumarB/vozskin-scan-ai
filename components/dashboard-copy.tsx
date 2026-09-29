"use client";

import Link from "next/link";
import { ArrowRight, ScanLine } from "lucide-react";
import { useLocale } from "@/components/language-provider";

export function DashboardGreeting({ name }: { name: string | null }) {
  const { t } = useLocale();
  return <div className="dashboard-hello"><div className="greeting">{t("dashboard.greeting")}{name ? `, ${name}` : ""}</div><h1>{t("dashboard.title")}</h1><p>A private space for your screening observations and progress.</p></div>;
}

export function DashboardMetric({ icon, labelKey, value, caption }: { icon: React.ReactNode; labelKey: string; value: string; caption: string }) {
  const { t } = useLocale();
  return <article className="metric-card"><div className="metric-top"><span>{t(labelKey)}</span><span className="metric-icon">{icon}</span></div><div className="metric-value">{value}</div><div className="metric-caption">{caption}</div></article>;
}

export function DashboardEmpty() {
  const { t } = useLocale();
  return <div className="empty-state"><span className="empty-icon"><ScanLine size={21} /></span><h3>{t("dashboard.empty")}</h3><p>{t("dashboard.emptyBody")}</p><Link className="button button-outline button-small" href="/scan">Start your first scan <ArrowRight size={13} /></Link></div>;
}
