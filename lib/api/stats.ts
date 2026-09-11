import { supabase } from "../supabaseClient";
import type { DashboardStats, ResidentStats, GuardStats } from "../types";

export async function getAdminStats(): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [visitors, residents, guards, activeVisits, todaysVisits, rooms] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "visitor"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "resident"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "guard"),
    supabase.from("visits").select("*", { count: "exact", head: true }).in("status", ["approved"]),
    supabase.from("visits").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    supabase.from("rooms").select("*", { count: "exact", head: true }),
  ]);

  return {
    totalVisitors: visitors.count ?? 0,
    totalResidents: residents.count ?? 0,
    totalGuards: guards.count ?? 0,
    activeVisits: activeVisits.count ?? 0,
    todaysVisits: todaysVisits.count ?? 0,
    pendingVerifications: 0,
    flaggedActivity: 0,
    roomsOccupied: 0,
    totalRooms: rooms.count ?? 0,
    pendingInvitations: 0,
  };
}

export async function getResidentStats(residentId: string): Promise<ResidentStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [activeVisits, pendingInvitations, upcomingVisits, recentVisits] = await Promise.all([
    supabase.from("visits").select("*", { count: "exact", head: true })
      .eq("resident_id", residentId).in("status", ["authorized", "approved"]),
    supabase.from("invitations").select("*", { count: "exact", head: true })
      .eq("resident_id", residentId).eq("status", "pending"),
    supabase.from("invitations").select("*", { count: "exact", head: true })
      .eq("resident_id", residentId).in("status", ["accepted"]).gte("visit_start", today.toISOString()),
    supabase.from("visits").select("*", { count: "exact", head: true })
      .eq("resident_id", residentId).eq("status", "checked_out"),
  ]);

  return {
    activeVisitors: activeVisits.count ?? 0,
    maxActiveVisitors: 4,
    pendingInvitations: pendingInvitations.count ?? 0,
    upcomingVisits: upcomingVisits.count ?? 0,
    recentVisits: recentVisits.count ?? 0,
  };
}

export async function getGuardStats(): Promise<GuardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [visitorsToday, currentlyInside] = await Promise.all([
    supabase.from("visits").select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString()),
    supabase.from("visits").select("*", { count: "exact", head: true })
      .in("status", ["approved"]),
  ]);

  return {
    visitorsToday: visitorsToday.count ?? 0,
    currentlyInside: currentlyInside.count ?? 0,
    pendingVerification: 0,
    flaggedActivity: 0,
  };
}
