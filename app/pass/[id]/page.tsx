"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import VisitorPass from "@/components/ui/VisitorPass";

interface InvitationData {
  id: string;
  visit_code: string;
  status: string;
  visit_start: string;
  visit_end: string;
  resident: { full_name: string } | null;
  room: { room_number: string; block: string } | null;
  visitor: { full_name: string } | null;
}

export default function PassPage() {
  const params = useParams();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { supabase } = await import("@/lib/supabaseClient");
      const { data } = await supabase
        .from("invitations")
        .select("*, resident:profiles!invitations_resident_id_fkey(full_name), room:rooms(room_number, block), visitor:visitor_profiles(full_name)")
        .eq("id", params.id)
        .single();

      setInvitation(data as InvitationData | null);
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <p className="font-mono text-sm text-ink/50">Loading pass…</p>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment px-6">
        <div className="text-center">
          <h1 className="font-display text-3xl italic text-ink">Pass Not Found</h1>
          <p className="mt-4 text-ink/60">This invitation could not be found.</p>
        </div>
      </div>
    );
  }

  const start = new Date(invitation.visit_start);
  const end = new Date(invitation.visit_end);

  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment px-6 py-12">
      <div className="text-center">
        <div className="mb-6">
          <a href="/" className="inline-flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 26 26" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="24" height="24" rx="3" stroke="#16233B" strokeWidth="1.5" />
              <path d="M6 9.5L13 17L20 6" stroke="#B8863B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display text-xl italic text-ink">ViFlow</span>
          </a>
        </div>

        <VisitorPass
          visitorName={invitation.visitor?.full_name ?? "Visitor"}
          residentName={invitation.resident?.full_name ?? "Resident"}
          hostel="Hostel"
          room={`${invitation.room?.room_number ?? "?"}, ${invitation.room?.block ?? "?"}`}
          visitDate={start.toLocaleDateString()}
          validFrom={start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          validUntil={end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          visitCode={invitation.visit_code}
        />

        <p className="mt-8 max-w-sm mx-auto text-sm text-ink/50">
          Present this invitation pass to the hostel guard when you arrive.
          This pass is valid only for the specified visit period.
        </p>
      </div>
    </div>
  );
}
