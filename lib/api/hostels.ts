import { supabase } from "../supabaseClient";
import type { Hostel } from "../types";

export async function getHostel(id: string) {
  const { data, error } = await supabase
    .from("hostels")
    .select("*")
    .eq("id", id)
    .single();
  return { data: data as Hostel | null, error };
}

export async function getAllHostels() {
  const { data, error } = await supabase
    .from("hostels")
    .select("*")
    .order("name");
  return { data: (data ?? []) as Hostel[], error };
}

export async function createHostel(hostel: { name: string; address?: string; total_rooms?: number }) {
  const { data, error } = await supabase
    .from("hostels")
    .insert(hostel)
    .select()
    .single();
  return { data: data as Hostel | null, error };
}

export async function updateHostel(id: string, updates: Partial<Hostel>) {
  const { data, error } = await supabase
    .from("hostels")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return { data: data as Hostel | null, error };
}

export async function deleteHostel(id: string) {
  const { error } = await supabase
    .from("hostels")
    .delete()
    .eq("id", id);
  return { error };
}
