"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured. Add the public Supabase URL and anon key to your environment.");
  return createBrowserClient(config.url, config.anonKey);
}
