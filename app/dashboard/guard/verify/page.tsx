"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface VisitResult {
  id: string;
  visit_code: string;
  status: string;
  checked_in_at: string | null;
  visitor: { full_name: string; photo_url: string | null; id_verified: boolean; vehicle_plate: string | null } | null;
  resident: { full_name: string } | null;
  room: { room_number: string; block: string } | null;
  invitation: { visit_start: string; visit_end: string; status: string } | null;
}

export default function VerifyVisitorPage() {
  const { user: profile } = useAuth();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<VisitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { show, ToastComponent } = useToast();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setResult(null);

    const { data } = await supabase
      .from("visits")
      .select("*, visitor:visitor_profiles(full_name, photo_url, id_verified, vehicle_plate), resident:profiles!visits_resident_id_fkey(full_name), room:rooms(room_number, block), invitation:invitations(visit_start, visit_end, status)")
      .eq("visit_code", code.trim().toUpperCase())
      .single();

    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setResult(data as VisitResult);
    setLoading(false);
  }

  async function handleAction(action: "check_in" | "check_out" | "deny") {
    if (!result || !profile) return;

    const statusMap = { check_in: "checked_in", check_out: "checked_out", deny: "denied" };
    const update: any = { status: statusMap[action], updated_at: new Date().toISOString() };
    if (action === "check_in") update.checked_in_at = new Date().toISOString();
    if (action === "check_out") update.checked_out_at = new Date().toISOString();

    await supabase.from("visits").update(update).eq("id", result.id);

    await supabase.from("visit_logs").insert({
      visit_id: result.id,
      action: action === "check_in" ? "checked_in" : action === "check_out" ? "checked_out" : "denied",
      performed_by: profile.id,
    });

    await supabase.from("audit_logs").insert({
      user_id: profile.id,
      action: `visit_${action === "check_in" ? "checked_in" : action === "check_out" ? "checked_out" : "denied"}`,
      entity_type: "visit",
      entity_id: result.id,
      details: { visit_code: result.visit_code, visitor_name: result.visitor?.full_name },
    });

    show(`Visitor ${action === "check_in" ? "checked in" : action === "check_out" ? "checked out" : "denied"}.`);
    setResult(null);
    setCode("");
  }

  const canCheckIn = result && result.status === "authorized";
  const canCheckOut = result && result.status === "checked_in";

  return (
    <DashboardShell role="guard" roleLabel="Guard" personName={profile?.full_name ?? "Guard"}>
      {ToastComponent}
      <PageHeader title="Verify Visitor" description="Scan a QR code or enter a visit code." />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Search */}
        <div className="rounded-card border border-ink/15 bg-ink p-6 text-parchment">
          <h2 className="font-display text-xl italic">Enter visit code</h2>
          <form onSubmit={handleSearch} className="mt-5">
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VF-2941"
              className="border-parchment/25 bg-ink-light text-parchment placeholder:text-parchment/40"
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="focus-ring mt-3 w-full rounded-card bg-brass px-4 py-2.5 text-sm font-medium text-ink hover:bg-brass-light disabled:opacity-60"
            >
              {loading ? "Searching…" : "Verify"}
            </button>
          </form>
          {notFound && (
            <p className="mt-3 text-sm text-red-300">No visit found with that code.</p>
          )}
        </div>

        {/* Result */}
        <div>
          {result ? (
            <div className={`rounded-card border p-6 ${
              result.status === "denied" ? "border-red-300 bg-red-50" : "border-sage bg-parchment-dim"
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-ink/10 text-ink/40 flex items-center justify-center text-xl font-medium">
                    {result.visitor?.photo_url ? (
                      <img src={result.visitor.photo_url} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      result.visitor?.full_name?.charAt(0) ?? "?"
                    )}
                  </div>
                  <div>
                    <p className="font-display text-lg text-ink">{result.visitor?.full_name ?? "Unknown"}</p>
                    <p className="text-sm text-ink/60">Visit {result.visit_code}</p>
                    {result.visitor?.vehicle_plate && (
                      <p className="text-xs text-ink/50">Vehicle: {result.visitor.vehicle_plate}</p>
                    )}
                  </div>
                </div>
                <span className={`rounded-sm border px-2.5 py-1 font-mono text-xs uppercase ${
                  result.status === "checked_in" ? "border-blue-200 bg-blue-50 text-blue-700" :
                  result.status === "authorized" ? "border-sage/20 bg-sage/10 text-sage-dim" :
                  result.status === "denied" ? "border-red-300 bg-red-50 text-red-700" :
                  "border-ink/20 bg-ink/5 text-ink/50"
                }`}>
                  {result.status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="mt-5 space-y-3 border-t border-ink/10 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-ink/60">Resident</span>
                  <span className="font-medium text-ink">{result.resident?.full_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink/60">Room</span>
                  <span className="font-medium text-ink">{result.room?.room_number}, {result.room?.block}</span>
                </div>
                {result.invitation && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink/60">Valid from</span>
                      <span className="text-ink">{new Date(result.invitation.visit_start).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink/60">Valid until</span>
                      <span className="text-ink">{new Date(result.invitation.visit_end).toLocaleString()}</span>
                    </div>
                  </>
                )}
                {result.checked_in_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ink/60">Checked in at</span>
                    <span className="text-ink">{new Date(result.checked_in_at).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                {canCheckIn && (
                  <button onClick={() => handleAction("check_in")} className="focus-ring rounded-card bg-sage px-4 py-2.5 text-sm font-medium text-parchment hover:bg-sage-dim">
                    Check In
                  </button>
                )}
                {canCheckOut && (
                  <button onClick={() => handleAction("check_out")} className="focus-ring rounded-card bg-ink px-4 py-2.5 text-sm font-medium text-parchment hover:bg-ink-light">
                    Check Out
                  </button>
                )}
                {result.status !== "denied" && result.status !== "checked_out" && (
                  <button onClick={() => handleAction("deny")} className="focus-ring rounded-card border border-red-300 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50">
                    Deny
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-card border border-ink/15 bg-parchment-dim p-6">
              <p className="text-sm text-ink/50">Enter a visit code or scan a QR code to verify a visitor.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
