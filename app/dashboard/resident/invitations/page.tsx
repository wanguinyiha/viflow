"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import FilterBar from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/FormField";
import EmptyState from "@/components/ui/EmptyState";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/context/AuthContext";
import type { Invitation } from "@/lib/types";

export default function InvitationsPage() {
  const router = useRouter();
  const { user: profile, loading: authLoading } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    async function load() {
      if (!profile) return;

      const { data } = await supabase
        .from("invitations")
        .select("*, visitor:visitor_profiles(full_name), room:rooms(room_number, block)")
        .eq("resident_id", profile.id)
        .order("created_at", { ascending: false });

      setInvitations((data ?? []) as Invitation[]);
      setLoading(false);
    }
    load();
  }, [profile]);

  const filtered = invitations.filter((inv) => {
    if (statusFilter && inv.status !== statusFilter) return false;
    return true;
  });

  const columns: Column<Invitation>[] = [
    { key: "visitor_email", label: "Visitor", render: (row) => row.visitor?.full_name || row.visitor_email },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} type="invitation" /> },
    { key: "visit_start", label: "Arrival Date", render: (row) => new Date(row.visit_start).toLocaleDateString() },
    { key: "created_at", label: "Created", render: (row) => new Date(row.created_at).toLocaleDateString() },
    { key: "reason", label: "Reason" },
  ];

  if (authLoading || loading || !profile) {
    return (
      <DashboardShell role="resident" roleLabel="Resident" personName="Loading…">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="resident" roleLabel="Resident" personName={profile.full_name}>
      <PageHeader
        title="Invitations"
        description="All invitations you have created."
        action={
          <a href="/dashboard/resident/invitations/new" className="focus-ring rounded-card bg-ink px-4 py-2 text-sm font-medium text-parchment hover:bg-ink-light">
            New Invitation
          </a>
        }
      />

      <div className="mt-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by visitor name or email…"
          filters={
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          }
        />
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <EmptyState
            title="No invitations yet"
            description="Create your first invitation to get started."
            action={
              <a href="/dashboard/resident/invitations/new" className="focus-ring rounded-card bg-ink px-4 py-2 text-sm font-medium text-parchment hover:bg-ink-light">
                Create Invitation
              </a>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            search={search}
            onRowClick={(row) => router.push(`/dashboard/resident/invitations/${row.id}`)}
          />
        )}
      </div>
    </DashboardShell>
  );
}
