import { supabase } from "../supabaseClient";
import type { Verification } from "../types";

export async function getVerification(id: string) {
  const { data, error } = await supabase
    .from("verifications")
    .select("*, visit:visits(*, visitor:visitor_profiles(*), resident:profiles!visits_resident_id_fkey(*), room:rooms(*)), verifier:profiles!verifications_verified_by_fkey(full_name)")
    .eq("id", id)
    .single();
  return { data: data as Verification | null, error };
}

export async function getPendingVerifications() {
  const { data, error } = await supabase
    .from("verifications")
    .select("*, visit:visits(visit_code, visitor:visitor_profiles(full_name, photo_url), resident:profiles!visits_resident_id_fkey(full_name), room:rooms(room_number, block)), verifier:profiles!verifications_verified_by_fkey(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as Verification[], error };
}

export async function createVerification(verification: {
  visit_id: string;
  visitor_id: string;
  verified_by?: string;
  method?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from("verifications")
    .insert({ ...verification, status: "pending" })
    .select()
    .single();
  return { data: data as Verification | null, error };
}

export async function updateVerificationStatus(id: string, status: "verified" | "rejected", verifiedBy: string, notes?: string) {
  const { data, error } = await supabase
    .from("verifications")
    .update({ status, verified_by: verifiedBy, notes })
    .eq("id", id)
    .select()
    .single();
  return { data: data as Verification | null, error };
}
