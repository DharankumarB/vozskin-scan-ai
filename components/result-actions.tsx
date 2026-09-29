"use client";

import { Download, Printer } from "lucide-react";

export function ResultActions({ reportUrl }: { reportUrl: string | null }) {
  return reportUrl ? <a className="button button-outline button-small" href={reportUrl}><Download size={14} /> Download report</a> : <button className="button button-outline button-small" onClick={() => window.print()} type="button"><Printer size={14} /> Print / save as PDF</button>;
}
