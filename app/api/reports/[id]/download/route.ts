import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return new NextResponse("Report service unavailable", { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return new NextResponse("Unauthorized", { status: 401 });
  const { data: report, error } = await supabase.from("reports").select("storage_path").eq("id", id).maybeSingle();
  if (error || !report?.storage_path) return new NextResponse("Not found", { status: 404 });
  let signedUrl: string | null = null;
  const ownSigned = await supabase.storage.from("reports").createSignedUrl(report.storage_path, 60, { download: true });
  if (!ownSigned.error) signedUrl = ownSigned.data.signedUrl;
  else {
    const admin = createSupabaseAdminClient();
    if (admin) {
      const authorizedSigned = await admin.storage.from("reports").createSignedUrl(report.storage_path, 60, { download: true });
      if (!authorizedSigned.error) signedUrl = authorizedSigned.data.signedUrl;
    }
  }
  if (!signedUrl) return new NextResponse("Report unavailable", { status: 503 });
  return NextResponse.redirect(signedUrl, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
