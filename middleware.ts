import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes - no auth required
  const publicRoutes = [
    "/",
    "/about",
    "/how-it-works",
    "/help",
    "/privacy",
    "/terms",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/forbidden",
    "/invite",
    "/register",
    "/pass",
  ];

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Allow API routes, static files, images
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) {
    return response;
  }

  // If on a public route, allow access
  if (isPublicRoute) {
    // If logged in and trying to access login/signup, redirect to dashboard
    if (user && (pathname === "/login" || pathname === "/signup")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role ?? "visitor";
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }
    return response;
  }

  // Protected routes - require auth
  if (!user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Get user role for dashboard redirect
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as string) ?? "visitor";

  // If accessing /dashboard without role, redirect to role-specific dashboard
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }

  // Role-based access control for dashboard sections
  if (pathname.startsWith("/dashboard/")) {
    const pathRole = pathname.split("/")[2]; // admin, resident, guard, visitor

    // If trying to access wrong role's dashboard, redirect to own
    if (pathRole !== role) {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|_next/data|favicon.ico).*)"],
};
