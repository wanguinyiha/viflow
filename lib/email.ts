import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!host || !user || !pass) {
      console.warn("SMTP not configured, emails will be skipped");
      return null;
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

const FROM_EMAIL = process.env.SMTP_USER || "noreply@viflow.app";

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
  const transport = getTransporter();
  if (!transport) {
    console.warn("SMTP not configured, skipping invitation email");
    return { error: null };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${invitationId}`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #16233B; padding: 30px; text-align: center;">
        <h1 style="color: #F4EEDF; margin: 0; font-size: 24px;">ViFlow Invitation</h1>
      </div>
      <div style="padding: 30px;">
        <p style="color: #333; font-size: 16px;">Hi <strong>${visitorName}</strong>,</p>
        <p style="color: #333; font-size: 16px;">
          <strong>${residentName}</strong> has invited you to visit them at their hostel.
        </p>
        <div style="background: #F4EEDF; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0; color: #16233B;"><strong>Room:</strong> Block ${block} — Room ${roomNumber}</p>
          <p style="margin: 8px 0; color: #16233B;"><strong>Visit Code:</strong> <span style="font-size: 18px; font-weight: bold;">${visitCode}</span></p>
          <p style="margin: 8px 0; color: #16233B;"><strong>Valid From:</strong> ${new Date(visitStart).toLocaleString()}</p>
          <p style="margin: 8px 0; color: #16233B;"><strong>Valid Until:</strong> ${new Date(visitEnd).toLocaleString()}</p>
        </div>
        <p style="color: #666; font-size: 14px;">Present this visit code to the guard at the gate. You will need to register if this is your first visit.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="display: inline-block; background: #16233B; color: #F4EEDF; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            View Invitation Details
          </a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
          This invitation will expire on ${new Date(visitEnd).toLocaleString()}. If you did not expect this invitation, please ignore this email.
        </p>
      </div>
    </div>
  `;

  try {
    await transport.sendMail({
      from: `"ViFlow" <${FROM_EMAIL}>`,
      to: visitorEmail,
      subject: `You've been invited to visit ${residentName} — Visit Code: ${visitCode}`,
      html,
    });
    return { error: null };
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
  const transport = getTransporter();
  if (!transport) {
    return { error: null };
  }

  const subjectMap = {
    checked_in: "Check-in Confirmation",
    checked_out: "Visit Complete",
    denied: "Visit Denied",
  };

  const messageMap = {
    checked_in: `You have been checked in at ${residentName}'s room (Block ${block} — Room ${roomNumber}).`,
    checked_out: `Your visit to ${residentName}'s room (Block ${block} — Room ${roomNumber}) has ended. Thank you for visiting!`,
    denied: `Your visit to ${residentName}'s room (Block ${block} — Room ${roomNumber}) has been denied.`,
  };

  try {
    await transport.sendMail({
      from: `"ViFlow" <${FROM_EMAIL}>`,
      to: visitorEmail,
      subject: `ViFlow: ${subjectMap[type]}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #16233B; padding: 20px; text-align: center;">
            <h1 style="color: #F4EEDF; margin: 0; font-size: 20px;">ViFlow</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #16233B;">${subjectMap[type]}</h2>
            <p style="color: #333;">Hi ${visitorName},</p>
            <p style="color: #333;">${messageMap[type]}</p>
            <div style="background: #F4EEDF; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0; color: #16233B;"><strong>Visit Code:</strong> ${visitCode}</p>
            </div>
          </div>
        </div>
      `,
    });
    return { error: null };
  } catch (err) {
    console.error("Failed to send visit update email:", err);
    return { error: err };
  }
}

export async function sendAccountCreatedEmail({
  email,
  fullName,
  role,
  tempPassword,
}: {
  email: string;
  fullName: string;
  role: string;
  tempPassword: string;
}) {
  const transport = getTransporter();
  if (!transport) {
    return { error: null };
  }

  try {
    await transport.sendMail({
      from: `"ViFlow" <${FROM_EMAIL}>`,
      to: email,
      subject: `Your ViFlow ${role} account has been created`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #16233B; padding: 20px; text-align: center;">
            <h1 style="color: #F4EEDF; margin: 0; font-size: 20px;">ViFlow</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #16233B;">Account Created</h2>
            <p style="color: #333;">Hi ${fullName},</p>
            <p style="color: #333;">Your ${role} account has been created by an administrator.</p>
            <div style="background: #F4EEDF; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 8px 0; color: #16233B;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 8px 0; color: #16233B;"><strong>Password:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 3px;">${tempPassword}</code></p>
              <p style="margin: 8px 0; color: #16233B;"><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
            </div>
            <p style="color: #666; font-size: 14px;">Please log in using the credentials above. You may change your password after logging in.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login" style="display: inline-block; background: #16233B; color: #F4EEDF; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Log In
              </a>
            </div>
          </div>
        </div>
      `,
    });
    return { error: null };
  } catch (err) {
    console.error("Failed to send account created email:", err);
    return { error: err };
  }
}
