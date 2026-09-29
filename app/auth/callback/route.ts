import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

function safePath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const code = request.nextUrl.searchParams.get("code");
  const next = safePath(request.nextUrl.searchParams.get("next"));
  if (!url || !anonKey || !code) return NextResponse.redirect(new URL("/login?auth=unavailable", request.url));

  const response = NextResponse.redirect(new URL(next, request.url));
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?auth=failed", request.url));
  return response;
}
