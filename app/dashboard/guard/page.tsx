"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/auth";

interface ScanResult {
  visitor_name: string;
  resident_name: string;
  room: string;
  visit_code: string;
  status: string;
  authorized_at: string;
  valid: boolean;
  error?: string;
}

interface LogEntry {
  id: string;
  visit_id: string;
  action: string;
  created_at: string;
  visits: {
    id: string;
    visit_code: string;
    profiles: { full_name: string } | null;
    rooms: { room_number: string; block: string } | null;
  } | null;
}

export default function GuardDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
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

      await loadLog();
      setLoading(false);
    }
    load();
  }, []);

  async function loadLog() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("visit_logs")
      .select("*, visits(visit_code, profiles:visitor_id(full_name), rooms:room_id(room_number, block))")
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false });

    setLog((data as unknown as LogEntry[]) ?? []);
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setScanning(true);
    setScanResult(null);

    const code = scanInput.trim().toUpperCase();

    // Look up the visit by code
    const { data: visit } = await supabase
      .from("visits")
      .select("*, profiles:visitor_id(full_name), rooms:room_id(room_number, block), resident:resident_id(full_name)")
      .eq("visit_code", code)
      .single();

    if (!visit) {
      setScanResult({
        visitor_name: "",
        resident_name: "",
        room: "",
        visit_code: code,
        status: "",
        authorized_at: "",
        valid: false,
        error: "Visit code not found.",
      });
      setScanning(false);
      return;
    }

    const visitorName = (visit as any).profiles?.full_name ?? "Unknown";
    const residentName = (visit as any).resident?.full_name ?? "Unknown";
    const roomInfo = (visit as any).rooms
      ? `${(visit as any).rooms.room_number}, ${(visit as any).rooms.block}`
      : "Unknown";

    if (visit.status !== "authorized") {
      setScanResult({
        visitor_name: visitorName,
        resident_name: residentName,
        room: roomInfo,
        visit_code: code,
        status: visit.status,
        authorized_at: visit.created_at,
        valid: false,
        error: visit.status === "checked_in" ? "Visitor already checked in." : `Visit is ${visit.status}.`,
      });
      setScanning(false);
      return;
    }

    setScanResult({
      visitor_name: visitorName,
      resident_name: residentName,
      room: roomInfo,
      visit_code: code,
      status: visit.status,
      authorized_at: visit.created_at,
      valid: true,
    });
    setScanning(false);
  }

  async function handleCheckIn() {
    if (!scanResult) return;

    const { data: visit } = await supabase
      .from("visits")
      .select("id")
      .eq("visit_code", scanResult.visit_code)
      .single();

    if (!visit) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("visits")
      .update({ status: "checked_in", checked_in_at: new Date().toISOString() })
      .eq("id", visit.id);

    await supabase.from("visit_logs").insert({
      visit_id: visit.id,
      action: "checked_in",
      performed_by: user?.id,
    });

    setScanResult(null);
    setScanInput("");
    await loadLog();
  }

  async function handleCheckOut(visitId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("visits")
      .update({ status: "checked_out", checked_out_at: new Date().toISOString() })
      .eq("id", visitId);

    await supabase.from("visit_logs").insert({
      visit_id: visitId,
      action: "checked_out",
      performed_by: user?.id,
    });

    await loadLog();
  }

  if (loading || !profile) {
    return (
      <DashboardShell role="guard" roleLabel="Guard" personName="Loading…">
        <p className="font-mono text-[13px] text-brass-dark">Loading…</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="guard" roleLabel="Guard" personName={profile.full_name}>
      <h1 className="font-display text-3xl italic text-ink">Main gate</h1>

      <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-card border border-ink/15 bg-ink p-6 text-parchment">
          <h2 className="font-display text-xl italic">Scan a pass</h2>
          <div className="mt-5 flex aspect-square items-center justify-center rounded-card border-2 border-dashed border-parchment/25">
            <div className="text-center">
              <div className="mx-auto grid grid-cols-5 gap-1 opacity-40" aria-hidden="true">
                {Array.from({ length: 25 }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-2 w-2 ${
                      [0, 2, 4, 5, 9, 10, 14, 15, 19, 20, 22, 24, 12, 6, 8, 16, 18].includes(i)
                        ? "bg-parchment"
                        : "bg-transparent"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm text-parchment/60">Camera preview</p>
            </div>
          </div>
          <form onSubmit={handleScan} className="mt-5">
            <label className="mb-1.5 block text-sm font-medium text-parchment/80">
              Or enter the visit code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="VF-2941"
                className="focus-ring flex-1 rounded-sm border border-parchment/25 bg-ink-light px-3.5 py-2.5 font-mono text-[15px] text-parchment outline-none placeholder:text-parchment/40"
              />
              <button
                type="submit"
                disabled={scanning}
                className="focus-ring rounded-card bg-brass px-4 py-2.5 text-sm font-medium text-ink hover:bg-brass-light disabled:opacity-60"
              >
                {scanning ? "Verifying…" : "Verify"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-card border border-ink/15 bg-parchment-dim p-6">
          <h2 className="font-display text-xl text-ink">Last scan result</h2>
          {scanResult ? (
            <div
              className={`mt-4 rounded-sm border px-5 py-4 ${
                scanResult.valid ? "border-sage bg-parchment" : "border-red-300 bg-red-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-lg text-ink">
                  {scanResult.valid ? scanResult.visitor_name : "Verification failed"}
                </p>
                <span
                  className={`rounded-sm border px-2 py-1 font-mono text-[11px] uppercase ${
                    scanResult.valid
                      ? "border-sage-light text-sage-dim"
                      : "border-red-300 text-red-700"
                  }`}
                >
                  {scanResult.valid ? "Match" : "No match"}
                </span>
              </div>
              {scanResult.valid ? (
                <>
                  <p className="mt-1 text-sm text-ink/60">
                    Visiting {scanResult.room} · Host: {scanResult.resident_name}
                  </p>
                  <p className="mt-1 font-mono text-xs text-ink/50">
                    Visit {scanResult.visit_code} · Authorized {new Date(scanResult.authorized_at).toLocaleString()}
                  </p>
                  <button
                    onClick={handleCheckIn}
                    className="focus-ring mt-4 rounded-card bg-ink px-4 py-2 text-sm text-parchment hover:bg-ink-light"
                  >
                    Confirm check-in
                  </button>
                </>
              ) : (
                <p className="mt-1 text-sm text-red-600">{scanResult.error}</p>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-sm border border-ink/10 bg-parchment px-5 py-4">
              <p className="text-sm text-ink/50">Scan or enter a code to see results.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl text-ink">Today&apos;s log</h2>
        {log.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">No activity today.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-card border border-ink/15">
            <table className="w-full min-w-[480px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/15 bg-parchment-dim text-sm text-ink/60">
                  <th className="px-6 py-3 font-medium">Time</th>
                  <th className="px-6 py-3 font-medium">Visitor</th>
                  <th className="px-6 py-3 font-medium">Room</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {log.map((l) => (
                  <tr key={l.id} className="border-b border-ink/10 last:border-b-0">
                    <td className="px-6 py-3 font-mono text-sm text-ink/70">
                      {new Date(l.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-3 text-[15px] text-ink">
                      {l.visits?.profiles?.full_name ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-[15px] text-ink/70">
                      {l.visits?.rooms
                        ? `${l.visits.rooms.room_number}, ${l.visits.rooms.block}`
                        : "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-sage-dim capitalize">{l.action.replace("_", " ")}</td>
                    <td className="px-6 py-3">
                      {l.action === "checked_in" && (
                        <button
                          onClick={() => l.visits && handleCheckOut(l.visits.id)}
                          className="focus-ring rounded-card border border-ink/20 px-3 py-1 text-xs text-ink hover:border-ink/40"
                        >
                          Check out
                        </button>
                      )}
                    </td>
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
