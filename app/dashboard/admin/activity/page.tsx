"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import FilterBar from "@/components/ui/FilterBar";
import SlideOver from "@/components/ui/SlideOver";
import { Select } from "@/components/ui/FormField";
import { useAuth } from "@/lib/context/AuthContext";
import type { Visit } from "@/lib/types";

interface ActivityLog {
  id: string;
  visit_id: string;
  action: string;
  performed_by: string | null;
  notes: string | null;
  created_at: string;
  visit: (Visit & { visit_code?: string }) | null;
}

function formatAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ActivityReviewPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    if (authLoading || !profile) return;
    async function load() {
      try {
        const res = await fetch("/api/admin/data?type=activity");
        const data = await res.json();
        setLogs(data.logs ?? []);
      } catch {
        setLogs([]);
      }
      setLoading(false);
    }
    load();
  }, [authLoading, profile]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        !search ||
        log.visit?.visit_code?.toLowerCase().includes(search.toLowerCase()) ||
        log.notes?.toLowerCase().includes(search.toLowerCase());
      const matchesAction = !actionFilter || log.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [logs, search, actionFilter]);

  const columns: Column<ActivityLog>[] = [
    {
      key: "created_at",
      label: "Time",
      render: (row) => new Date(row.created_at).toLocaleString(),
      sortable: true,
    },
    {
      key: "visit_code",
      label: "Visit Code",
      render: (row) => (
        <span className="font-mono text-xs text-ink/60">
          {row.visit?.visit_code ?? "\u2014"}
        </span>
      ),
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
      key: "performed_by",
      label: "Performed By",
      render: (row) => row.performed_by ?? "\u2014",
    },
    {
      key: "notes",
      label: "Notes",
      render: (row) => (
        <span className="text-ink/50 truncate max-w-[200px] inline-block">
          {row.notes || "\u2014"}
        </span>
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
      <PageHeader title="Activity Review" description="Review all gate activity logs." />

      <div className="mt-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by visit code or notes..."
          filters={
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-auto"
            >
              <option value="">All actions</option>
              <option value="check_in">Check In</option>
              <option value="check_out">Check Out</option>
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
          emptyMessage="No activity logs found."
        />
      </div>

      <SlideOver
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Activity Log Details"
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
                <h3 className="text-sm text-ink/50">Visit Code</h3>
                <p className="mt-1 font-mono text-sm text-ink">
                  {selectedLog.visit?.visit_code ?? "\u2014"}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-ink/50">Performed By</h3>
                <p className="mt-1 font-medium text-ink">
                  {selectedLog.performed_by ?? "\u2014"}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-ink/50">Visit ID</h3>
                <p className="mt-1 font-mono text-xs text-ink/40">
                  {selectedLog.visit_id.slice(0, 8)}...
                </p>
              </div>
            </div>

            {selectedLog.notes && (
              <div className="border-t border-ink/10 pt-4">
                <h3 className="text-sm text-ink/50">Notes</h3>
                <p className="mt-2 text-ink/70">{selectedLog.notes}</p>
              </div>
            )}

            {selectedLog.visit && (
              <div className="border-t border-ink/10 pt-4">
                <h3 className="text-sm text-ink/50">Visit Details</h3>
                <div className="mt-2 rounded-card border border-ink/10 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink/50">Status</span>
                    <span className="font-medium text-ink">
                      {selectedLog.visit.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  {selectedLog.visit.checked_in_at && (
                    <div className="mt-1 flex justify-between">
                      <span className="text-ink/50">Checked In</span>
                      <span className="text-ink">
                        {new Date(selectedLog.visit.checked_in_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedLog.visit.checked_out_at && (
                    <div className="mt-1 flex justify-between">
                      <span className="text-ink/50">Checked Out</span>
                      <span className="text-ink">
                        {new Date(selectedLog.visit.checked_out_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </DashboardShell>
  );
}
