import "server-only";

import { isRequestAdmin } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getVerifiedAdminContext() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || !(await isRequestAdmin(user.id, user.email))) return null;
  const admin = createSupabaseAdminClient();
  return { user, admin };
}
