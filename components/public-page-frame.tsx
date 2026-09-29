import { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function PublicPageFrame({ children }: { children: ReactNode }) {
  return <div className="page-backdrop"><SiteHeader /><main>{children}</main><SiteFooter /></div>;
}
