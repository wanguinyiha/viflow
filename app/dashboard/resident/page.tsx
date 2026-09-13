"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import StatCard from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/context/AuthContext";

interface RecentVisit {
  id: string;
  status: string;
  created_at: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  visitor: { full_name: string } | null;
  room: { room_number: string; block: string } | null;
}

interface RoomAssignment {
  room: { room_number: string; block: string; floor: number } | null;
}

export default function ResidentDashboard() {
  const { user: profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    activeVisitors: 0,
    maxActiveVisitors: 4,
    pendingInvitations: 0,
    totalVisits: 0,
  });
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);
  const [roomAssignment, setRoomAssignment] = useState<RoomAssignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!profile) return;

      // Fetch room assignment from resident_profiles
      const { data: residentProfile } = await supabase
        .from("resident_profiles")
        .select("room:rooms(room_number, block, floor)")
        .eq("user_id", profile.id)
        .single();

      if (residentProfile) {
        setRoomAssignment(residentProfile as RoomAssignment);
      }

      const [active, pending, total, recent] = await Promise.all([
        supabase.from("visits").select("*", { count: "exact", head: true }).eq("resident_id", profile.id).in("status", ["checked_in"]),
        supabase.from("invitations").select("*", { count: "exact", head: true }).eq("resident_id", profile.id).eq("status", "pending"),
        supabase.from("visits").select("*", { count: "exact", head: true }).eq("resident_id", profile.id),
        supabase.from("visits").select("*, visitor:visitor_profiles(full_name), room:rooms(room_number, block)").eq("resident_id", profile.id).order("created_at", { ascending: false }).limit(5),
      ]);

      setStats({
        activeVisitors: active.count ?? 0,
        maxActiveVisitors: 4,
        pendingInvitations: pending.count ?? 0,
        totalVisits: total.count ?? 0,
      });

      setRecentVisits((recent.data ?? []) as RecentVisit[]);
      setLoading(false);
    }
    load();
  }, [profile]);

  if (authLoading || loading || !profile) {
    return (
      <DashboardShell role="resident" roleLabel="Resident" personName="Loading…">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
          ))}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="resident" roleLabel="Resident" personName={profile.full_name}>
      <h1 className="font-display text-3xl italic text-ink">Welcome, {profile.full_name.split(" ")[0]}.</h1>

      {roomAssignment?.room && (
        <div className="mt-4 rounded-card border border-sage/30 bg-sage/5 p-4">
          <p className="text-sm text-ink/60">Your Room</p>
          <p className="font-display text-xl text-ink">
            Block {roomAssignment.room.block} — Room {roomAssignment.room.room_number.replace(/^[AB]-/, "")}
          </p>
        </div>
      )}

      {!roomAssignment?.room && (
        <div className="mt-4 rounded-card border border-brass/30 bg-brass/5 p-4">
          <p className="text-sm text-ink/60">No room assigned yet. Contact an administrator.</p>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Visitors"
          value={`${stats.activeVisitors} / ${stats.maxActiveVisitors}`}
          description={stats.activeVisitors === 4 ? "Max capacity reached" : undefined}
        />
        <StatCard label="Pending Invitations" value={stats.pendingInvitations} />
        <StatCard label="Total Visits" value={stats.totalVisits} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <a href="/dashboard/resident/invitations/new" className="focus-ring rounded-card bg-ink px-5 py-2.5 text-sm font-medium text-parchment hover:bg-ink-light">
          Invite Visitor
        </a>
        <a href="/dashboard/resident/favourites" className="focus-ring rounded-card border border-ink/20 px-5 py-2.5 text-sm text-ink hover:border-ink/40">
          Favourite Visitors
        </a>
        <a href="/dashboard/resident/active" className="focus-ring rounded-card border border-ink/20 px-5 py-2.5 text-sm text-ink hover:border-ink/40">
          Active Visitors
        </a>
        <a href="/dashboard/resident/history" className="focus-ring rounded-card border border-ink/20 px-5 py-2.5 text-sm text-ink hover:border-ink/40">
          Visit History
        </a>
      </div>

      {recentVisits.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl text-ink">Recent Visits</h2>
          <div className="mt-4 overflow-hidden rounded-card border border-ink/15">
            <table className="w-full min-w-[500px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/15 bg-parchment-dim text-sm text-ink/60">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Visitor</th>
                  <th className="px-4 py-3 font-medium">Check In</th>
                  <th className="px-4 py-3 font-medium">Check Out</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentVisits.map((v) => (
                  <tr key={v.id} className="border-b border-ink/5 last:border-b-0">
                    <td className="px-4 py-3 font-mono text-sm text-ink/70">{new Date(v.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-[15px] text-ink">{v.visitor?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-sm text-ink/70">{v.checked_in_at ? new Date(v.checked_in_at).toLocaleTimeString() : "—"}</td>
                    <td className="px-4 py-3 font-mono text-sm text-ink/70">{v.checked_out_at ? new Date(v.checked_out_at).toLocaleTimeString() : "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={v.status} type="visit" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
