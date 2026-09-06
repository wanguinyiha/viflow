"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import StatCard from "@/components/ui/StatCard";
import { supabase } from "@/lib/supabaseClient";
import type { Profile, DashboardStats } from "@/lib/types";

export default function AdminDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [visitors, residents, guards, active, todays, rooms] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "visitor"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "resident"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "guard"),
        supabase.from("visits").select("*", { count: "exact", head: true }).eq("status", "checked_in"),
        supabase.from("visits").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        supabase.from("rooms").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalVisitors: visitors.count ?? 0,
        totalResidents: residents.count ?? 0,
        totalGuards: guards.count ?? 0,
        activeVisits: active.count ?? 0,
        todaysVisits: todays.count ?? 0,
        pendingVerifications: 0,
        flaggedActivity: 0,
        roomsOccupied: 0,
        totalRooms: rooms.count ?? 0,
      });

      setLoading(false);
    }
    load();
  }, []);

  if (loading || !profile) {
    return (
      <DashboardShell role="admin" roleLabel="Administrator" personName="Loading…">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
          ))}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" roleLabel="Administrator" personName={profile.full_name}>
      <h1 className="font-display text-3xl italic text-ink">Admin Dashboard</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Visitors" value={stats?.totalVisitors ?? 0} />
        <StatCard label="Total Residents" value={stats?.totalResidents ?? 0} />
        <StatCard label="Total Guards" value={stats?.totalGuards ?? 0} />
        <StatCard label="Active Visits" value={stats?.activeVisits ?? 0} />
        <StatCard label="Today's Visits" value={stats?.todaysVisits ?? 0} />
        <StatCard label="Total Rooms" value={stats?.totalRooms ?? 0} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <a href="/dashboard/admin/users" className="rounded-card border border-ink/15 bg-parchment-dim p-5 hover:border-ink/25 transition-colors">
          <h3 className="font-display text-lg text-ink">Users</h3>
          <p className="mt-1 text-sm text-ink/50">Manage all user accounts</p>
        </a>
        <a href="/dashboard/admin/residents" className="rounded-card border border-ink/15 bg-parchment-dim p-5 hover:border-ink/25 transition-colors">
          <h3 className="font-display text-lg text-ink">Residents</h3>
          <p className="mt-1 text-sm text-ink/50">Manage resident accounts and rooms</p>
        </a>
        <a href="/dashboard/admin/visitors" className="rounded-card border border-ink/15 bg-parchment-dim p-5 hover:border-ink/25 transition-colors">
          <h3 className="font-display text-lg text-ink">Visitors</h3>
          <p className="mt-1 text-sm text-ink/50">View visitor profiles and history</p>
        </a>
        <a href="/dashboard/admin/guards" className="rounded-card border border-ink/15 bg-parchment-dim p-5 hover:border-ink/25 transition-colors">
          <h3 className="font-display text-lg text-ink">Guards</h3>
          <p className="mt-1 text-sm text-ink/50">Manage guard accounts</p>
        </a>
        <a href="/dashboard/admin/rooms" className="rounded-card border border-ink/15 bg-parchment-dim p-5 hover:border-ink/25 transition-colors">
          <h3 className="font-display text-lg text-ink">Rooms</h3>
          <p className="mt-1 text-sm text-ink/50">Manage hostel rooms</p>
        </a>
        <a href="/dashboard/admin/invitations" className="rounded-card border border-ink/15 bg-parchment-dim p-5 hover:border-ink/25 transition-colors">
          <h3 className="font-display text-lg text-ink">Invitations</h3>
          <p className="mt-1 text-sm text-ink/50">View all invitations</p>
        </a>
        <a href="/dashboard/admin/visits" className="rounded-card border border-ink/15 bg-parchment-dim p-5 hover:border-ink/25 transition-colors">
          <h3 className="font-display text-lg text-ink">Visits</h3>
          <p className="mt-1 text-sm text-ink/50">View all visits</p>
        </a>
        <a href="/dashboard/admin/audit" className="rounded-card border border-ink/15 bg-parchment-dim p-5 hover:border-ink/25 transition-colors">
          <h3 className="font-display text-lg text-ink">Audit Logs</h3>
          <p className="mt-1 text-sm text-ink/50">Review security activity</p>
        </a>
        <a href="/dashboard/admin/reports" className="rounded-card border border-ink/15 bg-parchment-dim p-5 hover:border-ink/25 transition-colors">
          <h3 className="font-display text-lg text-ink">Reports</h3>
          <p className="mt-1 text-sm text-ink/50">Analytics and statistics</p>
        </a>
      </div>
    </DashboardShell>
  );
}
