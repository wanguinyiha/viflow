"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import FilterBar from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/FormField";
import SlideOver from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/context/AuthContext";

interface VerificationRow {
  id: string;
  visit_id: string;
  visitor_id: string;
  verified_by: string | null;
  status: string;
  method: string | null;
  notes: string | null;
  created_at: string;
  visit?: {
    status: string;
  } | null;
  visitor?: {
    full_name: string;
    email: string;
    photo_url: string | null;
  } | null;
  verifier?: {
    full_name: string;
  } | null;
}

export default function VerificationsPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [verifications, setVerifications] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedVerification, setSelectedVerification] =
    useState<VerificationRow | null>(null);

  useEffect(() => {
    if (authLoading || !profile) return;
    loadVerifications();
  }, [authLoading, profile]);

  async function loadVerifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/data?type=verifications");
      const data = await res.json();
      setVerifications(data.verifications ?? []);
    } catch {
      setVerifications([]);
    }
    setLoading(false);
  }

  const filtered = verifications.filter((v) =>
    statusFilter ? v.status === statusFilter : true
  );

  const columns: Column<VerificationRow>[] = [
    {
      key: "visitor_id",
      label: "Visitor",
      render: (row) => row.visitor?.full_name ?? "\u2014",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusBadge status={row.status} type="verification" />
      ),
    },
    {
      key: "method",
      label: "Method",
      render: (row) =>
        row.method ? (
          <span className="capitalize">{row.method}</span>
        ) : (
          "\u2014"
        ),
    },
    {
      key: "verified_by",
      label: "Verified By",
      render: (row) => row.verifier?.full_name ?? "\u2014",
    },
    {
      key: "created_at",
      label: "Date",
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
        title="Verifications"
        description="Monitor visitor verification activity."
      />

      <div className="mt-6">
        <FilterBar
          search=""
          onSearchChange={() => {}}
          searchPlaceholder="Search by visitor or visit code\u2026"
          filters={
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-auto"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </Select>
          }
        />
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => setSelectedVerification(row)}
        />
      </div>

      <SlideOver
        open={!!selectedVerification}
        onClose={() => setSelectedVerification(null)}
        title="Verification Details"
      >
        {selectedVerification && (
          <div className="space-y-6">
            <div>
              <StatusBadge
                status={selectedVerification.status}
                type="verification"
              />
            </div>

            <div className="border-t border-ink/10 pt-4">
              <h3 className="font-display text-lg text-ink">Visitor</h3>
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-4">
                  {selectedVerification.visitor?.photo_url ? (
                    <img
                      src={selectedVerification.visitor.photo_url}
                      alt={selectedVerification.visitor.full_name}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink/10 text-xl font-medium text-ink">
                      {selectedVerification.visitor?.full_name?.charAt(0) ?? "?"}
                    </div>
                  )}
                  <div>
                    <p className="font-display text-lg text-ink">
                      {selectedVerification.visitor?.full_name ?? "\u2014"}
                    </p>
                    <p className="text-sm text-ink/50">
                      {selectedVerification.visitor?.email ?? "\u2014"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-4">
              <h3 className="font-display text-lg text-ink">Visit</h3>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-ink/50">Visit Status</span>
                  <p className="font-medium text-ink capitalize">
                    {selectedVerification.visit?.status?.replace(/_/g, " ") ?? "\u2014"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-4">
              <h3 className="font-display text-lg text-ink">Verification</h3>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-ink/50">Method</span>
                  <p className="font-medium text-ink capitalize">
                    {selectedVerification.method ?? "\u2014"}
                  </p>
                </div>
                <div>
                  <span className="text-ink/50">Verified By</span>
                  <p className="font-medium text-ink">
                    {selectedVerification.verifier?.full_name ?? "\u2014"}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-ink/50">Notes</span>
                  <p className="font-medium text-ink">
                    {selectedVerification.notes ?? "\u2014"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-4">
              <div className="text-sm">
                <span className="text-ink/50">Date</span>
                <p className="font-medium text-ink">
                  {new Date(selectedVerification.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </DashboardShell>
  );
}