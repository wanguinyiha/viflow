import { supabase } from "../supabaseClient";
import type { FavouriteVisitor } from "../types";

export async function getFavouriteVisitors(residentId: string) {
  const { data, error } = await supabase
    .from("favourite_visitors")
    .select("*, visitor:visitor_profiles!favourite_visitors_visitor_id_fkey(id, full_name, email, phone, photo_url)")
    .eq("resident_id", residentId)
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as FavouriteVisitor[], error };
}

export async function addFavourite(residentId: string, visitorId: string, label?: string) {
  const { data, error } = await supabase
    .from("favourite_visitors")
    .insert({ resident_id: residentId, visitor_id: visitorId, label })
    .select()
    .single();
  return { data: data as FavouriteVisitor | null, error };
}

export async function removeFavourite(id: string) {
  const { error } = await supabase
    .from("favourite_visitors")
    .delete()
    .eq("id", id);
  return { error };
}

export async function isFavourite(residentId: string, visitorId: string) {
  const { data } = await supabase
    .from("favourite_visitors")
    .select("id")
    .eq("resident_id", residentId)
    .eq("visitor_id", visitorId)
    .maybeSingle();
  return !!data;
}
