"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Bell, FileText, LayoutDashboard, LogOut, MessageCircle, ScanLine, ShieldCheck, UserRound, UsersRound, History, Menu, X, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { Brand } from "@/components/brand";
import { LanguageSelector, useLocale } from "@/components/language-provider";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const mainNavigation = [
  { href: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { href: "/scan", key: "nav.scan", icon: ScanLine, primary: true },
  { href: "/history", key: "nav.history", icon: History },
  { href: "/tracking", key: "nav.tracking", icon: Activity },
  { href: "/assistant", key: "nav.assistant", icon: MessageCircle },
  { href: "/reports", key: "nav.reports", icon: FileText },
  { href: "/profile", key: "nav.profile", icon: UserRound },
];

const mobileNavigation = [
  { href: "/dashboard", key: "nav.home", icon: LayoutDashboard },
  { href: "/scan", key: "nav.scan", icon: ScanLine, primary: true },
  { href: "/history", key: "nav.history", icon: History },
  { href: "/assistant", key: "nav.assistant", icon: MessageCircle },
  { href: "/profile", key: "nav.profile", icon: UserRound },
];

function currentTitle(path: string, t: (key: string) => string) {
  if (path.startsWith("/admin")) return "Admin console";
  if (path.startsWith("/clinic")) return "Clinic workspace";
  return mainNavigation.find((item) => path === item.href || path.startsWith(`${item.href}/`)) ? t(mainNavigation.find((item) => path === item.href || path.startsWith(`${item.href}/`))!.key) : "VozSkin workspace";
}

export function AppShell({ children, accessRole }: { children: React.ReactNode; accessRole?: "user" | "admin" | "clinic" }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string>(accessRole ?? "user");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getUser().then(async ({ data }) => {
      setEmail(data.user?.email ?? null);
      if (data.user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", data.user.id).maybeSingle();
        setRole((current) => current === "admin" ? current : profile?.role ?? current);
      }
    });
  }, []);

  async function signOut() {
    if (isSupabaseConfigured()) {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    }
    router.push("/login");
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const initials = email ? email.slice(0, 1).toUpperCase() : "V";

  return <div className="app-frame">
    <aside aria-label="Workspace navigation" className="app-sidebar">
      <div className="sidebar-brand"><Brand /></div>
      <div className="sidebar-label">Workspace</div>
      <nav className="sidebar-nav">
        {mainNavigation.map(({ href, key, icon: Icon, primary }) => <Link aria-current={isActive(href) ? "page" : undefined} className={`sidebar-link${isActive(href) ? " active" : ""}${primary ? " primary-link" : ""}`} href={href} key={href}><Icon size={16} /><span>{t(key)}</span></Link>)}
      </nav>
      {(role === "admin" || role === "clinic" || pathname.startsWith("/admin") || pathname.startsWith("/clinic")) && <>
        <div className="sidebar-label">Organization</div>
        <nav className="sidebar-nav">
          {role === "clinic" && <Link className={`sidebar-link${pathname.startsWith("/clinic") ? " active" : ""}`} href="/clinic"><UsersRound size={16} /><span>Clinic workspace</span></Link>}
          {role === "admin" && <><Link className={`sidebar-link${pathname === "/admin" ? " active" : ""}`} href="/admin"><ShieldCheck size={16} /><span>Admin console</span></Link><Link className={`sidebar-link${pathname.startsWith("/admin/users") ? " active" : ""}`} href="/admin/users"><UsersRound size={16} /><span>User management</span></Link></>}
        </nav>
      </>}
      <div className="sidebar-bottom">
        <div className="sidebar-support"><strong>Private by design</strong><p>Your screening data is personal. Keep control of what you share and review the limitations before using a screening tool.</p><Link className="text-link" href="/privacy" style={{ fontSize: 9 }}>Privacy principles ↗</Link></div>
        <div className="sidebar-footer"><LockKeyhole size={12} /> VozLook Studios</div>
      </div>
    </aside>

    <main className="app-main">
      <header className="app-topbar">
        <div className="topbar-crumb">Workspace <span style={{ color: "#575864", paddingInline: 6 }}>/</span> {currentTitle(pathname, t)}</div>
        <div className="topbar-actions">
          <LanguageSelector compact />
          <div style={{ position: "relative" }}>
            <button aria-expanded={noticeOpen} aria-label="Notifications" className="icon-plain" onClick={() => setNoticeOpen((value) => !value)} type="button"><Bell size={16} /></button>
            {noticeOpen && <div className="notice-popover"><strong>No notifications</strong><span>We’ll show screening and report updates here.</span></div>}
          </div>
          <details className="profile-menu">
            <summary aria-label="Open profile menu"><span className="avatar">{initials}</span><span className="topbar-name">{email ?? "My account"}</span></summary>
            <div className="profile-menu-panel"><Link href="/profile"><UserRound size={14} /> Profile & privacy</Link><button onClick={() => void signOut()} type="button"><LogOut size={14} /> {t("common.signOut")}</button></div>
          </details>
          <button aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"} className="mobile-menu-trigger" onClick={() => setMenuOpen((value) => !value)} type="button">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </header>
      {menuOpen && <nav aria-label="Mobile workspace navigation" className="app-mobile-menu">{mainNavigation.map(({ href, key, icon: Icon }) => <Link href={href} key={href} onClick={() => setMenuOpen(false)}><Icon size={15} />{t(key)}</Link>)}{role === "admin" && <><Link href="/admin"><ShieldCheck size={15} />Admin console</Link><Link href="/admin/users"><UsersRound size={15} />User management</Link></>}{role === "clinic" && <Link href="/clinic"><UsersRound size={15} />Clinic workspace</Link>}<button onClick={() => void signOut()} type="button"><LogOut size={15} />{t("common.signOut")}</button></nav>}
      <div className="workspace-content">{children}</div>
      <nav aria-label="Mobile bottom navigation" className="mobile-bottom-nav">
        {mobileNavigation.map(({ href, key, icon: Icon, primary }) => <Link aria-current={isActive(href) ? "page" : undefined} className={`mobile-bottom-link${isActive(href) ? " active" : ""}${primary ? " scan" : ""}`} href={href} key={href}><Icon size={primary ? 20 : 17} /><span>{t(key)}</span></Link>)}
      </nav>
    </main>
  </div>;
}
