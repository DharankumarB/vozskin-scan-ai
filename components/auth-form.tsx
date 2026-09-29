"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Brand } from "@/components/brand";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type AuthMode = "login" | "signup" | "forgot" | "reset";

const content = {
  login: { title: "Welcome back", subtitle: "Sign in to your private VozSkin workspace.", submit: "Sign in", alternate: "New to VozSkin?", alternateAction: "Create an account" },
  signup: { title: "Create your account", subtitle: "Start a private space for your skin observations.", submit: "Create account", alternate: "Already have an account?", alternateAction: "Sign in" },
  forgot: { title: "Reset your password", subtitle: "We’ll send a password reset link to your email.", submit: "Send reset link", alternate: "Remembered your password?", alternateAction: "Return to sign in" },
  reset: { title: "Choose a new password", subtitle: "Create a new password for your VozSkin account.", submit: "Update password", alternate: "Need another reset link?", alternateAction: "Request one" },
} as const;

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const ready = isSupabaseConfigured();
  const nextPath = params.get("next");
  const safeNext = nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!ready) {
      setFeedback({ type: "error", text: "Authentication is not configured yet. Add the Supabase project URL and anon key to your server environment before creating an account." });
      return;
    }
    if ((mode === "signup" || mode === "reset") && password.length < 10) {
      setFeedback({ type: "error", text: "Choose a password with at least 10 characters." });
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.push(safeNext);
        router.refresh();
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: displayName.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}` },
        });
        if (error) throw error;
        setFeedback({ type: "success", text: "Account request received. Check your inbox for a confirmation link before signing in." });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
        if (error) throw error;
        setFeedback({ type: "success", text: "If an account exists for that address, a password reset link will be sent." });
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setFeedback({ type: "success", text: "Your password was updated. You can now sign in with the new password." });
        setTimeout(() => { router.push("/login"); router.refresh(); }, 1200);
      }
    } catch {
      setFeedback({ type: "error", text: "We couldn’t complete that request. Check your details and try again, or contact your workspace administrator." });
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    if (!ready) {
      setFeedback({ type: "error", text: "Google sign-in is unavailable until Supabase authentication is configured." });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}` } });
      if (error) throw error;
    } catch {
      setFeedback({ type: "error", text: "Google sign-in could not be started. Check the Supabase Google provider configuration and try again." });
      setBusy(false);
    }
  }

  const active = content[mode];
  const alternateHref = mode === "signup" ? "/login" : mode === "reset" ? "/forgot-password" : mode === "forgot" ? "/login" : "/signup";
  const submitText = busy ? "Please wait…" : active.submit;

  return <main className="auth-page">
    <aside className="auth-aside">
      <Brand />
      <div className="auth-aside-copy">
        <div className="eyebrow"><span className="eyebrow-dot" /> A MORE THOUGHTFUL WAY TO TRACK</div>
        <h1>Understand your skin with care.</h1>
        <p>Your private space for guided screening workflows, organized observations, and responsible AI-assisted information.</p>
      </div>
      <div className="auth-aside-foot">VozSkin Scan AI · A VozLook Studios product</div>
    </aside>
    <section className="auth-main">
      <div className="auth-card">
        <div className="auth-mobile-brand"><Brand /></div>
        <div className="auth-card-icon"><LockKeyhole size={17} /></div>
        <h2>{active.title}</h2>
        <p className="auth-subtitle">{active.subtitle}</p>
        {!ready && <div className="alert" role="status">Authentication is not connected in this environment. Add Supabase credentials to enable account access. No account or session is being simulated.</div>}
        {feedback && <div className={`alert ${feedback.type}`} role="status" style={{ marginBottom: 15 }}>{feedback.text}</div>}
        <form className="auth-form" onSubmit={submit}>
          {mode === "signup" && <div className="field"><label htmlFor="display-name">Display name <span className="field-hint">(optional)</span></label><input autoComplete="name" id="display-name" maxLength={80} onChange={(event) => setDisplayName(event.target.value)} placeholder="How should we address you?" value={displayName} /></div>}
          {mode !== "reset" && <div className="field"><label htmlFor="email">Email address</label><input autoComplete="email" id="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} /></div>}
          {mode !== "forgot" && <div className="field"><label htmlFor="password">{mode === "reset" ? "New password" : "Password"}</label><div className="password-control"><input autoComplete={mode === "signup" || mode === "reset" ? "new-password" : "current-password"} id="password" minLength={mode === "signup" || mode === "reset" ? 10 : 1} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "signup" || mode === "reset" ? "At least 10 characters" : "Enter your password"} required type={showPassword ? "text" : "password"} value={password} /><button aria-label={showPassword ? "Hide password" : "Show password"} className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} type="button">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></div>}
          {mode === "login" && <div className="auth-inline"><span /> <Link className="text-link" href="/forgot-password">Forgot password?</Link></div>}
          {mode === "signup" && <label className="consent-check"><input required type="checkbox" /><span>I agree to the <Link className="text-link" href="/terms">Terms of use</Link> and have read the <Link className="text-link" href="/privacy">Privacy principles</Link>. This is not a medical service.</span></label>}
          <button className="button button-primary button-wide" disabled={busy} type="submit">{submitText}</button>
        </form>
        {(mode === "login" || mode === "signup") && <>
          <div className="auth-separator">or</div>
          <button className="button button-outline button-wide" disabled={busy} onClick={() => void signInWithGoogle()} type="button"><GoogleMark /> Continue with Google</button>
        </>}
        <p className="auth-meta">{active.alternate} <Link className="text-link" href={alternateHref}>{active.alternateAction}</Link></p>
        <p className="auth-legal">AI-assisted screening information only. Not a medical diagnosis.</p>
      </div>
    </section>
  </main>;
}

function GoogleMark() {
  return <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16"><path fill="#4285F4" d="M21.6 12.23c0-.72-.06-1.42-.18-2.1H12v3.97h5.38a4.6 4.6 0 0 1-2 3.02v2.47h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.47c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.58-4.13H3.08v2.55A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.42 13.94A6 6 0 0 1 6.1 12c0-.67.12-1.32.32-1.94V7.5H3.08A10 10 0 0 0 2 12c0 1.62.39 3.16 1.08 4.5l3.34-2.56Z"/><path fill="#EA4335" d="M12 5.93c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.98 14.7 2 12 2a10 10 0 0 0-8.92 5.5l3.34 2.56C7.2 7.69 9.4 5.93 12 5.93Z"/></svg>;
}
