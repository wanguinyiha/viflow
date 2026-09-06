"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import type { Profile, Invitation } from "@/lib/types";

export default function InvitationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { show, ToastComponent } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);

      const { data } = await supabase
        .from("invitations")
        .select("*, visitor:visitor_profiles(full_name, email, phone), room:rooms(room_number, block)")
        .eq("id", params.id)
        .single();

      setInvitation(data as Invitation | null);
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function handleCancel() {
    if (!invitation) return;
    await supabase.from("invitations").update({ status: "cancelled" }).eq("id", invitation.id);
    setInvitation({ ...invitation, status: "cancelled" });
    show("Invitation cancelled.");
  }

  if (loading || !profile || !invitation) {
    return (
      <DashboardShell role="resident" roleLabel="Resident" personName="Loading…">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="resident" roleLabel="Resident" personName={profile.full_name}>
      {ToastComponent}
      <PageHeader
        title="Invitation Details"
        action={
          invitation.status === "pending" && (
            <button onClick={() => setShowCancel(true)} className="focus-ring rounded-card border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50">
              Cancel Invitation
            </button>
          )
        }
      />

      <div className="mt-8 max-w-lg">
        <div className="rounded-card border border-ink/15 bg-parchment-dim p-6 space-y-4">
          <div className="flex justify-between border-b border-ink/10 pb-3">
            <span className="text-sm text-ink/60">Visitor</span>
            <span className="text-sm font-medium text-ink">{invitation.visitor?.full_name || invitation.visitor_email}</span>
          </div>
          <div className="flex justify-between border-b border-ink/10 pb-3">
            <span className="text-sm text-ink/60">Email</span>
            <span className="text-sm text-ink">{invitation.visitor_email}</span>
          </div>
          <div className="flex justify-between border-b border-ink/10 pb-3">
            <span className="text-sm text-ink/60">Room</span>
            <span className="text-sm font-medium text-ink">{invitation.room?.room_number}, {invitation.room?.block}</span>
          </div>
          <div className="flex justify-between border-b border-ink/10 pb-3">
            <span className="text-sm text-ink/60">Status</span>
            <StatusBadge status={invitation.status} type="invitation" />
          </div>
          <div className="flex justify-between border-b border-ink/10 pb-3">
            <span className="text-sm text-ink/60">Valid From</span>
            <span className="text-sm text-ink">{new Date(invitation.visit_start).toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-b border-ink/10 pb-3">
            <span className="text-sm text-ink/60">Valid Until</span>
            <span className="text-sm text-ink">{new Date(invitation.visit_end).toLocaleString()}</span>
          </div>
          {invitation.reason && (
            <div className="flex justify-between border-b border-ink/10 pb-3">
              <span className="text-sm text-ink/60">Reason</span>
              <span className="text-sm text-ink">{invitation.reason}</span>
            </div>
          )}
          {invitation.vehicle_registration && (
            <div className="flex justify-between border-b border-ink/10 pb-3">
              <span className="text-sm text-ink/60">Vehicle</span>
              <span className="text-sm text-ink">{invitation.vehicle_registration}</span>
            </div>
          )}
          <div className="flex justify-between pb-1">
            <span className="text-sm text-ink/60">Created</span>
            <span className="text-sm text-ink">{new Date(invitation.created_at).toLocaleString()}</span>
          </div>
        </div>

        <p className="mt-6 text-sm text-ink/40">
          This invitation is valid only for the specified visit period. A new invitation is required for future visits.
        </p>
      </div>

      <ConfirmDialog
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancel}
        title="Cancel Invitation"
        message="Are you sure you want to cancel this invitation? The visitor will no longer be able to use it."
        confirmLabel="Cancel Invitation"
        variant="danger"
      />
    </DashboardShell>
  );
}
