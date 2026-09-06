import { supabase } from "../supabaseClient";
import type { Profile, VisitorProfile, UserRole } from "../types";

export async function getProfile(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  return { data: data as Profile | null, error };
}

export async function getProfileByEmail(email: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();
  return { data: data as Profile | null, error };
}

export async function updateProfile(id: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return { data: data as Profile | null, error };
}

export async function getProfilesByRole(role: UserRole) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", role)
    .order("full_name");
  return { data: (data ?? []) as Profile[], error };
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as Profile[], error };
}

export async function getVisitorProfile(userId: string) {
  const { data, error } = await supabase
    .from("visitor_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return { data: data as VisitorProfile | null, error };
}

export async function upsertVisitorProfile(profile: Partial<VisitorProfile> & { user_id: string }) {
  const { data, error } = await supabase
    .from("visitor_profiles")
    .upsert(profile, { onConflict: "user_id" })
    .select()
    .single();
  return { data: data as VisitorProfile | null, error };
}

export async function searchProfiles(query: string, role?: UserRole) {
  let q = supabase
    .from("profiles")
    .select("*")
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .order("full_name");
  if (role) q = q.eq("role", role);
  const { data, error } = await q;
  return { data: (data ?? []) as Profile[], error };
}
