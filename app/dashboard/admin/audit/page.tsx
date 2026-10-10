"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import FilterBar from "@/components/ui/FilterBar";
import SlideOver from "@/components/ui/SlideOver";
import { Select } from "@/components/ui/FormField";
import { useAuth } from "@/lib/context/AuthContext";
import type { Profile } from "@/lib/types";


interface AuditLogRow {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user: Profile | null;
}

function formatAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AuditLogsPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);

  useEffect(() => {
    if (authLoading || !profile) return;
    async function load() {
      try {
        const res = await fetch("/api/admin/data?type=audit");
        const data = await res.json();
        setLogs(data.logs ?? []);
      } catch {
        setLogs([]);
      }
      setLoading(false);
    }
    load();
  }, [authLoading, profile]);

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map((l) => l.action));
    return Array.from(actions).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        !search ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
        log.entity_id?.toLowerCase().includes(search.toLowerCase());
      const matchesAction = !actionFilter || log.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [logs, search, actionFilter]);

  const columns: Column<AuditLogRow>[] = [
    {
      key: "created_at",
      label: "Time",
      render: (row) => new Date(row.created_at).toLocaleString(),
      sortable: true,
    },
    {
      key: "action",
      label: "Action",
      render: (row) => (
        <span className="inline-flex items-center rounded-full border border-ink/10 bg-ink/5 px-2 py-0.5 text-xs font-medium text-ink">
          {formatAction(row.action)}
        </span>
      ),
      sortable: true,
    },
    {
      key: "entity",
      label: "Entity",
      render: (row) => (
        <span className="text-ink/70">
          {row.entity_type}
          {row.entity_id && (
            <span className="ml-1 font-mono text-xs text-ink/40">
              {row.entity_id.slice(0, 8)}...
            </span>
          )}
        </span>
      ),
    },
    {
      key: "user",
      label: "User",
      render: (row) => row.user?.full_name ?? "System",
    },
    {
      key: "ip_address",
      label: "IP",
      render: (row) => (
        <span className="font-mono text-xs text-ink/50">{row.ip_address || "\u2014"}</span>
      ),
    },
  ];

  if (authLoading || loading || !profile) {
    return (
      <DashboardShell role="admin" roleLabel="Administrator" personName="Loading...">
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
          searchPlaceholder="Search by action or entity..."
          filters={
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-auto"
            >
              <option value="">All actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {formatAction(action)}
                </option>
              ))}
            </Select>
          }
        />
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={filtered}
          search=""
          onRowClick={(row) => setSelectedLog(row)}
          emptyMessage="No audit logs found."
        />
      </div>

      <SlideOver
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Details"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="rounded-card border border-ink/10 bg-parchment-dim p-4">
              <h3 className="font-display text-sm text-ink/50 uppercase tracking-wide">Action</h3>
              <p className="mt-1 font-mono text-lg text-ink">{formatAction(selectedLog.action)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm text-ink/50">Time</h3>
                <p className="mt-1 font-medium text-ink">
                  {new Date(selectedLog.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-ink/50">User</h3>
                <p className="mt-1 font-medium text-ink">
                  {selectedLog.user?.full_name ?? "System"}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-ink/50">Entity Type</h3>
                <p className="mt-1 font-medium text-ink">{selectedLog.entity_type}</p>
              </div>
              <div>
                <h3 className="text-sm text-ink/50">Entity ID</h3>
                <p className="mt-1 font-mono text-xs text-ink/40">
                  {selectedLog.entity_id ?? "\u2014"}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-ink/50">IP Address</h3>
                <p className="mt-1 font-mono text-sm text-ink">
                  {selectedLog.ip_address ?? "\u2014"}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-ink/50">Log ID</h3>
                <p className="mt-1 font-mono text-xs text-ink/40">{selectedLog.id}</p>
              </div>
            </div>

            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
              <div className="border-t border-ink/10 pt-4">
                <h3 className="text-sm text-ink/50">Details</h3>
                <pre className="mt-2 overflow-x-auto rounded-card border border-ink/10 bg-ink/5 p-3 font-mono text-xs text-ink/70 whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </DashboardShell>
  );
}
