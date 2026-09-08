"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/context/AuthContext";
import type { Visit } from "@/lib/types";

export default function ActiveVisitsPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!profile) return;

      const { data } = await supabase
        .from("visits")
        .select("*, visitor:visitor_profiles(full_name, photo_url), room:rooms(room_number, block)")
        .eq("resident_id", profile.id)
        .in("status", ["authorized", "checked_in"])
        .order("created_at", { ascending: false });

      setVisits((data ?? []) as Visit[]);
      setLoading(false);
    }
    load();
  }, [profile]);

  if (authLoading || loading || !profile) {
    return (
      <DashboardShell role="resident" roleLabel="Resident" personName="Loading…">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="resident" roleLabel="Resident" personName={profile.full_name}>
      <PageHeader title="Active Visits" description="Visitors currently expected or checked in." />

      <div className="mt-8">
        {visits.length === 0 ? (
          <EmptyState title="No active visits" description="No visitors are currently expected or checked in." />
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => (
              <div key={visit.id} className="rounded-card border border-ink/15 bg-parchment-dim p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-ink/10 text-ink/40 flex items-center justify-center text-lg font-medium">
                      {visit.visitor?.full_name?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-ink">{visit.visitor?.full_name ?? "Unknown"}</p>
                      <p className="text-sm text-ink/50">
                        Room {visit.room?.room_number}, {visit.room?.block}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs uppercase ${
                      visit.status === "checked_in"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-sage/20 bg-sage/10 text-sage-dim"
                    }`}>
                      {visit.status === "checked_in" ? "Checked In" : "Expected"}
                    </span>
                    {visit.checked_in_at && (
                      <p className="mt-1 text-xs text-ink/40">
                        Since {new Date(visit.checked_in_at).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
