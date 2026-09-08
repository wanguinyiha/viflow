"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/context/AuthContext";
import type { DashboardStats, Visit, Invitation } from "@/lib/types";

interface StatsData {
  totalVisitors: number;
  totalResidents: number;
  totalGuards: number;
  activeVisits: number;
  todaysVisits: number;
  pendingVerifications: number;
  flaggedActivity: number;
  roomsOccupied: number;
  totalRooms: number;
  pendingInvitations: number;
}

const barColors: Record<string, string> = {
  checked_in: "bg-blue-500",
  checked_out: "bg-ink/30",
  pending: "bg-brass",
  authorized: "bg-sage",
  denied: "bg-red-400",
  cancelled: "bg-red-300",
  expired: "bg-ink/20",
};

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 shrink-0 text-ink/60 capitalize">{label.replace(/_/g, " ")}</span>
      <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-ink/5">
        <div className={`absolute inset-y-0 left-0 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-16 text-right font-mono text-xs text-ink/50">{count} ({pct}%)</span>
    </div>
  );
}

export default function ReportsPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !profile) return;
    async function load() {
      try {
        const [statsRes, visitsRes, invitationsRes] = await Promise.all([
          fetch("/api/admin/data?type=stats"),
          fetch("/api/admin/data?type=visits"),
          fetch("/api/admin/data?type=invitations"),
        ]);
        const statsData = await statsRes.json();
        const visitsData = await visitsRes.json();
        const invitationsData = await invitationsRes.json();
        setStats(statsData);
        setVisits(visitsData.visits ?? []);
        setInvitations(invitationsData.invitations ?? []);
      } catch {
        /* keep defaults */
      }
      setLoading(false);
    }
    load();
  }, [authLoading, profile]);

  const visitBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    visits.forEach((v) => {
      counts[v.status] = (counts[v.status] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [visits]);

  const invitationBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    invitations.forEach((inv) => {
      counts[inv.status] = (counts[inv.status] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [invitations]);

  const recentVisits = useMemo(() => {
    return [...visits]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [visits]);

  const visitColumns: Column<Visit & { visitor_name?: string }>[] = [
    {
      key: "visit_code",
      label: "Code",
      render: (row) => <span className="font-mono text-xs text-ink/60">{(row as any).visit_code ?? "\u2014"}</span>,
    },
    {
      key: "visitor_name",
      label: "Visitor",
      render: (row) => (row as any).visitor_name ?? row.visitor?.full_name ?? "\u2014",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} type="visit" />,
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
      <DashboardShell role="admin" roleLabel="Administrator" personName="Loading...">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" roleLabel="Administrator" personName={profile.full_name}>
      <PageHeader title="Reports & Analytics" description="System statistics and data breakdowns." />

      {/* Stat Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Visitors" value={stats?.totalVisitors ?? 0} />
        <StatCard label="Total Residents" value={stats?.totalResidents ?? 0} />
        <StatCard label="Total Guards" value={stats?.totalGuards ?? 0} />
        <StatCard label="Active Visits" value={stats?.activeVisits ?? 0} />
        <StatCard label="Today's Visits" value={stats?.todaysVisits ?? 0} />
        <StatCard label="Pending Invitations" value={stats?.pendingInvitations ?? 0} />
        <StatCard
          label="Rooms Occupied"
          value={`${stats?.roomsOccupied ?? 0}/${stats?.totalRooms ?? 0}`}
          description={`${stats?.totalRooms ? Math.round(((stats?.roomsOccupied ?? 0) / stats.totalRooms) * 100) : 0}% occupancy`}
        />
      </div>

      {/* Visit Status Breakdown */}
      <div className="mt-10">
        <h2 className="font-display text-xl text-ink">Visit Status Breakdown</h2>
        <div className="mt-4 rounded-card border border-ink/10 bg-parchment-dim p-5">
          {visitBreakdown.length === 0 ? (
            <p className="text-sm text-ink/40">No visit data available.</p>
          ) : (
            <div className="space-y-3">
              {visitBreakdown.map(([status, count]) => (
                <StatusBar
                  key={status}
                  label={status}
                  count={count}
                  total={visits.length}
                  color={barColors[status] ?? "bg-ink/40"}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invitation Status Breakdown */}
      <div className="mt-10">
        <h2 className="font-display text-xl text-ink">Invitation Status Breakdown</h2>
        <div className="mt-4 rounded-card border border-ink/10 bg-parchment-dim p-5">
          {invitationBreakdown.length === 0 ? (
            <p className="text-sm text-ink/40">No invitation data available.</p>
          ) : (
            <div className="space-y-3">
              {invitationBreakdown.map(([status, count]) => (
                <StatusBar
                  key={status}
                  label={status}
                  count={count}
                  total={invitations.length}
                  color={barColors[status] ?? "bg-ink/40"}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Visits */}
      <div className="mt-10">
        <h2 className="font-display text-xl text-ink">Recent Visits</h2>
        <div className="mt-4">
          {recentVisits.length === 0 ? (
            <p className="text-sm text-ink/40 rounded-card border border-ink/10 p-4">No recent visits.</p>
          ) : (
            <DataTable columns={visitColumns} data={recentVisits as any} pageSize={10} emptyMessage="No visits." />
          )}
        </div>
      </div>

      {/* Coming soon note */}
      <div className="mt-10 rounded-card border border-dashed border-ink/15 p-6 text-center">
        <p className="text-sm text-ink/40 italic">Full charts coming soon</p>
      </div>
    </DashboardShell>
  );
}
