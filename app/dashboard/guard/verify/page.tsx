"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/FormField";
import { showToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface VisitResult {
  id: string;
  visit_code: string;
  status: string;
  checked_in_at: string | null;
  visitor: { full_name: string; photo_url: string | null; id_verified: boolean; email: string } | null;
  resident: { full_name: string } | null;
  room: { room_number: string; block: string } | null;
  invitation: { visit_start: string; visit_end: string; status: string; visitor_email: string; reason: string | null; vehicle_registration: string | null } | null;
  vehicle?: { registration_number: string; make: string | null; model: string | null; color: string | null } | null;
}

export default function VerifyVisitorPage() {
  const { user: profile } = useAuth();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<VisitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setResult(null);

    const { data } = await supabase
      .from("visits")
      .select("*, visitor:visitor_profiles(full_name, photo_url, id_verified, email), resident:profiles!visits_resident_id_fkey(full_name), room:rooms(room_number, block), invitation:invitations(visit_start, visit_end, status, visitor_email, reason, vehicle_registration)")
      .eq("visit_code", code.trim().toUpperCase())
      .single();

    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Fetch vehicle info if invitation has vehicle_registration
    let enrichedData = { ...data } as VisitResult;
    if (data.visitor?.id && data.invitation?.vehicle_registration) {
      const { data: vehicle } = await supabase
        .from("vehicles")
        .select("registration_number, make, model, color")
        .eq("visitor_id", data.visitor.id)
        .eq("registration_number", data.invitation.vehicle_registration)
        .single();
      if (vehicle) {
        enrichedData = { ...enrichedData, vehicle } as any;
      }
    }

    setResult(enrichedData);
    setLoading(false);
  }

  async function handleAction(action: "check_in" | "check_out" | "deny") {
    if (!result || !profile) return;

    const statusMap = { check_in: "checked_in", check_out: "checked_out", deny: "denied" };
    const update: any = { status: statusMap[action] };
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

    showToast(`Visitor ${action === "check_in" ? "checked in" : action === "check_out" ? "checked out" : "denied"}.`);
    setResult(null);
    setCode("");
  }

  const canCheckIn = result && result.status === "authorized";
  const canCheckOut = result && result.status === "checked_in";
  const isExpired = result?.invitation && new Date(result.invitation.visit_end) < new Date();
  const isCancelled = result?.invitation?.status === "cancelled";

  return (
    <DashboardShell role="guard" roleLabel="Guard" personName={profile?.full_name ?? "Guard"}>
      <PageHeader title="Verify Visitor" description="Enter a visit code to verify a visitor." />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Search */}
        <div className="rounded-card border border-ink/15 bg-ink p-6 text-parchment">
          <h2 className="font-display text-xl italic">Enter visit code</h2>
          <p className="mt-2 text-sm text-parchment/60">Ask the visitor for their visit code (e.g., VF-A1B2)</p>
          <form onSubmit={handleSearch} className="mt-5">
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VF-A1B2"
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
                    <p className="text-sm text-ink/60">Visit Code: {result.visit_code}</p>
                    {result.visitor?.email && (
                      <p className="text-xs text-ink/50">{result.visitor.email}</p>
                    )}
                  </div>
                </div>
                <span className={`rounded-sm border px-2.5 py-1 font-mono text-xs uppercase ${
                  result.status === "checked_in" ? "border-blue-200 bg-blue-50 text-blue-700" :
                  result.status === "authorized" ? "border-sage/20 bg-sage/10 text-sage-dim" :
                  result.status === "denied" ? "border-red-300 bg-red-50 text-red-700" :
                  result.status === "checked_out" ? "border-ink/20 bg-ink/5 text-ink/50" :
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
                  <span className="font-medium text-ink">Block {result.room?.block} — Room {result.room?.room_number}</span>
                </div>
                {result.invitation && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink/60">Valid from</span>
                      <span className="text-ink">{new Date(result.invitation.visit_start).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink/60">Valid until</span>
                      <span className={`text-ink ${isExpired ? "text-red-600 font-medium" : ""}`}>
                        {new Date(result.invitation.visit_end).toLocaleString()}
                        {isExpired && " (EXPIRED)"}
                      </span>
                    </div>
                    {result.invitation.reason && (
                      <div className="flex justify-between text-sm">
                        <span className="text-ink/60">Reason</span>
                        <span className="text-ink">{result.invitation.reason}</span>
                      </div>
                    )}
                    {result.invitation.vehicle_registration && (
                      <div className="flex justify-between text-sm">
                        <span className="text-ink/60">Vehicle</span>
                        <span className="font-mono text-ink">
                          {result.invitation.vehicle_registration}
                          {result.vehicle && (
                            <span className="text-xs text-ink/50 ml-1">
                              ({result.vehicle.make} {result.vehicle.model} {result.vehicle.color})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {result.checked_in_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ink/60">Checked in at</span>
                    <span className="text-ink">{new Date(result.checked_in_at).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              {/* Warning messages */}
              {isExpired && result.status !== "denied" && result.status !== "checked_out" && (
                <div className="mt-4 rounded-sm border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  This invitation has expired. Do not allow entry.
                </div>
              )}
              {isCancelled && result.status !== "denied" && result.status !== "checked_out" && (
                <div className="mt-4 rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                  This invitation has been cancelled. Do not allow entry.
                </div>
              )}

              <div className="mt-6 flex gap-3">
                {canCheckIn && !isExpired && !isCancelled && (
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
              <p className="text-sm text-ink/50">Enter a visit code to verify a visitor. The system will show the official invitation details including the Resident, Block, Room, and visit validity.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
