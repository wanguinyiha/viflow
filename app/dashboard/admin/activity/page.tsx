"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import FilterBar from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/FormField";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

interface ActivityRow {
  id: string;
  action: string;
  created_at: string;
  visit: { visit_code: string; visitor: { full_name: string } | null } | null;
  profiles: { full_name: string } | null;
}

export default function ActivityReviewPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);

      const { data } = await supabase
        .from("visit_logs")
        .select("*, visit:visits(visit_code, visitor:visitor_profiles(full_name)), profiles!visit_logs_performed_by_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(200);

      setActivities((data ?? []) as ActivityRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = activities.filter((a) => actionFilter ? a.action === actionFilter : true);

  const columns: Column<ActivityRow>[] = [
    { key: "created_at", label: "Time", render: (row) => new Date(row.created_at).toLocaleString(), sortable: true },
    { key: "visitor", label: "Visitor", render: (row) => (row.visit as any)?.visitor?.full_name ?? "—" },
    { key: "action", label: "Action", render: (row) => row.action.replace(/_/g, " "), sortable: true },
    { key: "performed_by", label: "By", render: (row) => (row.profiles as any)?.full_name ?? "—" },
  ];

  if (loading || !profile) {
    return (
      <DashboardShell role="admin" roleLabel="Administrator" personName="Loading…">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" roleLabel="Administrator" personName={profile.full_name}>
      <PageHeader title="Activity Review" description="Review all visitor activity logs." />

      <div className="mt-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by visitor…"
          filters={
            <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="w-auto">
              <option value="">All actions</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="denied">Denied</option>
            </Select>
          }
        />
      </div>

      <div className="mt-6">
        <DataTable columns={columns} data={filtered} search={search} />
      </div>
    </DashboardShell>
  );
}
