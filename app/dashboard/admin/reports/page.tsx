"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";

interface ReportStats {
  totalVisitors: number;
  totalResidents: number;
  totalGuards: number;
  totalInvitations: number;
  totalVisits: number;
  activeVisits: number;
  todaysVisits: number;
  thisWeeksVisits: number;
}

export default function ReportsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [visitors, residents, guards, invitations, visits, active, todays, thisWeek] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "visitor"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "resident"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "guard"),
        supabase.from("invitations").select("*", { count: "exact", head: true }),
        supabase.from("visits").select("*", { count: "exact", head: true }),
        supabase.from("visits").select("*", { count: "exact", head: true }).eq("status", "checked_in"),
        supabase.from("visits").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        supabase.from("visits").select("*", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
      ]);

      setStats({
        totalVisitors: visitors.count ?? 0,
        totalResidents: residents.count ?? 0,
        totalGuards: guards.count ?? 0,
        totalInvitations: invitations.count ?? 0,
        totalVisits: visits.count ?? 0,
        activeVisits: active.count ?? 0,
        todaysVisits: todays.count ?? 0,
        thisWeeksVisits: thisWeek.count ?? 0,
      });

      setLoading(false);
    }
    load();
  }, []);

  if (loading || !profile) {
    return (
      <DashboardShell role="admin" roleLabel="Administrator" personName="Loading…">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" roleLabel="Administrator" personName={profile.full_name}>
      <PageHeader title="Reports" description="Analytics and system statistics." />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Visitors" value={stats?.totalVisitors ?? 0} />
        <StatCard label="Total Residents" value={stats?.totalResidents ?? 0} />
        <StatCard label="Total Guards" value={stats?.totalGuards ?? 0} />
        <StatCard label="Total Invitations" value={stats?.totalInvitations ?? 0} />
        <StatCard label="Total Visits" value={stats?.totalVisits ?? 0} />
        <StatCard label="Active Visits" value={stats?.activeVisits ?? 0} />
        <StatCard label="Today's Visits" value={stats?.todaysVisits ?? 0} />
        <StatCard label="This Week's Visits" value={stats?.thisWeeksVisits ?? 0} />
      </div>
    </DashboardShell>
  );
}
