"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import FilterBar from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/FormField";
import EmptyState from "@/components/ui/EmptyState";
import { supabase } from "@/lib/supabaseClient";
import type { Profile, Visit } from "@/lib/types";

export default function VisitHistoryPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);

      const { data } = await supabase
        .from("visits")
        .select("*, visitor:visitor_profiles(full_name), room:rooms(room_number, block)")
        .eq("resident_id", user.id)
        .order("created_at", { ascending: false });

      setVisits((data ?? []) as Visit[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = visits.filter((v) => {
    if (statusFilter && v.status !== statusFilter) return false;
    return true;
  });

  const columns: Column<Visit>[] = [
    { key: "created_at", label: "Date", render: (row) => new Date(row.created_at).toLocaleDateString(), sortable: true },
    { key: "visitor", label: "Visitor", render: (row) => (row.visitor as any)?.full_name ?? "—" },
    { key: "room", label: "Room", render: (row) => (row.room as any) ? `${(row.room as any).room_number}, ${(row.room as any).block}` : "—" },
    { key: "checked_in_at", label: "Check In", render: (row) => row.checked_in_at ? new Date(row.checked_in_at).toLocaleTimeString() : "—" },
    { key: "checked_out_at", label: "Check Out", render: (row) => row.checked_out_at ? new Date(row.checked_out_at).toLocaleTimeString() : "—" },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} type="visit" /> },
  ];

  if (loading || !profile) {
    return (
      <DashboardShell role="resident" roleLabel="Resident" personName="Loading…">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="resident" roleLabel="Resident" personName={profile.full_name}>
      <PageHeader title="Visit History" description="All past and current visits." />

      <div className="mt-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by visitor…"
          filters={
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
              <option value="">All statuses</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="authorized">Authorized</option>
              <option value="denied">Denied</option>
            </Select>
          }
        />
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <EmptyState title="No visits yet" description="Visit history will appear here." />
        ) : (
          <DataTable columns={columns} data={filtered} search={search} />
        )}
      </div>
    </DashboardShell>
  );
}
