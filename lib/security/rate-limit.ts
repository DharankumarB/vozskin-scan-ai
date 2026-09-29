type WindowState = { count: number; resetAt: number };
const windows = new Map<string, WindowState>();

/** Best-effort per-instance limiter for local use. Production must use a shared store. */
export function allowRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (current.count >= limit) return { allowed: false, remaining: 0, resetAt: current.resetAt };
  current.count += 1;
  return { allowed: true, remaining: limit - current.count, resetAt: current.resetAt };
}

export function isSameOriginMutation(request: Request, requestOrigin: string) {
  const candidateOrigins = new Set([requestOrigin]);
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? request.headers.get("host")?.trim();
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? new URL(request.url).protocol.replace(":", "");
  if (host && protocol) candidateOrigins.add(`${protocol}://${host}`);

  const origin = request.headers.get("origin");
  if (origin) return candidateOrigins.has(origin);
  const referer = request.headers.get("referer");
  if (!referer) return false;
  try { return candidateOrigins.has(new URL(referer).origin); } catch { return false; }
}
