import { supabase } from "../supabaseClient";

export async function getAllPolicies() {
  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .order("key");
  return { data: data ?? [], error };
}

export async function updatePolicy(key: string, value: unknown) {
  const { data, error } = await supabase
    .from("policies")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key)
    .select()
    .single();
  return { data, error };
}
