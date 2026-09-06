"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import FilterBar from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/FormField";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

interface VisitRow {
  id: string;
  visit_code: string;
  status: string;
  created_at: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  visitor: { full_name: string } | null;
  resident: { full_name: string } | null;
  room: { room_number: string; block: string } | null;
}

export default function AdminVisitsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [visits, setVisits] = useState<VisitRow[]>([]);
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
        .select("*, visitor:visitor_profiles(full_name), resident:profiles!visits_resident_id_fkey(full_name), room:rooms(room_number, block)")
        .order("created_at", { ascending: false })
        .limit(200);

      setVisits((data ?? []) as VisitRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = visits.filter((v) => statusFilter ? v.status === statusFilter : true);

  const columns: Column<VisitRow>[] = [
    { key: "visit_code", label: "Code", render: (row) => <span className="font-mono text-sm text-ink">{row.visit_code}</span> },
    { key: "visitor", label: "Visitor", render: (row) => (row.visitor as any)?.full_name ?? "—" },
    { key: "resident", label: "Resident", render: (row) => (row.resident as any)?.full_name ?? "—" },
    { key: "room", label: "Room", render: (row) => (row.room as any) ? `${(row.room as any).room_number}, ${(row.room as any).block}` : "—" },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} type="visit" /> },
    { key: "checked_in_at", label: "Check-in", render: (row) => row.checked_in_at ? new Date(row.checked_in_at).toLocaleString() : "—" },
    { key: "checked_out_at", label: "Check-out", render: (row) => row.checked_out_at ? new Date(row.checked_out_at).toLocaleString() : "—" },
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
      <PageHeader title="Visits" description="View all visits across the system." />

      <div className="mt-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by code, visitor, or resident…"
          filters={
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
              <option value="">All statuses</option>
              <option value="authorized">Authorized</option>
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
