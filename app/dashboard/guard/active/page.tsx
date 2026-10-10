"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import FilterBar from "@/components/ui/FilterBar";
import { showToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/context/AuthContext";
import type { Visit } from "@/lib/types";

export default function ActiveVisitorsPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Refresh the "duration" column once a minute instead of calling Date.now() during render.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (authLoading || !profile) return;

    async function load() {
      const { data } = await supabase
        .from("visits")
        .select("*, visitor:visitor_profiles(full_name, photo_url, email), resident:profiles!visits_resident_id_fkey(full_name), room:rooms(room_number, block)")
        .eq("status", "checked_in")
        .order("checked_in_at", { ascending: false });

      setVisits((data ?? []) as Visit[]);
      setLoading(false);
    }
    load();
  }, [authLoading, profile]);

  async function handleCheckOut(visitId: string) {
    if (!profile) return;

    // Get visit data for notification before updating
    const visit = visits.find((v) => v.id === visitId);

    await supabase.from("visits").update({
      status: "checked_out",
      checked_out_at: new Date().toISOString(),
    }).eq("id", visitId);

    await supabase.from("visit_logs").insert({
      visit_id: visitId,
      action: "checked_out",
      performed_by: profile.id,
    });

    await supabase.from("audit_logs").insert({
      user_id: profile.id,
      action: "visit_checked_out",
      entity_type: "visit",
      entity_id: visitId,
    });

    // Notify resident
    if (visit?.resident_id) {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: visit.resident_id,
          title: "Visitor Checked Out",
          message: `${visit.visitor?.full_name ?? "A visitor"} has checked out.`,
          type: "visit_checked_out",
          kind: "notification",
          entityType: "visit",
          entityId: visitId,
          link: "/dashboard/resident/history",
        }),
      });
    }

    setVisits((prev) => prev.filter((v) => v.id !== visitId));
    showToast("Visitor checked out.");
  }

  const filteredVisits = useMemo(() => {
    if (!search.trim()) return visits;
    const q = search.toLowerCase();
    return visits.filter((v) => {
      const visitorName = v.visitor?.full_name?.toLowerCase() ?? "";
      const visitorEmail = v.visitor?.email?.toLowerCase() ?? "";
      const residentName = v.resident?.full_name?.toLowerCase() ?? "";
      const roomBlock = v.room ? `block ${v.room.block}` : "";
      const roomNumber = v.room ? `room ${v.room.room_number.replace(/^[AB]-/, "")}` : "";
      return visitorName.includes(q) || visitorEmail.includes(q) || residentName.includes(q) || roomBlock.includes(q) || roomNumber.includes(q);
    });
  }, [visits, search]);

  if (authLoading || loading || !profile) {
    return (
      <DashboardShell role="guard" roleLabel="Guard" personName="Loading…">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="guard" roleLabel="Guard" personName={profile.full_name}>
      <PageHeader title="Active Visitors" description="Visitors currently inside the hostel." />

      <div className="mt-8">
        <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search by visitor, resident, or room..." />

        {filteredVisits.length === 0 ? (
          <EmptyState title={search ? "No matching visitors" : "No visitors inside"} description={search ? "No visitors match your search." : "No visitors are currently checked in."} />
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
                {filteredVisits.map((v) => (
                  <tr key={v.id} className="border-b border-ink/5 last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/10 text-xs font-medium text-ink">
                          {v.visitor?.full_name?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium text-ink">{v.visitor?.full_name ?? "—"}</p>
                          <p className="text-xs text-ink/50">{v.visitor?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[15px] text-ink/70">{v.resident?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 text-[15px] text-ink/70">
                      {v.room ? `Block ${v.room.block} — Room ${v.room.room_number.replace(/^[AB]-/, "")}` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-ink/70">
                      {v.checked_in_at ? new Date(v.checked_in_at).toLocaleTimeString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink/50">
                      {v.checked_in_at ? `${Math.round((now - new Date(v.checked_in_at).getTime()) / 60000)}m` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleCheckOut(v.id)}
                        className="focus-ring rounded-card bg-ink px-3 py-1.5 text-xs font-medium text-parchment hover:bg-ink-light"
                      >
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
