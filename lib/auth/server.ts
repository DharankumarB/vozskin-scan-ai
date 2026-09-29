import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppRole = "user" | "admin" | "clinic";
export type AuthContext = { user: User; role: AppRole };

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile } = await supabase.from("profiles").select("role, display_name").eq("user_id", user.id).maybeSingle();
  const configuredAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isConfiguredAdmin = Boolean(configuredAdmin && user.email?.toLowerCase() === configuredAdmin);
  const metadataRole = user.app_metadata?.role;
  const role: AppRole = isConfiguredAdmin || profile?.role === "admin" || metadataRole === "admin"
    ? "admin"
    : profile?.role === "clinic" || metadataRole === "clinic" ? "clinic" : "user";
  return { user, role };
}

export async function isRequestAdmin(userId: string, email?: string | null) {
  const configuredAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (configuredAdmin && email?.toLowerCase() === configuredAdmin) return true;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const { data, error } = await supabase.from("profiles").select("role").eq("user_id", userId).maybeSingle();
  return !error && (data?.role === "admin" || false);
}
