"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import FormField, { Input, Textarea } from "@/components/ui/FormField";
import { useAuth } from "@/lib/context/AuthContext";
import { createInvitation, getActiveVisitCount } from "@/lib/api/invitations";
import { getFavouriteVisitors } from "@/lib/api/favourites";
import { supabase } from "@/lib/supabaseClient";
import type { FavouriteVisitor } from "@/lib/types";

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
  const [favourites, setFavourites] = useState<FavouriteVisitor[]>([]);
  const [selectedFavId, setSelectedFavId] = useState<string | null>(null);

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

      // Load favourites
      const { data: favs } = await getFavouriteVisitors(profile.id);
      setFavourites(favs);

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

        // Check if this visitor is a favourite and select it
        const matchedFav = favs.find((f) => f.visitor_id === prefillVisitorId);
        if (matchedFav) {
          setSelectedFavId(matchedFav.id);
        }
      }

      setLoading(false);
    }
    load();
  }, [profile, prefillVisitorId]);

  function selectFavourite(fav: FavouriteVisitor) {
    setSelectedFavId(fav.id);
    setEmail(fav.visitor_email || fav.visitor?.email || "");
    setVisitorName(fav.visitor_name || fav.visitor?.full_name || "");
    setVehiclePlate("");
  }

  function clearSelection() {
    setSelectedFavId(null);
    setEmail("");
    setVisitorName("");
    setVehiclePlate("");
  }

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
    let visitorId = prefillVisitorId ?? undefined;
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

    // Send email (awaited so the request completes before navigation)
    if (invitation) {
      try {
        const emailRes = await fetch("/api/email/invitation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationId: invitation.id }),
        });
        const emailData = await emailRes.json();
        if (emailData.emailSent) {
          setEmailSent(true);
        } else {
          console.error("Email send failed:", emailData.error);
        }
      } catch (e) {
        console.error("Email send failed:", e);
      }
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

        {/* Favourite visitors quick-select */}
        {favourites.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-ink/60">Quick select from favourites</p>
            <div className="flex flex-wrap gap-2">
              {favourites.map((fav) => {
                const isSelected = selectedFavId === fav.id;
                const displayName = fav.visitor_name || fav.visitor?.full_name || "Unknown";
                return (
                  <button
                    key={fav.id}
                    onClick={() => (isSelected ? clearSelection() : selectFavourite(fav))}
                    disabled={atLimit}
                    className={`focus-ring inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-60 ${
                      isSelected
                        ? "border-ink bg-ink text-parchment"
                        : "border-ink/20 bg-parchment-dim text-ink hover:border-ink/40"
                    }`}
                  >
                    <span className="h-5 w-5 rounded-full bg-ink/10 text-[10px] font-medium text-ink flex items-center justify-center">
                      {displayName.charAt(0)}
                    </span>
                    {displayName}
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 7l3 3 5-5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
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
            <Input id="email" type="email" required value={email} onChange={(e) => { setEmail(e.target.value); setSelectedFavId(null); }} placeholder="visitor@example.com" disabled={atLimit} />
          </FormField>
          <FormField label="Visitor Name (optional)" htmlFor="name" helpText="If the visitor is already registered, this is for reference only.">
            <Input id="name" type="text" value={visitorName} onChange={(e) => { setVisitorName(e.target.value); setSelectedFavId(null); }} placeholder="Amara Kimani" disabled={atLimit} />
          </FormField>
          <FormField label="Arrival Date" htmlFor="arrival" required helpText="The guard will log the check-in time when the visitor arrives.">
            <Input id="arrival" type="date" required value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} disabled={atLimit} />
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
