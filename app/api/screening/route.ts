import { NextRequest, NextResponse } from "next/server";
import { getScreeningModel } from "@/lib/ai/registry";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ScreeningOutputSchema, ScreeningRequestSchema } from "@/lib/screening/schema";
import { allowRateLimit, isSameOriginMutation } from "@/lib/security/rate-limit";

const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });

export async function POST(request: NextRequest) {
  if (!isSameOriginMutation(request, request.nextUrl.origin)) return json({ error: "REQUEST_ORIGIN_INVALID" }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) return json({ error: "UNSUPPORTED_CONTENT_TYPE" }, 415);
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 12_000) return json({ error: "REQUEST_TOO_LARGE" }, 413);

  const config = getSupabaseConfig();
  if (!config) return json({ error: "AUTH_NOT_CONFIGURED", message: "Screening service is not configured." }, 503);
  const supabase = await createSupabaseServerClient();
  if (!supabase) return json({ error: "AUTH_NOT_CONFIGURED", message: "Screening service is not configured." }, 503);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "UNAUTHORIZED" }, 401);

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = allowRateLimit(`screening:${user.id}:${forwardedFor}`, 6, 60_000);
  if (!limit.allowed) return json({ error: "RATE_LIMITED", message: "Please wait before trying again." }, 429);

  let input: unknown;
  try { input = await request.json(); } catch { return json({ error: "INVALID_JSON" }, 400); }
  const parsed = ScreeningRequestSchema.safeParse(input);
  if (!parsed.success) return json({ error: "INVALID_SCREENING_INPUT", message: "Review the image metadata and questionnaire fields." }, 400);

  // No image bytes are sent in this request, and no session is persisted here.
  // This build intentionally blocks before any model prediction because the
  // validated model adapter and private image-storage pipeline are not connected.
  const model = getScreeningModel();
  if (!model) return json({ error: "AI_MODEL_NOT_CONNECTED", message: "No validated screening model is connected. No prediction was generated and no screening record was created." }, 503);

  try {
    const output = await model.predict(parsed.data);
    const validated = ScreeningOutputSchema.safeParse(output);
    if (!validated.success) return json({ error: "INVALID_MODEL_OUTPUT" }, 502);
    // Persisting a prediction requires the private image/session pipeline to be
    // connected as well; never return an untraceable result to the browser.
    return json({ error: "SCREENING_PERSISTENCE_NOT_CONFIGURED" }, 503);
  } catch {
    return json({ error: "SCREENING_UNAVAILABLE", message: "The screening service could not complete the request." }, 503);
  }
}
