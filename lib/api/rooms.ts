import { supabase } from "../supabaseClient";
import type { Room } from "../types";

export async function getRoom(id: string) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*, resident:resident_profiles!resident_profiles_room_id_fkey(id, user_id, profile:profiles!resident_profiles_user_id_fkey(full_name, email))")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function getResidentRoom(userId: string) {
  const { data, error } = await supabase
    .from("resident_profiles")
    .select("*, room:rooms(*)")
    .eq("user_id", userId)
    .single();
  return { data, error };
}

export async function getAllRooms() {
  const { data, error } = await supabase
    .from("rooms")
    .select("*, resident:resident_profiles!resident_profiles_room_id_fkey(id, user_id, profile:profiles!resident_profiles_user_id_fkey(full_name, email))")
    .order("block")
    .order("room_number");
  return { data: (data ?? []) as Room[], error };
}

export async function createRoom(room: { room_number: string; block: string; floor?: number }) {
  const { data, error } = await supabase
    .from("rooms")
    .insert({ ...room, is_occupied: false })
    .select()
    .single();
  return { data: data as Room | null, error };
}

export async function updateRoom(id: string, updates: Partial<Room>) {
  const { data, error } = await supabase
    .from("rooms")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data: data as Room | null, error };
}
