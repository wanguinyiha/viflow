import { getSupabaseAdmin } from "@/lib/supabaseServer";

export type NotificationKind = "notification" | "alert";

export type NotificationEntityType =
  | "invitation"
  | "visit"
  | "verification"
  | "activity_review"
  | "room"
  | "profile"
  | null;

export interface CreateNotificationOptions {
  userId: string;
  title: string;
  message: string;
  kind?: NotificationKind;
  entityType?: NotificationEntityType;
  entityId?: string;
  link?: string;
}

/**
 * Create a single notification. Server-side only (uses supabaseAdmin).
 * Idempotent: does not check for duplicates — caller should ensure uniqueness.
 */
export async function createNotification(opts: CreateNotificationOptions) {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: opts.userId,
    title: opts.title,
    message: opts.message,
    kind: opts.kind ?? "notification",
    entity_type: opts.entityType ?? null,
    entity_id: opts.entityId ?? null,
    link: opts.link ?? null,
  });
  if (error) {
    console.error("Failed to create notification:", error.message);
  }
  return { error };
}

/**
 * Create multiple notifications in one call.
 */
export async function createNotifications(
  items: CreateNotificationOptions[]
) {
  if (items.length === 0) return { error: null };
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("notifications").insert(
    items.map((opts) => ({
      user_id: opts.userId,
      title: opts.title,
      message: opts.message,
      kind: opts.kind ?? "notification",
      entity_type: opts.entityType ?? null,
      entity_id: opts.entityId ?? null,
      link: opts.link ?? null,
    }))
  );
  if (error) {
    console.error("Failed to create notifications:", error.message);
  }
  return { error };
}

// ──────────────────────────────────────────────
// Convenience builders for common notification events
// ──────────────────────────────────────────────

/** Visitor accepted/registered for an invitation → notify resident */
export function invitationAccepted(opts: {
  residentId: string;
  visitorName: string;
  invitationId: string;
}) {
  return createNotification({
    userId: opts.residentId,
    title: "Invitation Accepted",
    message: `${opts.visitorName} has accepted your invitation and registered.`,
    kind: "notification",
    entityType: "invitation",
    entityId: opts.invitationId,
    link: `/dashboard/resident/invitations/${opts.invitationId}`,
  });
}

/** Visitor checked in → notify resident */
export function visitorCheckedIn(opts: {
  residentId: string;
  visitorName: string;
  visitId: string;
  invitationId?: string;
}) {
  return createNotification({
    userId: opts.residentId,
    title: "Visitor Checked In",
    message: `${opts.visitorName} has been checked in at your room.`,
    kind: "notification",
    entityType: "visit",
    entityId: opts.visitId,
    link: `/dashboard/resident/active`,
  });
}

/** Visitor checked out → notify resident */
export function visitorCheckedOut(opts: {
  residentId: string;
  visitorName: string;
  visitId: string;
}) {
  return createNotification({
    userId: opts.residentId,
    title: "Visitor Checked Out",
    message: `${opts.visitorName} has checked out.`,
    kind: "notification",
    entityType: "visit",
    entityId: opts.visitId,
    link: `/dashboard/resident/history`,
  });
}

/** Visitor denied entry → notify resident */
export function visitorDenied(opts: {
  residentId: string;
  visitorName: string;
  visitId: string;
}) {
  return createNotification({
    userId: opts.residentId,
    title: "Visitor Denied",
    message: `${opts.visitorName} was denied entry.`,
    kind: "alert",
    entityType: "visit",
    entityId: opts.visitId,
    link: `/dashboard/resident/active`,
  });
}

/** Invitation cancelled → notify visitor (if they have a user account) */
export function invitationCancelled(opts: {
  visitorUserId: string | null;
  residentName: string;
  invitationId: string;
}) {
  if (!opts.visitorUserId) return Promise.resolve({ error: null });
  return createNotification({
    userId: opts.visitorUserId,
    title: "Invitation Cancelled",
    message: `Your invitation from ${opts.residentName} has been cancelled.`,
    kind: "alert",
    entityType: "invitation",
    entityId: opts.invitationId,
    link: `/invite/${opts.invitationId}`,
  });
}

/** Invitation expired → notify resident */
export function invitationExpired(opts: {
  residentId: string;
  visitorName: string;
  invitationId: string;
}) {
  return createNotification({
    userId: opts.residentId,
    title: "Invitation Expired",
    message: `Invitation for ${opts.visitorName} has expired.`,
    kind: "alert",
    entityType: "invitation",
    entityId: opts.invitationId,
    link: `/dashboard/resident/invitations/${opts.invitationId}`,
  });
}

/** Pending verification alert → notify guard */
export function pendingVerification(opts: {
  guardUserId: string;
  visitorName: string;
  visitId: string;
  residentName: string;
  roomLabel: string;
}) {
  return createNotification({
    userId: opts.guardUserId,
    title: "Pending Verification",
    message: `${opts.visitorName} is waiting for verification. Resident: ${opts.residentName}, Room: ${opts.roomLabel}.`,
    kind: "alert",
    entityType: "visit",
    entityId: opts.visitId,
    link: `/dashboard/guard/verify`,
  });
}

/** Invalid or expired access code → alert guard */
export function invalidAccessCode(opts: {
  guardUserId: string;
  code: string;
}) {
  return createNotification({
    userId: opts.guardUserId,
    title: "Invalid Access Code",
    message: `Code "${opts.code}" is invalid or does not exist.`,
    kind: "alert",
    entityType: null,
    link: `/dashboard/guard/verify`,
  });
}

/** Max active visitors reached → alert guard */
export function maxActiveVisitorsReached(opts: {
  guardUserId: string;
  residentName: string;
  roomLabel: string;
}) {
  return createNotification({
    userId: opts.guardUserId,
    title: "Max Active Visitors",
    message: `${opts.residentName} (${opts.roomLabel}) has reached the maximum of 4 active visitors.`,
    kind: "alert",
    entityType: "room",
    link: `/dashboard/guard/verify`,
  });
}

/** Activity flagged for review → notify admin */
export function activityFlagged(opts: {
  adminUserId: string;
  title: string;
  message: string;
  activityReviewId: string;
}) {
  return createNotification({
    userId: opts.adminUserId,
    title: opts.title,
    message: opts.message,
    kind: "alert",
    entityType: "activity_review",
    entityId: opts.activityReviewId,
    link: `/dashboard/admin/activity`,
  });
}

/** Admin: visit denied → notify admin */
export function adminVisitDenied(opts: {
  adminUserId: string;
  visitorName: string;
  visitId: string;
}) {
  return createNotification({
    userId: opts.adminUserId,
    title: "Visit Denied",
    message: `Visit for ${opts.visitorName} has been denied.`,
    kind: "notification",
    entityType: "visit",
    entityId: opts.visitId,
    link: `/dashboard/admin/visits`,
  });
}

/** Admin: room change → notify admin */
export function roomChanged(opts: {
  adminUserId: string;
  residentName: string;
  oldRoom: string;
  newRoom: string;
  residentId: string;
}) {
  return createNotification({
    userId: opts.adminUserId,
    title: "Room Assignment Changed",
    message: `${opts.residentName} moved from ${opts.oldRoom} to ${opts.newRoom}.`,
    kind: "notification",
    entityType: "profile",
    entityId: opts.residentId,
    link: `/dashboard/admin/residents`,
  });
}
