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
  vehicle_plate: string | null;
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
}

export interface Room {
  id: string;
  room_number: string;
  block: string;
  floor: number;
  resident_id: string | null;
  hostel_id: string | null;
  is_occupied: boolean;
  created_at: string;
}

export interface Hostel {
  id: string;
  name: string;
  address: string | null;
  total_rooms: number;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  visit_code: string;
  resident_id: string;
  visitor_id: string | null;
  visitor_email: string;
  visitor_name: string | null;
  hostel_id: string | null;
  room_id: string;
  visit_start: string;
  visit_end: string;
  reason: string | null;
  vehicle_registration: string | null;
  status: InvitationStatus;
  created_at: string;
  updated_at: string;
  resident?: Profile;
  visitor?: VisitorProfile;
  room?: Room;
  hostel?: Hostel;
}

export interface Visit {
  id: string;
  invitation_id: string;
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
}

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
