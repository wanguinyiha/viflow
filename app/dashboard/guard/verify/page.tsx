"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { showToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface VisitResult {
  id: string;
  visit_code: string;
  status: string;
  checked_in_at: string | null;
  resident_id?: string;
  is_invitation_fallback?: boolean;
  invitation_id?: string;
  room_id?: string;
  visitor: { full_name: string; photo_url: string | null; id_verified: boolean; email: string; id: string } | null;
  resident: { full_name: string } | null;
  room: { room_number: string; block: string } | null;
  invitation: { visit_start: string; status: string; visitor_email: string; reason: string | null; vehicle_registration: string | null } | null;
  vehicle?: { registration_number: string; make: string | null; model: string | null; color: string | null } | null;
}

export default function VerifyVisitorPage() {
  const { user: profile } = useAuth();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<VisitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [actionDone, setActionDone] = useState<string | null>(null);
  const [denyDialogOpen, setDenyDialogOpen] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setResult(null);
    setActionDone(null);

    const trimmedCode = code.trim().toUpperCase();

    // First try: search visits table
    let { data } = await supabase
      .from("visits")
      .select("*, visitor:visitor_profiles(id, full_name, photo_url, id_verified, email), resident:profiles!visits_resident_id_fkey(full_name), room:rooms(room_number, block), invitation:invitations(visit_start, status, visitor_email, reason, vehicle_registration)")
      .eq("visit_code", trimmedCode)
      .single();

    // Fallback: search invitations table if visit not found
    if (!data) {
      const { data: invitation } = await supabase
        .from("invitations")
        .select("*, room:rooms(room_number, block), visitor:visitor_profiles(id, full_name, photo_url, id_verified, email), resident:profiles!invitations_resident_id_fkey(full_name)")
        .eq("visit_code", trimmedCode)
        .single();

      if (invitation) {
        // If visitor_id is null on invitation, try to find visitor profile by email
        let visitorData = invitation.visitor ?? null;
        if (!visitorData && invitation.visitor_email) {
          const { data: vpByEmail } = await supabase
            .from("visitor_profiles")
            .select("id, full_name, photo_url, id_verified, email")
            .eq("email", invitation.visitor_email)
            .single();
          visitorData = vpByEmail ?? null;
        }

        const mappedStatus = invitation.status === "accepted" || invitation.status === "pending" ? "authorized" : invitation.status;
        data = {
          id: invitation.id,
          visit_code: invitation.visit_code,
          status: mappedStatus,
          checked_in_at: null,
          resident_id: invitation.resident_id,
          is_invitation_fallback: true,
          invitation_id: invitation.id,
          room_id: invitation.room_id,
          visitor: visitorData,
          resident: invitation.resident ?? null,
          room: invitation.room ?? null,
          invitation: {
            visit_start: invitation.visit_start,
            status: invitation.status,
            visitor_email: invitation.visitor_email,
            reason: invitation.reason,
            vehicle_registration: invitation.vehicle_registration,
          },
        } as any;
      }
    }

    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Fetch vehicle info
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

  async function handleAction(action: "approve" | "check_out" | "deny") {
    if (!result || !profile) return;

    const isInvitationFallback = !!result.is_invitation_fallback;
    const now = new Date().toISOString();

    if (action === "approve") {
      if (isInvitationFallback) {
        if (!result.visitor?.id) {
          showToast("This visitor has not registered yet. Ask them to complete registration first.", "error");
          setLoading(false);
          return;
        }
        const { data: visit, error: visitErr } = await supabase.from("visits").insert({
          invitation_id: result.invitation_id,
          visit_code: result.visit_code,
          visitor_id: result.visitor.id,
          resident_id: result.resident_id,
          room_id: result.room_id,
          status: "approved",
          checked_in_at: now,
        }).select("id").single();

        if (visitErr) {
          console.error("Visit create error:", visitErr);
          showToast("Failed to create visit: " + visitErr.message, "error");
          setLoading(false);
          return;
        }

        if (visit) {
          await supabase.from("visit_logs").insert({ visit_id: visit.id, action: "approved", performed_by: profile.id });
          await supabase.from("audit_logs").insert({ user_id: profile.id, action: "visit_approved", entity_type: "visit", entity_id: visit.id, details: { visit_code: result.visit_code, visitor_name: result.visitor?.full_name } });
          if (result.resident_id) {
            await supabase.from("notifications").insert({ user_id: result.resident_id, title: "Visitor Approved", message: `${result.visitor?.full_name ?? "A visitor"} has been approved and checked in at your room.`, type: "visit_approved" });
          }
        }
      } else {
        await supabase.from("visits").update({ status: "approved", checked_in_at: now }).eq("id", result.id);
        await supabase.from("visit_logs").insert({ visit_id: result.id, action: "approved", performed_by: profile.id });
        await supabase.from("audit_logs").insert({ user_id: profile.id, action: "visit_approved", entity_type: "visit", entity_id: result.id, details: { visit_code: result.visit_code, visitor_name: result.visitor?.full_name } });
        if (result.resident_id) {
          await supabase.from("notifications").insert({ user_id: result.resident_id, title: "Visitor Approved", message: `${result.visitor?.full_name ?? "A visitor"} has been approved and checked in at your room.`, type: "visit_approved" });
        }
      }
    } else if (action === "check_out") {
      if (!isInvitationFallback) {
        await supabase.from("visits").update({ status: "checked_out", checked_out_at: now }).eq("id", result.id);
        await supabase.from("visit_logs").insert({ visit_id: result.id, action: "checked_out", performed_by: profile.id });
        await supabase.from("audit_logs").insert({ user_id: profile.id, action: "visit_checked_out", entity_type: "visit", entity_id: result.id, details: { visit_code: result.visit_code, visitor_name: result.visitor?.full_name } });
      }
    } else if (action === "deny") {
      if (isInvitationFallback) {
        await supabase.from("invitations").update({ status: "declined", updated_at: now }).eq("id", result.id);
        await supabase.from("audit_logs").insert({ user_id: profile.id, action: "invitation_declined", entity_type: "invitation", entity_id: result.id, details: { visit_code: result.visit_code, visitor_name: result.visitor?.full_name } });
      } else {
        await supabase.from("visits").update({ status: "denied" }).eq("id", result.id);
        await supabase.from("visit_logs").insert({ visit_id: result.id, action: "denied", performed_by: profile.id });
        await supabase.from("audit_logs").insert({ user_id: profile.id, action: "visit_denied", entity_type: "visit", entity_id: result.id, details: { visit_code: result.visit_code, visitor_name: result.visitor?.full_name } });
      }
    }

    const label = action === "approve" ? "approved" : action === "check_out" ? "checked out" : "denied";
    showToast(`Visitor ${label}.`);
    setActionDone(label);
    setResult(null);
    setCode("");
  }

  const canApprove = result && result.status === "authorized";
  const canCheckOut = result && result.status === "approved";
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
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VF-A1B2"
              className="focus-ring w-full rounded-card border-2 border-parchment/30 bg-ink-light px-4 py-3 font-mono text-xl tracking-widest text-parchment placeholder:text-parchment/30"
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
          {actionDone && (
            <p className="mt-3 text-sm text-sage-light">Last action: {actionDone}</p>
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
                    <p className="font-display text-lg text-ink">{result.visitor?.full_name ?? result.invitation?.visitor_email ?? "Unknown Visitor"}</p>
                    <p className="text-sm text-ink/60">Visit Code: {result.visit_code}</p>
                    {result.visitor?.email && (
                      <p className="text-xs text-ink/50">{result.visitor.email}</p>
                    )}
                  </div>
                </div>
                <span className={`rounded-sm border px-2.5 py-1 font-mono text-xs uppercase ${
                  result.status === "approved" ? "border-blue-200 bg-blue-50 text-blue-700" :
                  result.status === "authorized" ? "border-brass/20 bg-brass/10 text-brass-dark" :
                  result.status === "denied" ? "border-red-300 bg-red-50 text-red-700" :
                  result.status === "checked_out" ? "border-ink/20 bg-ink/5 text-ink/50" :
                  "border-ink/20 bg-ink/5 text-ink/50"
                }`}>
                  {result.status === "approved" ? "Active" : result.status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="mt-5 space-y-3 border-t border-ink/10 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-ink/60">Resident</span>
                  <span className="font-medium text-ink">{result.resident?.full_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink/60">Room</span>
                  <span className="font-medium text-ink">Block {result.room?.block} — Room {result.room?.room_number.replace(/^[AB]-/, "")}</span>
                </div>
                {result.invitation && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink/60">Arrival Date</span>
                      <span className="text-ink">{new Date(result.invitation.visit_start).toLocaleString()}</span>
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
              {isCancelled && result.status !== "denied" && result.status !== "checked_out" && (
                <div className="mt-4 rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                  This invitation has been cancelled. Do not allow entry.
                </div>
              )}

              <div className="mt-6 flex gap-3">
                {canApprove && !isCancelled && (
                  <button onClick={() => handleAction("approve")} className="focus-ring rounded-card bg-sage px-4 py-2.5 text-sm font-medium text-parchment hover:bg-sage-dim">
                    Check In
                  </button>
                )}
                {canCheckOut && (
                  <button onClick={() => handleAction("check_out")} className="focus-ring rounded-card bg-ink px-4 py-2.5 text-sm font-medium text-parchment hover:bg-ink-light">
                    Check Out
                  </button>
                )}
                {result.status !== "denied" && result.status !== "checked_out" && (
                  <button onClick={() => setDenyDialogOpen(true)} className="focus-ring rounded-card border border-red-300 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50">
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

      <ConfirmDialog
        open={denyDialogOpen}
        onClose={() => setDenyDialogOpen(false)}
        onConfirm={() => handleAction("deny")}
        title="Deny Visitor"
        message={`Are you sure you want to deny ${result?.visitor?.full_name ?? "this visitor"}? This action will be logged.`}
        confirmLabel="Deny"
        variant="danger"
      />
    </DashboardShell>
  );
}
