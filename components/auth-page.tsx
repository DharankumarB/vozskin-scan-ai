import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

type AuthMode = "login" | "signup" | "forgot" | "reset";

export function AuthPage({ mode }: { mode: AuthMode }) {
  return <Suspense fallback={<div className="auth-loading" role="status"><span className="loading-spinner" />Preparing secure sign-in…</div>}><AuthForm mode={mode} /></Suspense>;
}
