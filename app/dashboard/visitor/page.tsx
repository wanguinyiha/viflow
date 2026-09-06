"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { supabase } from "@/lib/supabaseClient";
import type { Profile, VisitorProfile } from "@/lib/types";

interface Invitation {
  id: string;
  visit_date: string;
  reason: string | null;
  status: string;
  resident_id: string;
  profiles: { full_name: string } | null;
  rooms: { room_number: string; block: string } | null;
}

interface Visit {
  id: string;
  visit_code: string;
  status: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  created_at: string;
  resident_id: string;
  room_id: string;
  profiles: { full_name: string } | null;
  rooms: { room_number: string; block: string } | null;
}

export default function VisitorDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [visitorProfile, setVisitorProfile] = useState<VisitorProfile | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(prof);

      const { data: vProf } = await supabase
        .from("visitor_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setVisitorProfile(vProf);

      const { data: invs } = await supabase
        .from("invitations")
        .select("*, profiles:resident_id(full_name), rooms:rooms!invitations_room_id_fkey(room_number, block)")
        .eq("visitor_email", user.email ?? "")
        .order("created_at", { ascending: false });
      setInvitations((invs as unknown as Invitation[]) ?? []);

      const { data: vsts } = await supabase
        .from("visits")
        .select("*, profiles:resident_id(full_name), rooms:room_id(room_number, block)")
        .eq("visitor_id", user.id)
        .order("created_at", { ascending: false });
      setVisits((vsts as unknown as Visit[]) ?? []);

      setLoading(false);
    }
    load();
  }, []);

  if (loading || !profile) {
    return (
      <DashboardShell role="visitor" roleLabel="Visitor" personName="Loading…">
        <p className="font-mono text-[13px] text-brass-dark">Loading…</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="visitor" roleLabel="Visitor" personName={profile.full_name}>
      <h1 className="font-display text-3xl italic text-ink">Welcome back, {profile.full_name.split(" ")[0]}.</h1>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="perf-edge-bottom rounded-card border border-ink/15 bg-ink px-6 pb-7 pt-6 text-parchment">
          <p className="font-mono text-[11px] uppercase text-brass-light">Visitor pass</p>
          <h2 className="mt-2 font-display text-xl italic">{profile.full_name}</h2>
          <p className="mt-1 text-sm text-parchment/70">Visitor profile active</p>
          <div className="mt-5 flex items-end justify-between">
            <div className="grid grid-cols-5 gap-[3px]" aria-hidden="true">
              {Array.from({ length: 25 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-[6px] w-[6px] ${
                    [0, 2, 4, 5, 9, 10, 14, 15, 19, 20, 22, 24, 12, 6, 8, 16, 18].includes(i)
                      ? "bg-parchment"
                      : "bg-transparent"
                  }`}
                />
              ))}
            </div>
            <span className="rounded-sm border border-sage-light px-2 py-1 font-mono text-[11px] uppercase text-sage-light">
              Active
            </span>
          </div>
        </div>

        <div className="rounded-card border border-ink/15 bg-parchment-dim p-6">
          <h2 className="font-display text-xl text-ink">Your profile</h2>
          <dl className="mt-4 space-y-3 text-[15px]">
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <dt className="text-ink/60">ID document</dt>
              <dd className={visitorProfile?.id_verified ? "text-sage-dim" : "text-ink/40"}>
                {visitorProfile?.id_verified ? "Verified" : "Not uploaded"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <dt className="text-ink/60">Photo</dt>
              <dd className={visitorProfile?.photo_verified ? "text-sage-dim" : "text-ink/40"}>
                {visitorProfile?.photo_verified ? "Verified" : "Not uploaded"}
              </dd>
            </div>
            <div className="flex justify-between pb-1">
              <dt className="text-ink/60">Vehicle</dt>
              <dd className="text-ink/70">{visitorProfile?.vehicle_plate ?? "None"}</dd>
            </div>
          </dl>
          <button className="focus-ring mt-5 rounded-card border border-ink/20 px-4 py-2 text-sm text-ink hover:border-ink/40">
            Edit profile
          </button>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl text-ink">Invitations</h2>
        {invitations.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">No invitations yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-ink/10 rounded-card border border-ink/15 bg-parchment-dim">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div>
                  <p className="text-[15px] text-ink">{inv.profiles?.full_name ?? "Resident"}</p>
                  <p className="text-sm text-ink/60">
                    {inv.visit_date ? new Date(inv.visit_date).toLocaleString() : "TBD"}
                    {inv.reason ? ` · ${inv.reason}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-brass-dark capitalize">{inv.status}</span>
                  {inv.status === "pending" && (
                    <button className="focus-ring rounded-card bg-ink px-4 py-2 text-sm text-parchment hover:bg-ink-light">
                      Respond
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl text-ink">Visit history</h2>
        {visits.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">No visits yet.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-card border border-ink/15">
            <table className="w-full min-w-[420px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/15 bg-parchment-dim text-sm text-ink/60">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Host</th>
                  <th className="px-6 py-3 font-medium">Room</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id} className="border-b border-ink/10 last:border-b-0">
                    <td className="px-6 py-3 font-mono text-sm text-ink/70">
                      {new Date(v.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-[15px] text-ink">{v.profiles?.full_name ?? "—"}</td>
                    <td className="px-6 py-3 text-[15px] text-ink/70">
                      {v.rooms ? `${v.rooms.room_number}, ${v.rooms.block}` : "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-sage-dim capitalize">{v.status.replace("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
