import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const protectedRoots = ["/dashboard", "/scan", "/history", "/tracking", "/assistant", "/reports", "/profile", "/clinic", "/admin"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = protectedRoots.some((root) => path === root || path.startsWith(`${root}/`));
  if (!isProtected) return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Local preview routes expose no user data while auth is unconfigured. In configured
  // deployments, every protected route requires a verified Supabase session.
  if (!url || !anonKey) {
    if (path === "/admin" || path.startsWith("/admin/") || path === "/clinic" || path.startsWith("/clinic/")) {
      return new NextResponse("403 Unauthorized", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  const needsAdmin = path === "/admin" || path.startsWith("/admin/");
  const needsClinic = path === "/clinic" || path.startsWith("/clinic/");
  if (!needsAdmin && !needsClinic) return response;

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const emailIsAdmin = Boolean(adminEmail && user.email?.toLowerCase() === adminEmail);
  const metadataRole = user.app_metadata?.role;
  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  const isAdmin = emailIsAdmin || profile?.role === "admin" || metadataRole === "admin";
  const isClinic = profile?.role === "clinic" || metadataRole === "clinic";

  if ((needsAdmin && !isAdmin) || (needsClinic && !isClinic && !isAdmin)) {
    return new NextResponse("403 Unauthorized", {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/scan/:path*",
    "/history/:path*",
    "/tracking/:path*",
    "/assistant/:path*",
    "/reports/:path*",
    "/profile/:path*",
    "/clinic/:path*",
    "/admin/:path*",
    "/api/screening/:path*",
    "/api/admin/:path*",
  ],
};
