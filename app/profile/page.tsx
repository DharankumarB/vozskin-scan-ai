import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ProfileSettings } from "@/components/profile-settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Profile & privacy" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const connected = isSupabaseConfigured();
  const supabase = await createSupabaseServerClient();
  let displayName = "";
  let email = "";
  let recordCount: number | null = null;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      email = user.email ?? "";
      const [profile, count] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("screening_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      displayName = profile.data?.display_name ?? "";
      if (!count.error) recordCount = count.count ?? 0;
    }
  }
  return <AppShell><div className="page-heading-row"><div><span className="page-eyebrow">ACCOUNT & PRIVACY</span><h1>Profile & settings</h1><p>Manage your account, privacy choices, and screening data controls.</p></div></div><ProfileSettings connected={connected} deleteAccountAvailable={Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)} displayName={displayName} email={email} recordCount={recordCount} /></AppShell>;
}
