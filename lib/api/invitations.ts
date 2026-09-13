import { supabase } from "../supabaseClient";
import type { Invitation, InvitationStatus } from "../types";

export function generateVisitCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "VF-";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function getInvitation(id: string) {
  const { data, error } = await supabase
    .from("invitations")
    .select("*, resident:profiles!invitations_resident_id_fkey(*), room:rooms(*), visitor:visitor_profiles(*)")
    .eq("id", id)
    .single();
  return { data: data as Invitation | null, error };
}

export async function getInvitationByCode(visitCode: string) {
  const { data, error } = await supabase
    .from("invitations")
    .select("*, resident:profiles!invitations_resident_id_fkey(*), room:rooms(*), visitor:visitor_profiles(*)")
    .eq("visit_code", visitCode)
    .single();
  return { data: data as Invitation | null, error };
}

export async function getResidentInvitations(residentId: string) {
  const { data, error } = await supabase
    .from("invitations")
    .select("*, visitor:visitor_profiles(*), room:rooms(*)")
    .eq("resident_id", residentId)
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as Invitation[], error };
}

export async function getVisitorInvitations(visitorEmail: string) {
  const { data, error } = await supabase
    .from("invitations")
    .select("*, resident:profiles!invitations_resident_id_fkey(*), room:rooms(*)")
    .eq("visitor_email", visitorEmail)
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as Invitation[], error };
}

export async function createInvitation(invitation: {
  resident_id: string;
  visitor_email: string;
  visitor_name?: string;
  visitor_id?: string;
  room_id: string;
  visit_start: string;
  visit_end?: string;
  reason?: string;
  vehicle_registration?: string;
}) {
  // Convert date-only or datetime-local values to proper TIMESTAMPTZ format
  const toTSTZ = (val: string | undefined): string | undefined => {
    if (!val) return undefined;
    // Already has timezone info
    if (val.includes("Z") || val.includes("+") || (val.includes("-", 10))) return val;
    // Date-only value (YYYY-MM-DD) - set to start of day in local timezone
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const tzOffset = (() => {
        const offset = -new Date().getTimezoneOffset();
        const sign = offset >= 0 ? "+" : "-";
        const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
        const minutes = String(Math.abs(offset) % 60).padStart(2, "0");
        return `${sign}${hours}:${minutes}`;
      })();
      return val + "T00:00:00" + tzOffset;
    }
    // Datetime-local value (YYYY-MM-DDTHH:MM)
    const tzOffset = (() => {
      const offset = -new Date().getTimezoneOffset();
      const sign = offset >= 0 ? "+" : "-";
      const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
      const minutes = String(Math.abs(offset) % 60).padStart(2, "0");
      return `${sign}${hours}:${minutes}`;
    })();
    return val + ":00" + tzOffset;
  };

  const enriched = {
    ...invitation,
    visit_code: generateVisitCode(),
    visit_start: toTSTZ(invitation.visit_start) ?? invitation.visit_start,
    visit_end: toTSTZ(invitation.visit_end),
  };

  const { data, error } = await supabase
    .from("invitations")
    .insert(enriched)
    .select()
    .single();
  return { data: data as Invitation | null, error };
}

export async function updateInvitationStatus(id: string, status: InvitationStatus) {
  const { data, error } = await supabase
    .from("invitations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return { data: data as Invitation | null, error };
}

export async function cancelInvitation(id: string) {
  return updateInvitationStatus(id, "cancelled");
}

export async function acceptInvitation(id: string, visitorId: string) {
  const { data, error } = await supabase
    .from("invitations")
    .update({ status: "accepted", visitor_id: visitorId, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return { data: data as Invitation | null, error };
}

export async function getActiveInvitationCount(residentId: string) {
  const { count } = await supabase
    .from("invitations")
    .select("*", { count: "exact", head: true })
    .eq("resident_id", residentId)
    .in("status", ["pending", "accepted"]);
  return count ?? 0;
}

export async function getActiveVisitCount(residentId: string) {
  const { count } = await supabase
    .from("visits")
    .select("*", { count: "exact", head: true })
    .eq("resident_id", residentId)
    .in("status", ["authorized", "checked_in"]);
  return count ?? 0;
}

export async function getAllInvitations(filters?: {
  status?: InvitationStatus;
  resident_id?: string;
  visitor_email?: string;
}) {
  let q = supabase
    .from("invitations")
    .select("*, resident:profiles!invitations_resident_id_fkey(full_name, email), room:rooms(room_number, block)")
    .order("created_at", { ascending: false });
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.resident_id) q = q.eq("resident_id", filters.resident_id);
  if (filters?.visitor_email) q = q.eq("visitor_email", filters.visitor_email);
  const { data, error } = await q;
  return { data: (data ?? []) as Invitation[], error };
}
