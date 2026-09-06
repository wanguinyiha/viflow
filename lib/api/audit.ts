import { supabase } from "../supabaseClient";

export async function getAllAuditLogs(filters?: { action?: string; user_id?: string; entity_type?: string }) {
  let q = supabase
    .from("audit_logs")
    .select("*, user:profiles(full_name, email)")
    .order("created_at", { ascending: false });
  if (filters?.action) q = q.eq("action", filters.action);
  if (filters?.user_id) q = q.eq("user_id", filters.user_id);
  if (filters?.entity_type) q = q.eq("entity_type", filters.entity_type);
  const { data, error } = await q;
  return { data: data ?? [], error };
}

export async function createAuditLog(log: {
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
}) {
  const { data, error } = await supabase
    .from("audit_logs")
    .insert(log)
    .select()
    .single();
  return { data, error };
}
