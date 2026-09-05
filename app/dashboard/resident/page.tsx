"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/auth";

interface Invitation {
  id: string;
  visitor_email: string;
  visit_date: string;
  reason: string | null;
  status: string;
}

interface Visit {
  id: string;
  visit_code: string;
  status: string;
  created_at: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  visitor_id: string;
  profiles: { full_name: string } | null;
  rooms: { room_number: string; block: string } | null;
}

export default function ResidentDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDate, setInviteDate] = useState("");
  const [inviteReason, setInviteReason] = useState("");
  const [sending, setSending] = useState(false);

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

      const { data: invs } = await supabase
        .from("invitations")
        .select("*")
        .eq("resident_id", user.id)
        .order("created_at", { ascending: false });
      setInvitations((invs as Invitation[]) ?? []);

      const { data: vsts } = await supabase
        .from("visits")
        .select("*, profiles:visitor_id(full_name), rooms:room_id(room_number, block)")
        .eq("resident_id", user.id)
        .order("created_at", { ascending: false });
      setVisits((vsts as unknown as Visit[]) ?? []);

      setLoading(false);
    }
    load();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get the resident's room
    const { data: room } = await supabase
      .from("rooms")
      .select("id")
      .eq("resident_id", user.id)
      .single();

    await supabase.from("invitations").insert({
      resident_id: user.id,
      visitor_email: inviteEmail,
      visit_date: inviteDate,
      reason: inviteReason || null,
    });

    setInviteEmail("");
    setInviteDate("");
    setInviteReason("");
    setSending(false);

    // Reload invitations
    const { data: invs } = await supabase
      .from("invitations")
      .select("*")
      .eq("resident_id", user.id)
      .order("created_at", { ascending: false });
    setInvitations((invs as Invitation[]) ?? []);
  }

  if (loading || !profile) {
    return (
      <DashboardShell role="resident" roleLabel="Resident" personName="Loading…">
        <p className="font-mono text-[13px] text-brass-dark">Loading…</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="resident" roleLabel="Resident" personName={profile.full_name}>
      <h1 className="font-display text-3xl italic text-ink">Welcome, {profile.full_name.split(" ")[0]}.</h1>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-card border border-ink/15 bg-parchment-dim p-6">
          <h2 className="font-display text-xl text-ink">Invite a visitor</h2>
          <form onSubmit={handleInvite} className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/80">Visitor&apos;s email</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="focus-ring w-full rounded-sm border border-ink/20 bg-parchment px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink/40"
                placeholder="visitor@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/80">When are they visiting?</label>
              <input
                type="datetime-local"
                required
                value={inviteDate}
                onChange={(e) => setInviteDate(e.target.value)}
                className="focus-ring w-full rounded-sm border border-ink/20 bg-parchment px-3.5 py-2.5 text-[15px] text-ink outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/80">Reason (optional)</label>
              <input
                type="text"
                value={inviteReason}
                onChange={(e) => setInviteReason(e.target.value)}
                className="focus-ring w-full rounded-sm border border-ink/20 bg-parchment px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink/40"
                placeholder="Personal visit"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="focus-ring rounded-card bg-ink px-5 py-3 text-sm font-medium text-parchment hover:bg-ink-light disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send invitation"}
            </button>
          </form>
        </div>

        <div className="rounded-card border border-ink/15 bg-parchment-dim p-6">
          <h2 className="font-display text-xl text-ink">Awaiting your authorization</h2>
          {invitations.filter((i) => i.status === "pending").length === 0 ? (
            <p className="mt-4 text-sm text-ink/50">No pending invitations.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {invitations
                .filter((i) => i.status === "pending")
                .map((inv) => (
                  <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-ink/10 bg-parchment px-4 py-3">
                    <div>
                      <p className="text-[15px] text-ink">{inv.visitor_email}</p>
                      <p className="text-sm text-ink/60">
                        {new Date(inv.visit_date).toLocaleString()}
                        {inv.reason ? ` · ${inv.reason}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          // Get the resident's room
                          const {
                            data: { user },
                          } = await supabase.auth.getUser();
                          if (!user) return;

                          const { data: room } = await supabase
                            .from("rooms")
                            .select("id")
                            .eq("resident_id", user.id)
                            .single();

                          if (!room) {
                            alert("You need a room assigned to authorize visits. Ask an admin to assign you a room.");
                            return;
                          }

                          // Look up visitor's profile by email
                          const { data: visitorProfile } = await supabase
                            .from("profiles")
                            .select("id")
                            .eq("email", inv.visitor_email)
                            .eq("role", "visitor")
                            .single();

                          if (!visitorProfile) {
                            alert(`Visitor with email ${inv.visitor_email} hasn't signed up yet. They need to create an account first.`);
                            return;
                          }

                          // Create the visit
                          await supabase.from("visits").insert({
                            invitation_id: inv.id,
                            visitor_id: visitorProfile.id,
                            resident_id: user.id,
                            room_id: room.id,
                            status: "authorized",
                          });

                          // Update invitation status
                          await supabase
                            .from("invitations")
                            .update({ status: "accepted" })
                            .eq("id", inv.id);

                          // Reload
                          const { data: invs } = await supabase
                            .from("invitations")
                            .select("*")
                            .eq("resident_id", user.id)
                            .order("created_at", { ascending: false });
                          setInvitations((invs as Invitation[]) ?? []);
                        }}
                        className="focus-ring rounded-card bg-sage px-3 py-1.5 text-sm text-parchment hover:bg-sage-dim"
                      >
                        Authorize
                      </button>
                      <button
                        onClick={async () => {
                          await supabase
                            .from("invitations")
                            .update({ status: "declined" })
                            .eq("id", inv.id);

                          const { data: invs } = await supabase
                            .from("invitations")
                            .select("*")
                            .eq("resident_id", (await supabase.auth.getUser()).data.user?.id ?? "")
                            .order("created_at", { ascending: false });
                          setInvitations((invs as Invitation[]) ?? []);
                        }}
                        className="focus-ring rounded-card border border-ink/20 px-3 py-1.5 text-sm text-ink hover:border-ink/40"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
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
                  <th className="px-6 py-3 font-medium">Visitor</th>
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
