"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import StatCard from "@/components/ui/StatCard";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/context/AuthContext";

interface TodayLog {
  id: string;
  action: string;
  created_at: string;
  visit: { visitor: { full_name: string } | null; room: { room_number: string; block: string } | null } | null;
}

export default function GuardDashboard() {
  const { user: profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    visitorsToday: 0,
    currentlyInside: 0,
    pendingVerification: 0,
    flaggedActivity: 0,
  });
  const [log, setLog] = useState<TodayLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !profile) return;

    async function load() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [inside, todayCount, pending, flagged, logs] = await Promise.all([
        supabase.from("visits").select("*", { count: "exact", head: true }).in("status", ["approved"]),
        supabase.from("visits").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        supabase.from("visits").select("*", { count: "exact", head: true }).eq("status", "authorized"),
        supabase.from("activity_reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase
          .from("visit_logs")
          .select("*, visit:visits(visitor:visitor_profiles(full_name), room:rooms(room_number, block))")
          .gte("created_at", today.toISOString())
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      setStats({
        visitorsToday: todayCount.count ?? 0,
        currentlyInside: inside.count ?? 0,
        pendingVerification: pending.count ?? 0,
        flaggedActivity: flagged.count ?? 0,
      });

      setLog((logs ?? []) as TodayLog[]);
      setLoading(false);
    }
    load();
  }, [authLoading, profile]);

  if (authLoading || loading || !profile) {
    return (
      <DashboardShell role="guard" roleLabel="Guard" personName="Loading…">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
          ))}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="guard" roleLabel="Guard" personName={profile.full_name}>
      <h1 className="font-display text-3xl italic text-ink">Main Gate</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Visitors Today" value={stats.visitorsToday} />
        <StatCard label="Currently Inside" value={stats.currentlyInside} />
        <StatCard label="Pending Verification" value={stats.pendingVerification} />
        <StatCard label="Flagged Activity" value={stats.flaggedActivity} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <a href="/dashboard/guard/verify" className="focus-ring rounded-card bg-ink px-5 py-2.5 text-sm font-medium text-parchment hover:bg-ink-light">
          Verify Visitor
        </a>
        <a href="/dashboard/guard/active" className="focus-ring rounded-card border border-ink/20 px-5 py-2.5 text-sm text-ink hover:border-ink/40">
          Active Visitors
        </a>
        <a href="/dashboard/guard/log" className="focus-ring rounded-card border border-ink/20 px-5 py-2.5 text-sm text-ink hover:border-ink/40">
          Visit Log
        </a>
      </div>

      {log.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl text-ink">Recent Activity</h2>
          <div className="mt-4 overflow-hidden rounded-card border border-ink/15">
            <table className="w-full min-w-[400px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/15 bg-parchment-dim text-sm text-ink/60">
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Visitor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {log.map((l) => (
                  <tr key={l.id} className="border-b border-ink/5 last:border-b-0">
                    <td className="px-4 py-3 font-mono text-sm text-ink/70">{new Date(l.created_at).toLocaleTimeString()}</td>
                    <td className="px-4 py-3 text-[15px] text-ink">{(l.visit as any)?.visitor?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-sage-dim capitalize">{l.action.replace(/_/g, " ")}</td>
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
