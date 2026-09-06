"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import FilterBar from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/FormField";
import { supabase } from "@/lib/supabaseClient";
import type { Profile, AuditLog } from "@/lib/types";

export default function AuditLogsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
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
        .from("audit_logs")
        .select("*, profiles!audit_logs_performed_by_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(200);

      setLogs((data ?? []) as AuditLog[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = logs.filter((l) => actionFilter ? l.action === actionFilter : true);

  const columns: Column<AuditLog>[] = [
    { key: "created_at", label: "Time", render: (row) => new Date(row.created_at).toLocaleString(), sortable: true },
    { key: "action", label: "Action", render: (row) => row.action.replace(/_/g, " "), sortable: true },
    { key: "entity_type", label: "Entity", render: (row) => row.entity_type ?? "—" },
    { key: "entity_id", label: "Entity ID", render: (row) => row.entity_id ? <span className="font-mono text-xs text-ink/40">{row.entity_id.slice(0, 8)}…</span> : "—" },
    { key: "performed_by", label: "By", render: (row) => (row.user as any)?.full_name ?? "—" },
    { key: "details", label: "Details", render: (row) => row.details ? <span className="text-xs text-ink/50 line-clamp-1">{JSON.stringify(row.details)}</span> : "—" },
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
      <PageHeader title="Audit Logs" description="System security and audit trail." />

      <div className="mt-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search audit logs…"
          filters={
            <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="w-auto">
              <option value="">All actions</option>
              <option value="sign_in">Sign In</option>
              <option value="sign_out">Sign Out</option>
              <option value="invitation_created">Invitation Created</option>
              <option value="visit_checked_in">Visit Checked In</option>
              <option value="visit_checked_out">Visit Checked Out</option>
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
