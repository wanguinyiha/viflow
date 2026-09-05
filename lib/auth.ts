import { supabase } from "./supabaseClient";

export type UserRole = "visitor" | "resident" | "guard" | "admin";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface VisitorProfile {
  id: string;
  user_id: string;
  id_document_url: string | null;
  id_verified: boolean;
  photo_url: string | null;
  photo_verified: boolean;
  vehicle_plate: string | null;
  created_at: string;
  updated_at: string;
}

export async function getCurrentUser() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile as Profile | null;
}

export async function getVisitorProfile(userId: string) {
  const { data } = await supabase
    .from("visitor_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data as VisitorProfile | null;
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: UserRole
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

export async function signOut() {
  await supabase.auth.signOut();
}
