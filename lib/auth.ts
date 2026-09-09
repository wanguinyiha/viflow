import { createBrowserClient } from "@supabase/ssr";
import type { UserRole } from "./types";

export type { UserRole };

let client: ReturnType<typeof createBrowserClient> | null = null;

function getSupabase() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}

// Re-export as named supabase for components that import { supabase }
export const supabase = getSupabase();

export async function signUp(email: string, password: string, fullName: string, role: UserRole = "visitor") {
  return getSupabase().auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  });
}

export async function signIn(email: string, password: string) {
  return getSupabase().auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return getSupabase().auth.signOut();
}

export async function resetPassword(email: string) {
  return getSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password`,
  });
}

export async function updatePassword(newPassword: string) {
  return getSupabase().auth.updateUser({ password: newPassword });
}

export async function getCurrentUser() {
  const { data: { user }, error } = await getSupabase().auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getUserProfile(userId: string) {
  const { data } = await getSupabase()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}
