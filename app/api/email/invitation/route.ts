import { NextResponse } from "next/server";
import { sendInvitationEmail } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const body = await request.json();
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json({ error: "Missing invitationId" }, { status: 400 });
    }

    // Fetch invitation with all related data
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from("invitations")
      .select(`
        *,
        resident:profiles!invitations_resident_id_fkey(full_name, email),
        room:rooms(room_number, block),
        visitor:visitor_profiles(full_name, email)
      `)
      .eq("id", invitationId)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const resident = invitation.resident as { full_name: string } | null;
    const room = invitation.room as { room_number: string; block: string } | null;

    if (!resident || !room) {
      return NextResponse.json({ error: "Incomplete invitation data" }, { status: 400 });
    }

    const visitorEmail = invitation.visitor_email;
    const visitorName = invitation.visitor_name || "Visitor";

    const { error } = await sendInvitationEmail({
      visitorEmail,
      visitorName,
      residentName: resident.full_name,
      roomNumber: room.room_number,
      block: room.block,
      visitStart: invitation.visit_start,
      visitEnd: invitation.visit_end,
      invitationId: invitation.id,
      visitCode: invitation.visit_code,
    });

    if (error) {
      console.error("Email send failed:", error);
      // Don't fail the request - email failure shouldn't block the invitation
    }

    return NextResponse.json({ success: true, emailSent: !error });
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
