import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LocaleProvider } from "@/components/language-provider";

export const metadata: Metadata = {
  title: {
    default: "VozSkin Scan AI — Scan. Understand. Track.",
    template: "%s | VozSkin Scan AI",
  },
  description: "AI-assisted skin screening, explainable insights, and longitudinal monitoring designed around transparency, privacy, and professional care.",
  applicationName: "VozSkin Scan AI",
  keywords: ["skin screening", "responsible AI", "skin tracking", "VozLook Studios"],
  openGraph: {
    title: "VozSkin Scan AI — Scan. Understand. Track.",
    description: "Understand visual and symptom patterns with responsible AI-assisted screening.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090a0e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><LocaleProvider>{children}</LocaleProvider></body></html>;
}
