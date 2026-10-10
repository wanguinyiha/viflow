"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import FilterBar from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/FormField";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/context/AuthContext";

interface LogEntry {
  id: string;
  action: string;
  created_at: string;
  visit: { visit_code: string; visitor: { full_name: string } | null; resident: { full_name: string } | null; room: { room_number: string; block: string } | null } | null;
}

export default function VisitLogPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    if (authLoading || !profile) return;

    async function load() {
      const { data } = await supabase
        .from("visit_logs")
        .select("*, visit:visits(visit_code, visitor:visitor_profiles(full_name), resident:profiles!visits_resident_id_fkey(full_name), room:rooms(room_number, block))")
        .order("created_at", { ascending: false })
        .limit(100);

      setLogs((data ?? []) as LogEntry[]);
      setLoading(false);
    }
    load();
  }, [authLoading, profile]);

  const filtered = logs.filter((l) => {
    if (actionFilter && l.action !== actionFilter) return false;
    return true;
  });

  const columns: Column<LogEntry>[] = [
    { key: "created_at", label: "Time", render: (row) => new Date(row.created_at).toLocaleString(), sortable: true },
    { key: "visitor", label: "Visitor", render: (row) => row.visit?.visitor?.full_name ?? "—" },
    { key: "resident", label: "Resident", render: (row) => row.visit?.resident?.full_name ?? "—" },
    { key: "room", label: "Room", render: (row) => (row.visit?.room ? `${row.visit.room.room_number}, ${row.visit.room.block}` : "—") },
    { key: "action", label: "Action", render: (row) => <StatusBadge status={row.action.replace("checked_", "")} type="visit" /> },
  ];

  if (authLoading || loading || !profile) {
    return (
      <DashboardShell role="guard" roleLabel="Guard" personName="Loading…">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="guard" roleLabel="Guard" personName={profile.full_name}>
      <PageHeader title="Visit Log" description="Record of all visitor activity." />

      <div className="mt-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by visitor or resident…"
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
