import { NextResponse } from "next/server";
import { sendInvitationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const result = await sendInvitationEmail({
      visitorEmail: email,
      visitorName: "Test Visitor",
      residentName: "Test Resident",
      roomNumber: "A-01",
      block: "A",
      visitStart: new Date().toISOString(),
      visitEnd: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      invitationId: "test-invitation-id",
      visitCode: "VF-TEST",
    });

    if (result.error) {
      return NextResponse.json({ success: false, error: String(result.error) }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Test email sent successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
