import { supabase } from "../supabaseClient";
import type { Room } from "../types";

export async function getRoom(id: string) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*, resident:profiles!rooms_resident_id_fkey(full_name, email)")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function getResidentRoom(residentId: string) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("resident_id", residentId)
    .single();
  return { data: data as Room | null, error };
}

export async function getAllRooms() {
  const { data, error } = await supabase
    .from("rooms")
    .select("*, resident:profiles!rooms_resident_id_fkey(full_name, email)")
    .order("block")
    .order("room_number");
  return { data: (data ?? []) as Room[], error };
}

export async function createRoom(room: { room_number: string; block: string; resident_id?: string }) {
  const { data, error } = await supabase
    .from("rooms")
    .insert(room)
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

export async function assignResident(roomId: string, residentId: string) {
  return updateRoom(roomId, { resident_id: residentId, is_occupied: true });
}

export async function removeResident(roomId: string) {
  return updateRoom(roomId, { resident_id: null, is_occupied: false });
}
