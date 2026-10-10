"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import FilterBar from "@/components/ui/FilterBar";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/context/AuthContext";
import type { VisitorProfile } from "@/lib/types";

interface VisitorRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  id_verified: boolean;
  visit_count: number;
  last_visit: string | null;
}

export default function MyVisitorsPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      if (!profile) return;

      const { data: visits } = await supabase
        .from("visits")
        .select("visitor_id, visitor:visitor_profiles(id, full_name, email, photo_url, id_verified), created_at")
        .eq("resident_id", profile.id)
        .order("created_at", { ascending: false });

      // Deduplicate visitors
      const visitorMap = new Map<string, VisitorRecord>();
      (visits ?? []).forEach((v: { visitor_id: string; visitor: VisitorProfile | null; created_at: string }) => {
        const vid = v.visitor_id;
        if (!visitorMap.has(vid) && v.visitor) {
          visitorMap.set(vid, {
            id: vid,
            full_name: v.visitor.full_name,
            email: v.visitor.email,
            phone: v.visitor.phone,
            photo_url: v.visitor.photo_url,
            id_verified: v.visitor.id_verified,
            visit_count: 1,
            last_visit: v.created_at,
          });
        } else if (visitorMap.has(vid)) {
          const existing = visitorMap.get(vid)!;
          existing.visit_count++;
        }
      });

      setVisitors(Array.from(visitorMap.values()));
      setLoading(false);
    }
    load();
  }, [profile]);

  const columns: Column<VisitorRecord>[] = [
    {
      key: "full_name",
      label: "Visitor",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-ink/10 text-ink/40 flex items-center justify-center text-xs font-medium">
            {row.full_name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-ink">{row.full_name}</p>
            <p className="text-xs text-ink/40">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: "visit_count", label: "Visits", render: (row) => <span className="font-mono text-sm">{row.visit_count}</span> },
    { key: "last_visit", label: "Last Visit", render: (row) => row.last_visit ? new Date(row.last_visit).toLocaleDateString() : "—" },
    { key: "id_verified", label: "ID Verified", render: (row) => row.id_verified ? <span className="text-sage-dim text-sm">Yes</span> : <span className="text-ink/40 text-sm">No</span> },
  ];

  if (authLoading || loading || !profile) {
    return (
      <DashboardShell role="resident" roleLabel="Resident" personName="Loading…">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="resident" roleLabel="Resident" personName={profile.full_name}>
      <PageHeader title="My Visitors" description="Visitors who have visited you." />

      <div className="mt-6">
        <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search visitors…" />
      </div>

      <div className="mt-6">
        {visitors.length === 0 ? (
          <EmptyState title="No visitors yet" description="No visitors have visited you yet." />
        ) : (
          <DataTable columns={columns} data={visitors} search={search} />
        )}
      </div>
    </DashboardShell>
  );
}
