import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { UserRole } from "./types";

export type AuthOk = { ok: true; userId: string; role: UserRole };
export type AuthError = { ok: false; response: NextResponse };
export type AuthResult = AuthOk | AuthError;

function deny(status: number, error: string): AuthError {
  return { ok: false, response: NextResponse.json({ error }, { status }) };
}

/**
 * Route-handler guard. Resolves the caller from the Supabase auth cookies and
 * their role from `profiles`. Fails closed: no session -> 401, missing role
 * (or a role not in `roles`) -> 403, missing server config -> 500.
 */
export async function requireUser(roles?: UserRole[]): Promise<AuthResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return deny(500, "Server configuration error");
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return deny(401, "Authentication required");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = (profile?.role as UserRole | null) ?? "visitor";

    if (roles && !roles.includes(role)) {
      return deny(403, "Insufficient permissions");
    }

    return { ok: true, userId: user.id, role };
  } catch {
    return deny(500, "Server configuration error");
  }
}
