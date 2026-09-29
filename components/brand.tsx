import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link aria-label="VozSkin Scan AI home" className="brand" href="/">
      <span aria-hidden="true" className="brand-mark">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M5 5.5 9.1 18 12 10l2.9 8L19 5.5" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3.8 8.7h2.1M18.1 8.7h2.1" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" opacity=".65" />
        </svg>
      </span>
      <span className="brand-copy">
        <span className="brand-name">VOZSKIN</span>
        {!compact && <span className="brand-caption">Scan AI · by VozLook</span>}
      </span>
    </Link>
  );
}
