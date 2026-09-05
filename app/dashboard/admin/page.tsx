"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/auth";

interface Stats {
  residents: number;
  roomsOccupied: number;
  totalRooms: number;
  visitsToday: number;
  pendingAuthorizations: number;
}

interface Resident {
  id: string;
  full_name: string;
  rooms: { room_number: string; block: string } | null;
  visitsThisMonth: number;
}

interface Room {
  id: string;
  room_number: string;
  block: string;
  is_occupied: boolean;
  resident_name: string | null;
}

interface Policy {
  id: string;
  key: string;
  value: any;
}

export default function AdminDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ residents: 0, roomsOccupied: 0, totalRooms: 0, visitsToday: 0, pendingAuthorizations: 0 });
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
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

      // Stats
      const { count: residentCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "resident");

      const { count: roomCount } = await supabase
        .from("rooms")
        .select("*", { count: "exact", head: true });

      const { count: occupiedCount } = await supabase
        .from("rooms")
        .select("*", { count: "exact", head: true })
        .eq("is_occupied", true);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: visitCount } = await supabase
        .from("visits")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      const { count: pendingCount } = await supabase
        .from("invitations")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      setStats({
        residents: residentCount ?? 0,
        roomsOccupied: occupiedCount ?? 0,
        totalRooms: roomCount ?? 0,
        visitsToday: visitCount ?? 0,
        pendingAuthorizations: pendingCount ?? 0,
      });

      // Residents with their rooms
      const { data: resData } = await supabase
        .from("profiles")
        .select("id, full_name, rooms(room_number, block)")
        .eq("role", "resident");

      const residentsWithVisits = await Promise.all(
        (resData ?? []).map(async (r) => {
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          const { count } = await supabase
            .from("visits")
            .select("*", { count: "exact", head: true })
            .eq("resident_id", r.id)
            .gte("created_at", monthStart.toISOString());
          return { ...r, visitsThisMonth: count ?? 0 };
        })
      );
      setResidents(residentsWithVisits as unknown as Resident[]);

      // Rooms
      const { data: roomData } = await supabase
        .from("rooms")
        .select("*, profiles:resident_id(full_name)");
      setRooms(
        (roomData ?? []).map((r: any) => ({
          ...r,
          resident_name: r.profiles?.full_name ?? null,
        }))
      );

      // Policies
      const { data: polData } = await supabase.from("policies").select("*");
      setPolicies((polData as Policy[]) ?? []);

      setLoading(false);
    }
    load();
  }, []);

  if (loading || !profile) {
    return (
      <DashboardShell role="admin" roleLabel="Administrator" personName="Loading…">
        <p className="font-mono text-[13px] text-brass-dark">Loading…</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" roleLabel="Administrator" personName={profile.full_name}>
      <h1 className="font-display text-3xl italic text-ink">Admin Dashboard</h1>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-card border border-ink/15 bg-parchment-dim px-5 py-4">
          <p className="font-mono text-2xl text-ink">{stats.residents}</p>
          <p className="mt-1 text-sm text-ink/60">Residents</p>
        </div>
        <div className="rounded-card border border-ink/15 bg-parchment-dim px-5 py-4">
          <p className="font-mono text-2xl text-ink">{stats.roomsOccupied} / {stats.totalRooms}</p>
          <p className="mt-1 text-sm text-ink/60">Rooms occupied</p>
        </div>
        <div className="rounded-card border border-ink/15 bg-parchment-dim px-5 py-4">
          <p className="font-mono text-2xl text-ink">{stats.visitsToday}</p>
          <p className="mt-1 text-sm text-ink/60">Visits today</p>
        </div>
        <div className="rounded-card border border-ink/15 bg-parchment-dim px-5 py-4">
          <p className="font-mono text-2xl text-ink">{stats.pendingAuthorizations}</p>
          <p className="mt-1 text-sm text-ink/60">Pending authorizations</p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-ink">Residents</h2>
          </div>
          {residents.length === 0 ? (
            <p className="mt-4 text-sm text-ink/50">No residents yet.</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-card border border-ink/15">
              <table className="w-full min-w-[420px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-ink/15 bg-parchment-dim text-sm text-ink/60">
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Room</th>
                    <th className="px-6 py-3 font-medium">Visits this month</th>
                  </tr>
                </thead>
                <tbody>
                  {residents.map((r, i) => (
                    <tr key={r.id} className={i !== residents.length - 1 ? "border-b border-ink/10" : ""}>
                      <td className="px-6 py-3 text-[15px] text-ink">{r.full_name}</td>
                      <td className="px-6 py-3 text-[15px] text-ink/70">
                        {r.rooms ? `${r.rooms.room_number}, ${r.rooms.block}` : "—"}
                      </td>
                      <td className="px-6 py-3 font-mono text-sm text-ink/70">{r.visitsThisMonth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-card border border-ink/15 bg-parchment-dim p-6">
          <h2 className="font-display text-xl text-ink">Policies</h2>
          <ul className="mt-4 space-y-4 text-[15px] text-ink/75">
            {policies.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-3 border-b border-ink/10 pb-3 last:border-b-0">
                <span className="capitalize">{p.key.replace(/_/g, " ")}</span>
                <span className="font-mono text-xs text-sage-dim">{p.value === true || p.value === "true" ? "On" : "Off"}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl text-ink">Rooms</h2>
        {rooms.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">No rooms configured. Ask an admin to add rooms via the SQL editor.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-card border border-ink/15">
            <table className="w-full min-w-[420px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/15 bg-parchment-dim text-sm text-ink/60">
                  <th className="px-6 py-3 font-medium">Room</th>
                  <th className="px-6 py-3 font-medium">Block</th>
                  <th className="px-6 py-3 font-medium">Resident</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.id} className="border-b border-ink/10 last:border-b-0">
                    <td className="px-6 py-3 text-[15px] text-ink">{r.room_number}</td>
                    <td className="px-6 py-3 text-[15px] text-ink/70">{r.block}</td>
                    <td className="px-6 py-3 text-[15px] text-ink/70">{r.resident_name ?? "—"}</td>
                    <td className="px-6 py-3 text-sm text-sage-dim">{r.is_occupied ? "Occupied" : "Vacant"}</td>
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
