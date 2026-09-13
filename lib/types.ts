export type UserRole = "visitor" | "resident" | "guard" | "admin";

export type InvitationStatus = "pending" | "accepted" | "declined" | "expired" | "cancelled";

export type VisitStatus = "pending" | "authorized" | "checked_in" | "checked_out" | "cancelled" | "expired" | "denied";

export type VerificationStatus = "pending" | "verified" | "rejected";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface ResidentProfile {
  id: string;
  user_id: string;
  room_id: string;
  student_number: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  room?: Room;
}

export interface VisitorProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  id_number: string | null;
  id_document_url: string | null;
  id_verified: boolean;
  photo_url: string | null;
  photo_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  visitor_id: string;
  registration_number: string;
  make: string | null;
  model: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  visitor?: VisitorProfile;
}

export interface Room {
  id: string;
  room_number: string;
  block: string;
  floor: number;
  is_occupied: boolean;
  created_at: string;
}

export interface Invitation {
  id: string;
  visit_code: string;
  resident_id: string;
  visitor_id: string | null;
  visitor_email: string;
  visitor_name: string | null;
  room_id: string;
  visit_start: string;
  visit_end: string | null;
  reason: string | null;
  vehicle_registration: string | null;
  status: InvitationStatus;
  created_at: string;
  updated_at: string;
  resident?: Profile;
  visitor?: VisitorProfile;
  room?: Room;
}

export interface Visit {
  id: string;
  invitation_id: string;
  visit_code: string;
  visitor_id: string;
  resident_id: string;
  room_id: string;
  status: VisitStatus;
  checked_in_at: string | null;
  checked_out_at: string | null;
  created_at: string;
  updated_at: string;
  visitor?: VisitorProfile;
  resident?: Profile;
  room?: Room;
  invitation?: Invitation;
}

export interface VisitLog {
  id: string;
  visit_id: string;
  action: string;
  performed_by: string | null;
  notes: string | null;
  created_at: string;
  visit?: Visit;
  performer?: Profile;
}

export interface Verification {
  id: string;
  visit_id: string;
  visitor_id: string;
  verified_by: string | null;
  status: VerificationStatus;
  method: string | null;
  notes: string | null;
  created_at: string;
  visit?: Visit;
  visitor?: VisitorProfile;
  verifier?: Profile;
}

export interface FavouriteVisitor {
  id: string;
  resident_id: string;
  visitor_id: string;
  label: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  created_at: string;
  visitor?: VisitorProfile;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user?: Profile;
}

export interface ActivityReview {
  id: string;
  visit_id: string;
  reviewed_by: string;
  action: string;
  reason: string;
  notes: string | null;
  created_at: string;
  visit?: Visit;
  reviewer?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface Policy {
  id: string;
  key: string;
  value: unknown;
  updated_at: string;
}

export interface DashboardStats {
  totalVisitors: number;
  totalResidents: number;
  totalGuards: number;
  activeVisits: number;
  todaysVisits: number;
  pendingVerifications: number;
  flaggedActivity: number;
  roomsOccupied: number;
  totalRooms: number;
  pendingInvitations: number;
}

export type JoinedInvitation = Invitation & { resident: Profile | null };

export type JoinedVisit = Visit & { invitation: Invitation | null; room: Room | null };

export type JoinedRoom = Room & { resident_profile: ResidentProfile & { profile: Profile } | null };

export type JoinedResident = ResidentProfile & { profile: Profile | null; room: Room | null };

export type JoinedAuditLog = AuditLog & { user: Profile | null };

export type JoinedVisitLog = VisitLog & { visit: Visit | null };

export type JoinedVerification = Verification & { visit: Visit | null; visitor: VisitorProfile | null };

export type JoinedVehicle = Vehicle & { visitor: VisitorProfile | null };

export interface ResidentStats {
  activeVisitors: number;
  maxActiveVisitors: number;
  pendingInvitations: number;
  upcomingVisits: number;
  recentVisits: number;
}

export interface GuardStats {
  visitorsToday: number;
  currentlyInside: number;
  pendingVerification: number;
  flaggedActivity: number;
}
