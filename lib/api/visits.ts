import { supabase } from "../supabaseClient";
import type { Visit, VisitStatus, VisitLog } from "../types";

export async function getVisit(id: string) {
  const { data, error } = await supabase
    .from("visits")
    .select("*, visitor:visitor_profiles(*), resident:profiles!visits_resident_id_fkey(*), room:rooms(*), invitation:invitations(*)")
    .eq("id", id)
    .single();
  return { data: data as Visit | null, error };
}

export async function getVisitByCode(visitCode: string) {
  const { data, error } = await supabase
    .from("visits")
    .select("*, visitor:visitor_profiles(*), resident:profiles!visits_resident_id_fkey(*), room:rooms(*), invitation:invitations(*)")
    .eq("visit_code", visitCode)
    .single();
  return { data: data as Visit | null, error };
}

export async function getVisitorVisits(visitorId: string) {
  const { data, error } = await supabase
    .from("visits")
    .select("*, resident:profiles!visits_resident_id_fkey(full_name), room:rooms(room_number, block)")
    .eq("visitor_id", visitorId)
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as Visit[], error };
}

export async function getResidentVisits(residentId: string) {
  const { data, error } = await supabase
    .from("visits")
    .select("*, visitor:visitor_profiles(full_name, photo_url), room:rooms(room_number, block)")
    .eq("resident_id", residentId)
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as Visit[], error };
}

export async function getActiveVisitsByResident(residentId: string) {
  const { data, error } = await supabase
    .from("visits")
    .select("*, visitor:visitor_profiles(full_name, photo_url), room:rooms(room_number, block)")
    .eq("resident_id", residentId)
    .in("status", ["authorized", "checked_in"])
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as Visit[], error };
}

export async function createVisit(visit: {
  invitation_id: string;
  visitor_id: string;
  resident_id: string;
  room_id: string;
  status?: VisitStatus;
}) {
  const { data, error } = await supabase
    .from("visits")
    .insert({ ...visit, status: visit.status ?? "authorized" })
    .select()
    .single();
  return { data: data as Visit | null, error };
}

export async function checkInVisit(id: string) {
  const { data, error } = await supabase
    .from("visits")
    .update({ status: "checked_in", checked_in_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return { data: data as Visit | null, error };
}

export async function checkOutVisit(id: string) {
  const { data, error } = await supabase
    .from("visits")
    .update({ status: "checked_out", checked_out_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return { data: data as Visit | null, error };
}

export async function denyVisit(id: string) {
  const { data, error } = await supabase
    .from("visits")
    .update({ status: "denied", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return { data: data as Visit | null, error };
}

export async function getCurrentlyInside() {
  const { data, error } = await supabase
    .from("visits")
    .select("*, visitor:visitor_profiles(full_name, photo_url), resident:profiles!visits_resident_id_fkey(full_name), room:rooms(room_number, block)")
    .eq("status", "checked_in")
    .order("checked_in_at", { ascending: false });
  return { data: (data ?? []) as Visit[], error };
}

export async function getTodaysVisits() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("visits")
    .select("*, visitor:visitor_profiles(full_name), resident:profiles!visits_resident_id_fkey(full_name), room:rooms(room_number, block)")
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as Visit[], error };
}

export async function getAllVisits(filters?: {
  status?: VisitStatus;
  resident_id?: string;
  visitor_id?: string;
}) {
  let q = supabase
    .from("visits")
    .select("*, visitor:visitor_profiles(full_name), resident:profiles!visits_resident_id_fkey(full_name), room:rooms(room_number, block)")
    .order("created_at", { ascending: false });
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.resident_id) q = q.eq("resident_id", filters.resident_id);
  if (filters?.visitor_id) q = q.eq("visitor_id", filters.visitor_id);
  const { data, error } = await q;
  return { data: (data ?? []) as Visit[], error };
}

export async function addVisitLog(log: { visit_id: string; action: string; performed_by?: string; notes?: string }) {
  const { data, error } = await supabase
    .from("visit_logs")
    .insert(log)
    .select()
    .single();
  return { data: data as VisitLog | null, error };
}

export async function getVisitLogs(visitId: string) {
  const { data, error } = await supabase
    .from("visit_logs")
    .select("*, performer:profiles(full_name)")
    .eq("visit_id", visitId)
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as VisitLog[], error };
}
