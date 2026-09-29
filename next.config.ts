import type { NextConfig } from "next";

function supabaseCspSources() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) return { connect: "https://*.supabase.co wss://*.supabase.co", images: "https://*.supabase.co" };
  try {
    const origin = new URL(value).origin;
    const websocketOrigin = origin.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
    return { connect: `${origin} ${websocketOrigin}`, images: origin };
  } catch {
    return { connect: "https://*.supabase.co wss://*.supabase.co", images: "https://*.supabase.co" };
  }
}

const cspSources = supabaseCspSources();
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${cspSources.images}`,
  `connect-src 'self' ${cspSources.connect}`,
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
        ],
      },
    ];
  },
};

export default nextConfig;
