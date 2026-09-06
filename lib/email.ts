import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;
    resend = new Resend(apiKey);
  }
  return resend;
}

const FROM_EMAIL = "ViFlow <noreply@viflow.app>";

export async function sendInvitationEmail({
  visitorEmail,
  visitorName,
  residentName,
  roomNumber,
  block,
  visitStart,
  visitEnd,
  invitationId,
  visitCode,
}: {
  visitorEmail: string;
  visitorName: string;
  residentName: string;
  roomNumber: string;
  block: string;
  visitStart: string;
  visitEnd: string;
  invitationId: string;
  visitCode: string;
}) {
  const client = getResend();
  if (!client) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return { error: null };
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${invitationId}`;

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to: visitorEmail,
      subject: `You've been invited to visit ${residentName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16233B;">You're Invited!</h2>
          <p style="color: #333;">
            <strong>${residentName}</strong> has invited you to visit them at their hostel.
          </p>
          <div style="background: #F4EEDF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #16233B;"><strong>Room:</strong> ${roomNumber}, ${block}</p>
            <p style="margin: 5px 0; color: #16233B;"><strong>Visit Code:</strong> ${visitCode}</p>
            <p style="margin: 5px 0; color: #16233B;"><strong>Valid From:</strong> ${new Date(visitStart).toLocaleString()}</p>
            <p style="margin: 5px 0; color: #16233B;"><strong>Valid Until:</strong> ${new Date(visitEnd).toLocaleString()}</p>
          </div>
          <p style="color: #666;">Please click the button below to accept the invitation and complete your registration:</p>
          <a href="${inviteUrl}" style="display: inline-block; background: #16233B; color: #F4EEDF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: medium;">
            Accept Invitation
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This invitation will expire on ${new Date(visitEnd).toLocaleString()}. If you did not expect this invitation, please ignore this email.
          </p>
        </div>
      `,
    });

    return { error };
  } catch (err) {
    console.error("Failed to send invitation email:", err);
    return { error: err };
  }
}

export async function sendVisitUpdateEmail({
  visitorEmail,
  visitorName,
  residentName,
  roomNumber,
  block,
  type,
  visitCode,
}: {
  visitorEmail: string;
  visitorName: string;
  residentName: string;
  roomNumber: string;
  block: string;
  type: "checked_in" | "checked_out" | "denied";
  visitCode: string;
}) {
  const client = getResend();
  if (!client) {
    return { error: null };
  }

  const subjectMap = {
    checked_in: "Check-in Confirmation",
    checked_out: "Visit Complete",
    denied: "Visit Denied",
  };

  const messageMap = {
    checked_in: `You have been checked in at ${residentName}'s room (${roomNumber}, ${block}).`,
    checked_out: `Your visit to ${residentName}'s room (${roomNumber}, ${block}) has ended. Thank you for visiting!`,
    denied: `Your visit to ${residentName}'s room (${roomNumber}, ${block}) has been denied.`,
  };

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to: visitorEmail,
      subject: `ViFlow: ${subjectMap[type]}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16233B;">${subjectMap[type]}</h2>
          <p style="color: #333;">Hi ${visitorName},</p>
          <p style="color: #333;">${messageMap[type]}</p>
          <div style="background: #F4EEDF; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #16233B;"><strong>Visit Code:</strong> ${visitCode}</p>
          </div>
        </div>
      `,
    });

    return { error };
  } catch (err) {
    console.error("Failed to send visit update email:", err);
    return { error: err };
  }
}
