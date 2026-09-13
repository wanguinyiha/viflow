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

interface InvitationRow {
  id: string;
  resident_id: string;
  visitor_id: string | null;
  visitor_email: string;
  visitor_name: string;
  room_id: string;
  visit_start: string;
  visit_end: string | null;
  reason: string | null;
  vehicle_registration: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  resident?: { id: string; full_name: string; email: string } | null;
  room?: { room_number: string; block: string } | null;
}

export default function AdminInvitationsPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");

  const [selectedInvitation, setSelectedInvitation] = useState<InvitationRow | null>(null);
  const [cancelTarget, setCancelTarget] = useState<InvitationRow | null>(null);

  useEffect(() => {
    if (authLoading || !profile) return;
    loadInvitations();
  }, [authLoading, profile]);

  async function loadInvitations() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/data?type=invitations");
      const data = await res.json();
      setInvitations(data.invitations ?? []);
    } catch {
      setInvitations([]);
    }
    setLoading(false);
  }

  async function handleCancel(invitation: InvitationRow) {
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel_invitation",
          invitationId: invitation.id,
        }),
      });
      const data = await res.json();
      if (data.error) {
        showToast(data.error, "error");
        return;
      }
      showToast("Invitation cancelled successfully", "success");
      loadInvitations();
      setSelectedInvitation(null);
    } catch {
      showToast("Failed to cancel invitation", "error");
    }
  }

  const filtered = invitations.filter((i) => {
    if (statusFilter && i.status !== statusFilter) return false;
    if (blockFilter && i.room?.block !== blockFilter) return false;
    return true;
  });

  function canCancel(status: string) {
    return status === "pending" || status === "accepted";
  }

  const columns: Column<InvitationRow>[] = [
    // {
    //   key: "visit_code",
    //   label: "Code",
    //   render: (row) => (
    //     <span className="font-mono text-sm text-ink">{row.visit_code}</span>
    //   ),
    // },
    {
      key: "visitor_name",
      label: "Visitor",
      render: (row) => row.visitor_name ?? "\u2014",
    },
    {
      key: "resident_id",
      label: "Resident",
      render: (row) => row.resident?.full_name ?? "\u2014",
    },
    {
      key: "room_id",
      label: "Room",
      render: (row) => row.room ? (
        <span className="text-sm text-ink">Block {row.room.block} — Room {row.room.room_number.replace(/^[AB]-/, "")}</span>
      ) : "\u2014",
    },
    {
      key: "reason",
      label: "Purpose",
      render: (row) => row.reason ?? "\u2014",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} type="invitation" />,
    },
    {
      key: "visit_start",
      label: "Arrival Date",
      render: (row) =>
        row.visit_start
          ? new Date(row.visit_start).toLocaleDateString()
          : "\u2014",
    },
    {
      key: "created_at",
      label: "Created",
      render: (row) => new Date(row.created_at).toLocaleDateString(),
      sortable: true,
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
        title="Invitations"
        description="View and manage all invitations across the system."
      />

      <div className="mt-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by code, visitor, or resident\u2026"
          filters={
            <>
              <Select
                value={blockFilter}
                onChange={(e) => setBlockFilter(e.target.value)}
                className="w-auto"
              >
                <option value="">All blocks</option>
                <option value="A">Block A</option>
                <option value="B">Block B</option>
              </Select>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-auto"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </>
          }
        />
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={filtered}
          search={search}
          onRowClick={(row) => setSelectedInvitation(row)}
        />
      </div>

      <SlideOver
        open={!!selectedInvitation}
        onClose={() => setSelectedInvitation(null)}
        title="Invitation Details"
      >
        {selectedInvitation && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="mt-1">
                  <StatusBadge
                    status={selectedInvitation.status}
                    type="invitation"
                  />
                </div>
              </div>
              {canCancel(selectedInvitation.status) && (
                <button
                  onClick={() => {
                    setSelectedInvitation(null);
                    setCancelTarget(selectedInvitation);
                  }}
                  className="focus-ring rounded-card border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Cancel Invitation
                </button>
              )}
            </div>

            <div className="border-t border-ink/10 pt-4">
              <h3 className="font-display text-lg text-ink">Visitor</h3>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-ink/50">Name</span>
                  <p className="font-medium text-ink">
                    {selectedInvitation.visitor_name ?? "\u2014"}
                  </p>
                </div>
                <div>
                  <span className="text-ink/50">Email</span>
                  <p className="font-medium text-ink">
                    {selectedInvitation.visitor_email ?? "\u2014"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-4">
              <h3 className="font-display text-lg text-ink">Resident</h3>
              <div className="mt-3 text-sm">
                <span className="text-ink/50">Name</span>
                <p className="font-medium text-ink">
                  {selectedInvitation.resident?.full_name ?? "\u2014"}
                </p>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-4">
              <h3 className="font-display text-lg text-ink">Visit Details</h3>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                {selectedInvitation.room && (
                  <div>
                    <span className="text-ink/50">Room</span>
                    <p className="font-medium text-ink">
                      Block {selectedInvitation.room.block} — Room {selectedInvitation.room.room_number.replace(/^[AB]-/, "")}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-ink/50">Arrival Date</span>
                  <p className="font-medium text-ink">
                    {selectedInvitation.visit_start
                      ? new Date(selectedInvitation.visit_start).toLocaleDateString()
                      : "\u2014"}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-ink/50">Reason</span>
                  <p className="font-medium text-ink">
                    {selectedInvitation.reason ?? "\u2014"}
                  </p>
                </div>
                {selectedInvitation.vehicle_registration && (
                  <div className="col-span-2">
                    <span className="text-ink/50">Vehicle Registration</span>
                    <p className="font-mono font-medium text-ink">
                      {selectedInvitation.vehicle_registration}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-ink/10 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-ink/50">Created</span>
                  <p className="font-medium text-ink">
                    {new Date(selectedInvitation.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-ink/50">Updated</span>
                  <p className="font-medium text-ink">
                    {new Date(selectedInvitation.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlideOver>

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) handleCancel(cancelTarget);
        }}
        title="Cancel Invitation"
        message={`Are you sure you want to cancel this invitation? This action cannot be undone.`}
        confirmLabel="Cancel Invitation"
        variant="danger"
      />
    </DashboardShell>
  );
}