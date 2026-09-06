import { supabase } from "../supabaseClient";
import type { Vehicle } from "../types";

export async function getVisitorVehicles(visitorId: string) {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("visitor_id", visitorId)
    .eq("is_active", true)
    .order("registration_number");
  return { data: (data ?? []) as Vehicle[], error };
}

export async function getAllVehicles() {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*, visitor:profiles!vehicles_visitor_id_fkey(full_name, email)")
    .order("registration_number");
  return { data: (data ?? []) as Vehicle[], error };
}

export async function addVehicle(vehicle: {
  visitor_id: string;
  registration_number: string;
  make?: string;
  model?: string;
  color?: string;
}) {
  const { data, error } = await supabase
    .from("vehicles")
    .insert(vehicle)
    .select()
    .single();
  return { data: data as Vehicle | null, error };
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>) {
  const { data, error } = await supabase
    .from("vehicles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return { data: data as Vehicle | null, error };
}

export async function removeVehicle(id: string) {
  const { error } = await supabase
    .from("vehicles")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error };
}

export async function getVehicleByRegistration(registrationNumber: string) {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*, visitor:profiles!vehicles_visitor_id_fkey(full_name, email)")
    .eq("registration_number", registrationNumber)
    .eq("is_active", true)
    .single();
  return { data: data as Vehicle | null, error };
}
