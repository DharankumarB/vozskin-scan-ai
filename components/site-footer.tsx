import Link from "next/link";
import { Brand } from "@/components/brand";

export function SiteFooter() {
  return <>
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Brand />
            <p className="footer-copy">Thoughtful technology for understanding skin patterns — designed around transparency, privacy, and professional care.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col"><strong>Explore</strong><Link href="/how-it-works">How it works</Link><Link href="/about">About VozLook</Link><Link href="/clinic">Clinic workspace</Link></div>
            <div className="footer-col"><strong>Your privacy</strong><Link href="/privacy">Privacy principles</Link><Link href="/terms">Terms of use</Link><Link href="/profile">Data controls</Link></div>
            <div className="footer-col"><strong>Get started</strong><Link href="/signup">Create account</Link><Link href="/login">Sign in</Link><Link href="/scan">Start a scan</Link></div>
          </div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} VozLook Studios. All rights reserved.</span><span>Built with care. Designed for responsible screening.</span></div>
      </div>
    </footer>
    <div className="disclaimer-strip">VozSkin Scan AI provides AI-assisted screening information only and does not provide a medical diagnosis.</div>
  </>;
}
