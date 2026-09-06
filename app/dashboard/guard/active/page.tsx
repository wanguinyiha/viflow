"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import type { Profile, Visit } from "@/lib/types";

export default function ActiveVisitorsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const { show, ToastComponent } = useToast();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);

      const { data } = await supabase
        .from("visits")
        .select("*, visitor:visitor_profiles(full_name, photo_url, vehicle_plate), resident:profiles!visits_resident_id_fkey(full_name), room:rooms(room_number, block)")
        .eq("status", "checked_in")
        .order("checked_in_at", { ascending: false });

      setVisits((data ?? []) as Visit[]);
      setLoading(false);
    }
    load();
  }, []);

  async function handleCheckOut(visitId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("visits").update({ status: "checked_out", checked_out_at: new Date().toISOString() }).eq("id", visitId);
    if (user) {
      await supabase.from("visit_logs").insert({ visit_id: visitId, action: "checked_out", performed_by: user.id });
    }
    setVisits((prev) => prev.filter((v) => v.id !== visitId));
    show("Visitor checked out.");
  }

  if (loading || !profile) {
    return (
      <DashboardShell role="guard" roleLabel="Guard" personName="Loading…">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="guard" roleLabel="Guard" personName={profile.full_name}>
      {ToastComponent}
      <PageHeader title="Active Visitors" description="Visitors currently inside the hostel." />

      <div className="mt-8">
        {visits.length === 0 ? (
          <EmptyState title="No visitors inside" description="No visitors are currently checked in." />
        ) : (
          <div className="overflow-hidden rounded-card border border-ink/15">
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/15 bg-parchment-dim text-sm text-ink/60">
                  <th className="px-4 py-3 font-medium">Visitor</th>
                  <th className="px-4 py-3 font-medium">Resident</th>
                  <th className="px-4 py-3 font-medium">Room</th>
                  <th className="px-4 py-3 font-medium">Check-in</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id} className="border-b border-ink/5 last:border-b-0">
                    <td className="px-4 py-3 text-[15px] text-ink">{(v.visitor as any)?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 text-[15px] text-ink/70">{(v.resident as any)?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 text-[15px] text-ink/70">{(v.room as any) ? `${(v.room as any).room_number}, ${(v.room as any).block}` : "—"}</td>
                    <td className="px-4 py-3 font-mono text-sm text-ink/70">{v.checked_in_at ? new Date(v.checked_in_at).toLocaleTimeString() : "—"}</td>
                    <td className="px-4 py-3 text-sm text-ink/50">
                      {v.checked_in_at ? `${Math.round((Date.now() - new Date(v.checked_in_at).getTime()) / 60000)}m` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleCheckOut(v.id)} className="focus-ring rounded-card bg-ink px-3 py-1.5 text-xs font-medium text-parchment hover:bg-ink-light">
                        Check Out
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
