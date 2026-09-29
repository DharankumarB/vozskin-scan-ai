"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Brand } from "@/components/brand";

const links = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/#responsible-ai", label: "Responsible AI" },
  { href: "/#for-clinics", label: "For clinics" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Brand />
        <nav aria-label="Main navigation" className="site-nav">
          {links.map((link) => <Link href={link.href} key={link.label}>{link.label}</Link>)}
        </nav>
        <div className="header-actions">
          <Link className="header-login" href="/login">Sign in</Link>
          <Link className="button button-primary button-small header-cta" href="/scan">Start a scan <span aria-hidden="true">↗</span></Link>
          <button aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} className="menu-toggle" onClick={() => setOpen((value) => !value)} type="button">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open && <nav aria-label="Mobile navigation" className="mobile-menu">
        {links.map((link) => <Link href={link.href} key={link.label} onClick={() => setOpen(false)}>{link.label}</Link>)}
        <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>
        <Link className="button button-primary" href="/scan" onClick={() => setOpen(false)}>Start a scan <span aria-hidden="true">↗</span></Link>
      </nav>}
    </header>
  );
}
