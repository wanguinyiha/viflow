"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import FormField, { Input, Textarea } from "@/components/ui/FormField";
import { useAuth } from "@/lib/context/AuthContext";
import { createInvitation, getActiveVisitCount } from "@/lib/api/invitations";
import { supabase } from "@/lib/supabaseClient";

function CreateInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillVisitorId = searchParams.get("visitor");
  const { user: profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [activeVisits, setActiveVisits] = useState(0);
  const [email, setEmail] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [reason, setReason] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [residentRoomId, setResidentRoomId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!profile) return;

      // Get resident's room from resident_profiles
      const { data: residentProfile } = await supabase
        .from("resident_profiles")
        .select("room_id")
        .eq("user_id", profile.id)
        .single();

      if (residentProfile) {
        setResidentRoomId(residentProfile.room_id);
      }

      // Check active visit count
      const count = await getActiveVisitCount(profile.id);
      setActiveVisits(count);

      // If prefilling from favourite, load visitor info
      if (prefillVisitorId) {
        const { data: visitor } = await supabase
          .from("visitor_profiles")
          .select("email, full_name")
          .eq("id", prefillVisitorId)
          .single();

        if (visitor) {
          setEmail(visitor.email);
          setVisitorName(visitor.full_name);
        }
      }

      setLoading(false);
    }
    load();
  }, [profile, prefillVisitorId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");

    if (!profile) return;

    // Check 4-active-visitor limit
    if (activeVisits >= 4) {
      setError("You have reached the maximum of 4 active visitors. Please wait for a visitor to check out before creating a new invitation.");
      setSending(false);
      return;
    }

    if (!residentRoomId) {
      setError("You need a room assigned to create invitations. Contact an administrator.");
      setSending(false);
      return;
    }

    // Check if visitor already exists
    let visitorId = prefillVisitorId;
    if (!visitorId && email) {
      const { data: existingVisitor } = await supabase
        .from("visitor_profiles")
        .select("id")
        .eq("email", email)
        .single();
      visitorId = existingVisitor?.id;
    }

    const { data: invitation, error: insertError } = await createInvitation({
      resident_id: profile.id,
      visitor_email: email,
      visitor_name: visitorName || undefined,
      visitor_id: visitorId || undefined,
      room_id: residentRoomId,
      visit_start: arrivalDate,
      reason: reason || undefined,
      vehicle_registration: vehiclePlate || undefined,
    });

    if (insertError) {
      setError(insertError.message);
      setSending(false);
      return;
    }

    // Send email (non-blocking, with status feedback)
    if (invitation) {
      setEmailSent(true);
      fetch("/api/email/invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: invitation.id }),
      })
        .then((res) => {
          if (!res.ok) console.error("Email send failed");
        })
        .catch(console.error);
    }

    router.push("/dashboard/resident/invitations");
  }

  if (loading || !profile) {
    return (
      <DashboardShell role="resident" roleLabel="Resident" personName="Loading…">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    );
  }

  const atLimit = activeVisits >= 4;

  return (
    <DashboardShell role="resident" roleLabel="Resident" personName={profile.full_name}>
      <PageHeader title="Create Invitation" description="Send an invitation to a visitor." />

      <div className="mt-8 max-w-lg">
        {atLimit && (
          <div className="mb-6 rounded-sm border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You have reached the maximum of 4 active visitors ({activeVisits}/4). You cannot create new invitations until a visitor checks out.
          </div>
        )}

        {!residentRoomId && (
          <div className="mb-6 rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            You do not have a room assigned. Contact an administrator to assign a room before creating invitations.
          </div>
        )}

        {emailSent && (
          <div className="mb-6 rounded-sm border border-sage bg-sage/5 px-4 py-3 text-sm text-sage-dim">
            Invitation created! An email has been sent to the visitor.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}

          <div className="rounded-card border border-ink/15 bg-parchment-dim p-4">
            <p className="text-sm text-ink/60">
              Active visitors: <span className="font-medium text-ink">{activeVisits}/4</span>
            </p>
          </div>

          <FormField label="Visitor Email" htmlFor="email" required>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="visitor@example.com" disabled={atLimit} />
          </FormField>
          <FormField label="Visitor Name (optional)" htmlFor="name" helpText="If the visitor is already registered, this is for reference only.">
            <Input id="name" type="text" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} placeholder="Amara Kimani" disabled={atLimit} />
          </FormField>
          <FormField label="Arrival Date" htmlFor="arrival" required helpText="The guard will check out the visitor when they leave.">
            <Input id="arrival" type="datetime-local" required value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} disabled={atLimit} />
          </FormField>
          <FormField label="Reason (optional)" htmlFor="reason">
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Personal visit, study session, etc." disabled={atLimit} rows={3} />
          </FormField>
          <FormField label="Vehicle Registration (optional)" htmlFor="plate">
            <Input id="plate" type="text" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} placeholder="KDA 214B" disabled={atLimit} />
          </FormField>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={sending || atLimit || !residentRoomId} className="focus-ring rounded-card bg-ink px-5 py-2.5 text-sm font-medium text-parchment hover:bg-ink-light disabled:opacity-60">
              {sending ? "Sending…" : "Send Invitation"}
            </button>
            <a href="/dashboard/resident" className="focus-ring rounded-card border border-ink/20 px-5 py-2.5 text-sm text-ink hover:border-ink/40">
              Cancel
            </a>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}

export default function CreateInvitationPage() {
  return (
    <Suspense fallback={
      <DashboardShell role="resident" roleLabel="Resident" personName="Loading…">
        <div className="h-96 animate-pulse rounded-card border border-ink/10 bg-parchment-dim" />
      </DashboardShell>
    }>
      <CreateInvitationContent />
    </Suspense>
  );
}
