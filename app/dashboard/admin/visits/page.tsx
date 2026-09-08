"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import FilterBar from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/FormField";
import SlideOver from "@/components/ui/SlideOver";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { showToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/context/AuthContext";

interface VisitRow {
  id: string;
  invitation_id: string;
  visitor_id: string;
  resident_id: string;
  room_id: string;
  status: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  created_at: string;
  updated_at: string;
  invitation?: {
    visit_code: string;
    visitor_name: string;
    visitor_email: string;
    reason: string | null;
    resident_id: string;
  } | null;
  room?: {
    id: string;
    room_number: string;
    block: string;
    floor: number;
  } | null;
}

export default function AdminVisitsPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedVisit, setSelectedVisit] = useState<VisitRow | null>(null);
  const [denyTarget, setDenyTarget] = useState<VisitRow | null>(null);

  useEffect(() => {
    if (authLoading || !profile) return;
    loadVisits();
  }, [authLoading, profile]);

  async function loadVisits() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/data?type=visits");
      const data = await res.json();
      setVisits(data.visits ?? []);
    } catch {
      setVisits([]);
    }
    setLoading(false);
  }

  async function handleDeny(visit: VisitRow) {
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deny_visit",
          visitId: visit.id,
        }),
      });
      const data = await res.json();
      if (data.error) {
        showToast(data.error, "error");
        return;
      }
      showToast("Visit denied successfully", "success");
      loadVisits();
      setSelectedVisit(null);
    } catch {
      showToast("Failed to deny visit", "error");
    }
  }

  const filtered = visits.filter((v) =>
    statusFilter ? v.status === statusFilter : true
  );

  function canDeny(status: string) {
    return status !== "denied";
  }

  function getVisitCode(visit: VisitRow): string {
    return visit.invitation?.visit_code ?? "\u2014";
  }

  function getVisitorName(visit: VisitRow): string {
    return visit.invitation?.visitor_name ?? "\u2014";
  }

  function getRoomLabel(visit: VisitRow): string {
    if (!visit.room) return "\u2014";
    return `${visit.room.block} ${visit.room.room_number}`;
  }

  const columns: Column<VisitRow>[] = [
    {
      key: "invitation_id",
      label: "Code",
      render: (row) => (
        <span className="font-mono text-sm text-ink">{getVisitCode(row)}</span>
      ),
    },
    {
      key: "visitor_id",
      label: "Visitor",
      render: (row) => getVisitorName(row),
    },
    {
      key: "room_id",
      label: "Room",
      render: (row) => getRoomLabel(row),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} type="visit" />,
    },
    {
      key: "checked_in_at",
      label: "Check-in",
      render: (row) =>
        row.checked_in_at
          ? new Date(row.checked_in_at).toLocaleString()
          : "\u2014",
    },
    {
      key: "checked_out_at",
      label: "Check-out",
      render: (row) =>
        row.checked_out_at
          ? new Date(row.checked_out_at).toLocaleString()
          : "\u2014",
    },
  ];

  if (authLoading || loading || !profile) {
    return (
      <DashboardShell role="admin" roleLabel="Administrator" personName="Loading\u2026">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-card border border-ink/10 bg-parchment-dim"
            />
          ))}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" roleLabel="Administrator" personName={profile.full_name}>
      <PageHeader
        title="Visits"
        description="View and manage all visits across the system."
      />

      <div className="mt-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by code, visitor, or resident\u2026"
          filters={
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-auto"
            >
              <option value="">All statuses</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="denied">Denied</option>
            </Select>
          }
        />
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={filtered}
          search={search}
          onRowClick={(row) => setSelectedVisit(row)}
        />
      </div>

      <SlideOver
        open={!!selectedVisit}
        onClose={() => setSelectedVisit(null)}
        title="Visit Details"
      >
        {selectedVisit && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm text-ink/50">
                  {getVisitCode(selectedVisit)}
                </p>
                <div className="mt-1">
                  <StatusBadge
                    status={selectedVisit.status}
                    type="visit"
                  />
                </div>
              </div>
              {canDeny(selectedVisit.status) && (
                <button
                  onClick={() => {
                    setSelectedVisit(null);
                    setDenyTarget(selectedVisit);
                  }}
                  className="focus-ring rounded-card border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Deny Visit
                </button>
              )}
            </div>

            <div className="border-t border-ink/10 pt-4">
              <h3 className="font-display text-lg text-ink">Visitor</h3>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-ink/50">Name</span>
                  <p className="font-medium text-ink">
                    {selectedVisit.invitation?.visitor_name ?? "\u2014"}
                  </p>
                </div>
                <div>
                  <span className="text-ink/50">Email</span>
                  <p className="font-medium text-ink">
                    {selectedVisit.invitation?.visitor_email ?? "\u2014"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-4">
              <h3 className="font-display text-lg text-ink">Room</h3>
              <div className="mt-3 text-sm">
                <span className="text-ink/50">Room</span>
                <p className="font-medium text-ink">
                  {getRoomLabel(selectedVisit)}
                </p>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-4">
              <h3 className="font-display text-lg text-ink">Visit Times</h3>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-ink/50">Check-in</span>
                  <p className="font-medium text-ink">
                    {selectedVisit.checked_in_at
                      ? new Date(selectedVisit.checked_in_at).toLocaleString()
                      : "\u2014"}
                  </p>
                </div>
                <div>
                  <span className="text-ink/50">Check-out</span>
                  <p className="font-medium text-ink">
                    {selectedVisit.checked_out_at
                      ? new Date(selectedVisit.checked_out_at).toLocaleString()
                      : "\u2014"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-4">
              <h3 className="font-display text-lg text-ink">Invitation</h3>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-ink/50">Code</span>
                  <p className="font-mono font-medium text-ink">
                    {selectedVisit.invitation?.visit_code ?? "\u2014"}
                  </p>
                </div>
                <div>
                  <span className="text-ink/50">Purpose</span>
                  <p className="font-medium text-ink">
                    {selectedVisit.invitation?.reason ?? "\u2014"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-ink/50">Created</span>
                  <p className="font-medium text-ink">
                    {new Date(selectedVisit.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-ink/50">Updated</span>
                  <p className="font-medium text-ink">
                    {new Date(selectedVisit.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlideOver>

      <ConfirmDialog
        open={!!denyTarget}
        onClose={() => setDenyTarget(null)}
        onConfirm={() => {
          if (denyTarget) handleDeny(denyTarget);
        }}
        title="Deny Visit"
        message={`Are you sure you want to deny visit ${denyTarget ? getVisitCode(denyTarget) : ""}? This will prevent the visitor from checking in.`}
        confirmLabel="Deny Visit"
        variant="danger"
      />
    </DashboardShell>
  );
}