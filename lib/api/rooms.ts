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

export async function getAvailableRooms() {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("is_occupied", false)
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

export async function assignRoomToResident(roomId: string, userId: string) {
  // Check if room is already occupied
  const { data: existing } = await supabase
    .from("resident_profiles")
    .select("id")
    .eq("room_id", roomId)
    .single();
  if (existing) return { error: { message: "Room is already occupied" } };

  // Check if user already has a room
  const { data: existingUser } = await supabase
    .from("resident_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();
  if (existingUser) return { error: { message: "User already has a room assigned" } };

  // Create resident profile
  const { data, error } = await supabase
    .from("resident_profiles")
    .insert({ user_id: userId, room_id: roomId, status: "active" })
    .select()
    .single();
  if (error) return { error };

  // Mark room as occupied
  await supabase.from("rooms").update({ is_occupied: true }).eq("id", roomId);

  return { data, error: null };
}
