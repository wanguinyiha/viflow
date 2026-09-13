import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "stats";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const roleFilter = searchParams.get("role");
  const statusFilter = searchParams.get("status");
  const userId = searchParams.get("user_id");

  try {
    switch (type) {
      case "stats": {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayIso = today.toISOString();

        const [
          visitorsRes,
          residentsRes,
          guardsRes,
          activeRes,
          todaysRes,
          roomsAll,
          roomsOccupiedRes,
          pendingInvRes,
          pendingVerifRes,
          flaggedRes,
        ] = await Promise.all([
          supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "visitor"),
          supabaseAdmin.from("resident_profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
          supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "guard"),
          supabaseAdmin.from("visits").select("*", { count: "exact", head: true }).in("status", ["checked_in"]),
          supabaseAdmin.from("visits").select("*", { count: "exact", head: true }).gte("checked_in_at", todayIso),
          supabaseAdmin.from("rooms").select("id, is_occupied"),
          supabaseAdmin.from("rooms").select("*", { count: "exact", head: true }).eq("is_occupied", true),
          supabaseAdmin.from("invitations").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabaseAdmin.from("verifications").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabaseAdmin.from("activity_reviews").select("*", { count: "exact", head: true }).eq("action", "flagged"),
        ]);

        return NextResponse.json({
          totalVisitors: visitorsRes.count ?? 0,
          totalResidents: residentsRes.count ?? 0,
          totalGuards: guardsRes.count ?? 0,
          activeVisits: activeRes.count ?? 0,
          todaysVisits: todaysRes.count ?? 0,
          pendingVerifications: pendingVerifRes.count ?? 0,
          flaggedActivity: flaggedRes.count ?? 0,
          roomsOccupied: roomsOccupiedRes.count ?? 0,
          totalRooms: roomsAll.data?.length ?? 0,
          pendingInvitations: pendingInvRes.count ?? 0,
        });
      }

      case "profiles": {
        let query = supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false });
        if (roleFilter) query = query.eq("role", roleFilter);
        const { data } = await query.range(offset, offset + limit - 1);
        const countQuery = supabaseAdmin.from("profiles").select("*", { count: "exact", head: true });
        const finalCount = roleFilter ? await countQuery.eq("role", roleFilter) : await countQuery;
        return NextResponse.json({ profiles: data ?? [], total: finalCount.count ?? 0 });
      }

      // Alias for profiles - used by users page
      case "users": {
        let query = supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false });
        if (roleFilter) query = query.eq("role", roleFilter);
        const { data } = await query.range(offset, offset + limit - 1);
        const countQuery = supabaseAdmin.from("profiles").select("*", { count: "exact", head: true });
        const finalCount = roleFilter ? await countQuery.eq("role", roleFilter) : await countQuery;
        return NextResponse.json({ users: data ?? [], total: finalCount.count ?? 0 });
      }

      case "resident_profiles": {
        let query = supabaseAdmin
          .from("resident_profiles")
          .select("*, profile:profiles!resident_profiles_user_id_fkey(id, full_name, email, phone), room:rooms!resident_profiles_room_id_fkey(id, room_number, block, floor)")
          .order("created_at", { ascending: false });
        if (statusFilter) query = query.eq("status", statusFilter);
        if (userId) query = query.eq("user_id", userId);
        const { data } = await query.range(offset, offset + limit - 1);
        const countQuery = supabaseAdmin.from("resident_profiles").select("*", { count: "exact", head: true });
        const finalCount = statusFilter ? await countQuery.eq("status", statusFilter) : await countQuery;
        return NextResponse.json({ resident_profiles: data ?? [], total: finalCount.count ?? 0 });
      }

      // Alias for resident_profiles
      case "residents": {
        let query = supabaseAdmin
          .from("resident_profiles")
          .select("*, profile:profiles!resident_profiles_user_id_fkey(id, full_name, email, phone), room:rooms!resident_profiles_room_id_fkey(id, room_number, block, floor)")
          .order("created_at", { ascending: false });
        if (statusFilter) query = query.eq("status", statusFilter);
        if (userId) query = query.eq("user_id", userId);
        const { data } = await query.range(offset, offset + limit - 1);
        const countQuery = supabaseAdmin.from("resident_profiles").select("*", { count: "exact", head: true });
        const finalCount = statusFilter ? await countQuery.eq("status", statusFilter) : await countQuery;
        return NextResponse.json({ residents: data ?? [], total: finalCount.count ?? 0 });
      }

      case "visitor_profiles": {
        let query = supabaseAdmin.from("visitor_profiles").select("*").order("created_at", { ascending: false });
        if (userId) query = query.eq("user_id", userId);
        const { data } = await query.range(offset, offset + limit - 1);
        const { count } = await supabaseAdmin.from("visitor_profiles").select("*", { count: "exact", head: true });
        return NextResponse.json({ visitor_profiles: data ?? [], visitors: data ?? [], total: count ?? 0 });
      }

      case "guards": {
        const { data } = await supabaseAdmin.from("profiles").select("*").eq("role", "guard").order("created_at", { ascending: false }).range(offset, offset + limit - 1);
        const { count } = await supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "guard");
        return NextResponse.json({ guards: data ?? [], total: count ?? 0 });
      }

      case "rooms": {
        const { data } = await supabaseAdmin
          .from("rooms")
          .select("*, resident:resident_profiles!resident_profiles_room_id_fkey(id, user_id, student_number, status, profile:profiles!resident_profiles_user_id_fkey(id, full_name, email))")
          .order("block")
          .order("room_number");
        const { count } = await supabaseAdmin.from("rooms").select("*", { count: "exact", head: true });
        return NextResponse.json({ rooms: data ?? [], total: count ?? 0 });
      }

      case "invitations": {
        let query = supabaseAdmin
          .from("invitations")
          .select("*, resident:profiles!invitations_resident_id_fkey(id, full_name, email), room:rooms!invitations_room_id_fkey(room_number, block)")
          .order("created_at", { ascending: false });
        if (statusFilter) query = query.eq("status", statusFilter);
        if (userId) query = query.eq("resident_id", userId);
        const { data } = await query.range(offset, offset + limit - 1);
        let countQuery = supabaseAdmin.from("invitations").select("*", { count: "exact", head: true });
        if (statusFilter) countQuery = countQuery.eq("status", statusFilter);
        if (userId) countQuery = countQuery.eq("resident_id", userId);
        const { count: totalCount } = await countQuery;
        return NextResponse.json({ invitations: data ?? [], total: totalCount ?? 0 });
      }

      case "visits": {
        let query = supabaseAdmin
          .from("visits")
          .select("*, invitation:invitations!visits_invitation_id_fkey(visitor_name, reason, visit_code), room:rooms!visits_room_id_fkey(room_number, block), visitor:visitor_profiles(full_name, email), resident:profiles!visits_resident_id_fkey(full_name)")
          .order("created_at", { ascending: false });
        if (statusFilter) query = query.eq("status", statusFilter);
        if (userId) query = query.eq("resident_id", userId);
        const { data } = await query.range(offset, offset + limit - 1);
        let countQuery = supabaseAdmin.from("visits").select("*", { count: "exact", head: true });
        if (statusFilter) countQuery = countQuery.eq("status", statusFilter);
        if (userId) countQuery = countQuery.eq("resident_id", userId);
        const { count: totalCount } = await countQuery;
        return NextResponse.json({ visits: data ?? [], total: totalCount ?? 0 });
      }

      case "audit": {
        const { data } = await supabaseAdmin
          .from("audit_logs")
          .select("*, user:profiles!audit_logs_user_id_fkey(id, full_name, email)")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        const { count } = await supabaseAdmin.from("audit_logs").select("*", { count: "exact", head: true });
        return NextResponse.json({ logs: data ?? [], total: count ?? 0 });
      }

      case "activity": {
        const { data } = await supabaseAdmin
          .from("visit_logs")
          .select("*, visit:visits!visit_logs_visit_id_fkey(visit_code, status, visitor_id)")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        const { count } = await supabaseAdmin.from("visit_logs").select("*", { count: "exact", head: true });
        return NextResponse.json({ logs: data ?? [], total: count ?? 0 });
      }

      case "activity_reviews": {
        const { data } = await supabaseAdmin
          .from("activity_reviews")
          .select("*, visit:visits!activity_reviews_visit_id_fkey(visit_code, status), reviewer:profiles!activity_reviews_reviewed_by_fkey(full_name)")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        const { count } = await supabaseAdmin.from("activity_reviews").select("*", { count: "exact", head: true });
        return NextResponse.json({ reviews: data ?? [], total: count ?? 0 });
      }

      case "verifications": {
        let query = supabaseAdmin
          .from("verifications")
          .select("*, visit:visits!verifications_visit_id_fkey(visit_code, status), visitor:visitor_profiles!verifications_visitor_id_fkey(full_name, email, photo_url), verifier:profiles!verifications_verified_by_fkey(full_name)")
          .order("created_at", { ascending: false });
        if (statusFilter) query = query.eq("status", statusFilter);
        const { data } = await query.range(offset, offset + limit - 1);
        const countQuery = supabaseAdmin.from("verifications").select("*", { count: "exact", head: true });
        const finalCount = statusFilter ? await countQuery.eq("status", statusFilter) : await countQuery;
        return NextResponse.json({ verifications: data ?? [], total: finalCount.count ?? 0 });
      }

      case "vehicles": {
        const { data } = await supabaseAdmin
          .from("vehicles")
          .select("*, visitor:visitor_profiles!vehicles_visitor_id_fkey(full_name, email, phone)")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        const { count } = await supabaseAdmin.from("vehicles").select("*", { count: "exact", head: true });
        return NextResponse.json({ vehicles: data ?? [], total: count ?? 0 });
      }

      case "notifications": {
        let query = supabaseAdmin.from("notifications").select("*").order("created_at", { ascending: false });
        if (userId) query = query.eq("user_id", userId);
        const { data } = await query.range(offset, offset + limit - 1);
        return NextResponse.json({ notifications: data ?? [] });
      }

      case "recent_activity": {
        const { data } = await supabaseAdmin
          .from("audit_logs")
          .select("*, user:profiles!audit_logs_user_id_fkey(full_name, email)")
          .order("created_at", { ascending: false })
          .limit(10);
        return NextResponse.json({ activities: data ?? [] });
      }

      case "recent_visits": {
        const { data } = await supabaseAdmin
          .from("visits")
          .select("*, invitation:invitations!visits_invitation_id_fkey(visitor_name, reason), room:rooms!visits_room_id_fkey(room_number, block)")
          .order("created_at", { ascending: false })
          .limit(5);
        return NextResponse.json({ visits: data ?? [] });
      }

      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin data API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
