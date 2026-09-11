"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface InvitationData {
  id: string;
  visit_code: string;
  status: string;
  visitor_email: string;
  visitor_name: string | null;
  visit_start: string;
  visit_end: string | null;
  reason: string | null;
  vehicle_registration: string | null;
  resident: { full_name: string } | null;
  room: { room_number: string; block: string } | null;
  visitor: { full_name: string; email: string } | null;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { supabase } = await import("@/lib/supabaseClient");
      const { data } = await supabase
        .from("invitations")
        .select("*, resident:profiles!invitations_resident_id_fkey(full_name), room:rooms(room_number, block), visitor:visitor_profiles(full_name, email)")
        .eq("id", params.id)
        .single();

      if (!data) {
        setError("Invalid invitation. This link may be incorrect or expired.");
        setLoading(false);
        return;
      }

      setInvitation(data as InvitationData);
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <p className="font-mono text-sm text-ink/50">Loading invitation…</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment px-6">
        <div className="text-center">
          <h1 className="font-display text-3xl italic text-ink">Invalid Invitation</h1>
          <p className="mt-4 text-ink/60">{error}</p>
          <Link href="/" className="focus-ring mt-6 inline-block rounded-card bg-ink px-5 py-2.5 text-sm text-parchment hover:bg-ink-light">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const start = new Date(invitation.visit_start);

  if (invitation.status === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h1 className="font-display text-3xl italic text-ink">Invitation Expired</h1>
          <p className="mt-4 text-ink/60">
            This invitation is no longer valid. Please ask {invitation.resident?.full_name} to send a new invitation.
          </p>
          <Link href="/" className="focus-ring mt-6 inline-block rounded-card bg-ink px-5 py-2.5 text-sm text-parchment hover:bg-ink-light">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (invitation.status === "cancelled") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" /><path d="M8 12l4 4M16 12l-4 4" />
            </svg>
          </div>
          <h1 className="font-display text-3xl italic text-ink">Invitation Cancelled</h1>
          <p className="mt-4 text-ink/60">
            This invitation has been cancelled by the resident.
          </p>
          <Link href="/" className="focus-ring mt-6 inline-block rounded-card bg-ink px-5 py-2.5 text-sm text-parchment hover:bg-ink-light">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (invitation.status === "declined") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl italic text-ink">Invitation Declined</h1>
          <p className="mt-4 text-ink/60">
            This invitation has been declined.
          </p>
          <Link href="/" className="focus-ring mt-6 inline-block rounded-card bg-ink px-5 py-2.5 text-sm text-parchment hover:bg-ink-light">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (invitation.status === "accepted") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage/10 text-sage">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" />
            </svg>
          </div>
          <h1 className="font-display text-3xl italic text-ink">You&apos;re all set</h1>
          <p className="mt-4 text-ink/60">
            This invitation has been accepted. Present your visit code to the guard when you arrive.
          </p>
          <div className="mt-6 rounded-card border border-ink/15 bg-parchment-dim p-6">
            <p className="text-sm text-ink/60">Your Visit Code</p>
            <p className="mt-2 font-mono text-2xl font-bold text-ink">{invitation.visit_code}</p>
          </div>
        </div>
      </div>
    );
  }

  // Pending invitation — show details
  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 26 26" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="24" height="24" rx="3" stroke="#16233B" strokeWidth="1.5" />
              <path d="M6 9.5L13 17L20 6" stroke="#B8863B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display text-xl italic text-ink">ViFlow</span>
          </a>
        </div>

        <div className="rounded-card border border-ink/15 bg-parchment-dim p-8">
          <p className="font-mono text-[13px] text-brass-dark">You have been invited</p>
          <h1 className="mt-3 font-display text-2xl italic text-ink">
            Visit {invitation.resident?.full_name}
          </h1>

          <div className="mt-6 space-y-4">
            <div className="flex justify-between border-b border-ink/10 pb-3">
              <span className="text-sm text-ink/60">Resident</span>
              <span className="text-sm font-medium text-ink">{invitation.resident?.full_name}</span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-3">
              <span className="text-sm text-ink/60">Room</span>
              <span className="text-sm font-medium text-ink">
                Block {invitation.room?.block} — Room {invitation.room?.room_number.replace(/^[AB]-/, "")}
              </span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-3">
              <span className="text-sm text-ink/60">Arrival Date</span>
              <span className="text-sm font-medium text-ink">
                {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {invitation.reason && (
              <div className="flex justify-between border-b border-ink/10 pb-3">
                <span className="text-sm text-ink/60">Reason</span>
                <span className="text-sm font-medium text-ink">{invitation.reason}</span>
              </div>
            )}
            {invitation.vehicle_registration && (
              <div className="flex justify-between border-b border-ink/10 pb-3">
                <span className="text-sm text-ink/60">Vehicle</span>
                <span className="text-sm font-mono font-medium text-ink">{invitation.vehicle_registration}</span>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-card border border-ink/15 bg-parchment p-4 text-center">
            <p className="text-sm text-ink/60">Your Visit Code</p>
            <p className="mt-2 font-mono text-2xl font-bold text-ink">{invitation.visit_code}</p>
            <p className="mt-1 text-xs text-ink/40">Show this code to the guard at the gate</p>
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href={`/register?invitation=${invitation.id}`}
              className="focus-ring block w-full rounded-card bg-ink px-5 py-3 text-center text-sm font-medium text-parchment transition-colors hover:bg-ink-light"
            >
              Accept Invitation
            </Link>
            <p className="text-center text-xs text-ink/40">
              New to ViFlow? You will need to register first. Returning visitors can present their visit code directly.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink/40">
          The guard will check you in and out at the gate.
          A new invitation is required for future visits.
        </p>
      </div>
    </div>
  );
}
