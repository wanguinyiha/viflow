"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { showToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/context/AuthContext";

interface ActiveVisit {
  id: string;
  status: string;
  checked_in_at: string | null;
  created_at: string;
  visitor: { full_name: string; photo_url: string | null } | null;
  room: { room_number: string; block: string } | null;
  invitation: { reason: string | null; visit_start: string } | null;
}

export default function ActiveVisitsPage() {
  const { user: profile, loading: authLoading } = useAuth();
  const [visits, setVisits] = useState<ActiveVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<ActiveVisit | null>(null);

  useEffect(() => {
    async function load() {
      if (!profile) return;

      const { data } = await supabase
        .from("visits")
        .select("*, visitor:visitor_profiles(full_name, photo_url), room:rooms(room_number, block), invitation:invitations(reason, visit_start)")
        .eq("resident_id", profile.id)
        .in("status", ["authorized", "approved", "checked_in"])
        .order("created_at", { ascending: false });

      setVisits((data ?? []) as ActiveVisit[]);
      setLoading(false);
    }
    load();
  }, [profile]);

  async function handleCancelVisit() {
    if (!cancelTarget || !profile) return;

    const { error } = await supabase
      .from("visits")
      .update({ status: "denied", updated_at: new Date().toISOString() })
      .eq("id", cancelTarget.id);

    if (error) {
      showToast("Failed to cancel visit.");
      return;
    }

    await supabase.from("visit_logs").insert({
      visit_id: cancelTarget.id,
      action: "cancelled_by_resident",
      performed_by: profile.id,
      notes: "Cancelled by resident",
    });

    showToast("Visit cancelled.");
    setVisits((prev) => prev.filter((v) => v.id !== cancelTarget.id));
    setCancelTarget(null);
  }

  if (authLoading || loading || !profile) {
    return (
      <DashboardShell role="resident" roleLabel="Resident" personName="Loading…">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="resident" roleLabel="Resident" personName={profile.full_name}>
      <PageHeader title="Active Visits" description="Visitors currently expected or checked in." />

      <div className="mt-8">
        {visits.length === 0 ? (
          <EmptyState title="No active visits" description="No visitors are currently expected or checked in." />
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => (
              <div key={visit.id} className="rounded-card border border-ink/15 bg-parchment-dim p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-ink/10 text-ink/40 flex items-center justify-center text-lg font-medium">
                      {visit.visitor?.photo_url ? (
                        <img src={visit.visitor.photo_url} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        visit.visitor?.full_name?.charAt(0) ?? "?"
                      )}
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-ink">{visit.visitor?.full_name ?? "Unknown"}</p>
                      <p className="text-sm text-ink/50">
                        {visit.room?.block} — Room {visit.room?.room_number.replace(/^[AB]-/, "")}
                      </p>
                      {visit.invitation?.reason && (
                        <p className="mt-1 text-xs text-ink/40">Reason: {visit.invitation.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs uppercase ${
                        visit.status === "checked_in"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : visit.status === "approved"
                          ? "border-sage/20 bg-sage/10 text-sage-dim"
                          : "border-brass/20 bg-brass/10 text-brass-dark"
                      }`}>
                        {visit.status === "checked_in" ? "Checked In" : visit.status === "approved" ? "Approved" : "Awaiting Approval"}
                      </span>
                      {visit.checked_in_at && (
                        <p className="mt-1 text-xs text-ink/40">
                          Since {new Date(visit.checked_in_at).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    {visit.status === "authorized" && (
                      <button
                        onClick={() => setCancelTarget(visit)}
                        className="focus-ring rounded-sm border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelVisit}
        title="Cancel Visit"
        message={`Are you sure you want to cancel the visit from ${cancelTarget?.visitor?.full_name ?? "this visitor"}? They will no longer be able to check in.`}
        confirmLabel="Cancel Visit"
        variant="danger"
      />
    </DashboardShell>
  );
}
