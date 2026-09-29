import type { Metadata } from "next";
import { ScanWizard } from "@/components/scan-wizard";

export const metadata: Metadata = { title: "New skin scan" };

export default function ScanPage() { return <ScanWizard />; }
