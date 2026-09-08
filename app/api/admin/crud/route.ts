import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "create_user": {
        const { email, password, fullName, phone, role } = data;
        if (!email || !password || !fullName || !role) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName, role },
        });
        if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

        const userId = userData.user.id;
        const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
          id: userId, full_name: fullName, email, phone: phone || null, role,
        }, { onConflict: "id" });
        if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

        if (role === "visitor") {
          await supabaseAdmin.from("visitor_profiles").upsert({
            user_id: userId, full_name: fullName, email, phone: phone || null,
          }, { onConflict: "user_id" });
        }

        return NextResponse.json({ user: userData.user }, { status: 201 });
      }

      case "update_user": {
        const { userId, fullName, phone, role } = data;
        const updates: Record<string, unknown> = {};
        if (fullName) updates.full_name = fullName;
        if (phone !== undefined) updates.phone = phone || null;
        if (role) updates.role = role;

        const { error } = await supabaseAdmin.from("profiles").update(updates).eq("id", userId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true });
      }

      case "deactivate_user": {
        const { userId } = data;
        const { error } = await supabaseAdmin.from("profiles").update({ role: "visitor" }).eq("id", userId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true });
      }

      case "reset_password": {
        const { email } = data;
        const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true });
      }

      case "assign_room": {
        const { roomId, userId } = data;
        if (!roomId || !userId) return NextResponse.json({ error: "roomId and userId required" }, { status: 400 });

        // Check if room is already occupied
        const { data: existing } = await supabaseAdmin.from("resident_profiles").select("id").eq("room_id", roomId).single();
        if (existing) return NextResponse.json({ error: "Room is already occupied" }, { status: 400 });

        // Check if user already has a room
        const { data: existingUser } = await supabaseAdmin.from("resident_profiles").select("id").eq("user_id", userId).single();
        if (existingUser) return NextResponse.json({ error: "User already has a room assigned" }, { status: 400 });

        // Create resident profile
        const { error } = await supabaseAdmin.from("resident_profiles").insert({
          user_id: userId, room_id: roomId, status: "active",
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        // Mark room as occupied
        await supabaseAdmin.from("rooms").update({ is_occupied: true }).eq("id", roomId);

        return NextResponse.json({ success: true }, { status: 201 });
      }

      case "unassign_room": {
        const { residentProfileId } = data;
        if (!residentProfileId) return NextResponse.json({ error: "residentProfileId required" }, { status: 400 });

        // Get the room_id before deleting
        const { data: profile } = await supabaseAdmin.from("resident_profiles").select("room_id").eq("id", residentProfileId).single();

        // Delete resident profile
        const { error } = await supabaseAdmin.from("resident_profiles").delete().eq("id", residentProfileId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        // Mark room as unoccupied
        if (profile) {
          await supabaseAdmin.from("rooms").update({ is_occupied: false }).eq("id", profile.room_id);
        }

        return NextResponse.json({ success: true });
      }

      case "update_resident_status": {
        const { residentProfileId, status } = data;
        if (!residentProfileId || !status) return NextResponse.json({ error: "residentProfileId and status required" }, { status: 400 });

        const { error } = await supabaseAdmin.from("resident_profiles").update({ status }).eq("id", residentProfileId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true });
      }

      case "verify_visitor_id": {
        const { visitorProfileId, verified } = data;
        if (!visitorProfileId) return NextResponse.json({ error: "visitorProfileId required" }, { status: 400 });

        const { error } = await supabaseAdmin.from("visitor_profiles").update({ id_verified: verified ?? true }).eq("id", visitorProfileId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true });
      }

      case "verify_visitor_photo": {
        const { visitorProfileId, verified } = data;
        if (!visitorProfileId) return NextResponse.json({ error: "visitorProfileId required" }, { status: 400 });

        const { error } = await supabaseAdmin.from("visitor_profiles").update({ photo_verified: verified ?? true }).eq("id", visitorProfileId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true });
      }

      case "create_room": {
        const { roomNumber, block, floor } = data;
        if (!roomNumber || !block) return NextResponse.json({ error: "Room number and block required" }, { status: 400 });
        const { data: room, error } = await supabaseAdmin.from("rooms").insert({
          room_number: roomNumber, block, floor: floor || (block === "A" ? 1 : 2), is_occupied: false,
        }).select().single();
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ room }, { status: 201 });
      }

      case "delete_room": {
        const { roomId } = data;
        const { error } = await supabaseAdmin.from("rooms").delete().eq("id", roomId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true });
      }

      case "cancel_invitation": {
        const { invitationId } = data;
        const { error } = await supabaseAdmin.from("invitations").update({ status: "cancelled" }).eq("id", invitationId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true });
      }

      case "deny_visit": {
        const { visitId } = data;
        const { error } = await supabaseAdmin.from("visits").update({ status: "denied" }).eq("id", visitId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true });
      }

      case "flag_activity": {
        const { visitId, reason, reviewedBy } = data;
        if (!visitId || !reason || !reviewedBy) return NextResponse.json({ error: "visitId, reason, and reviewedBy required" }, { status: 400 });

        const { error } = await supabaseAdmin.from("activity_reviews").insert({
          visit_id: visitId, reviewed_by: reviewedBy, action: "flagged", reason,
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true }, { status: 201 });
      }

      case "resolve_activity": {
        const { reviewId, notes } = data;
        if (!reviewId) return NextResponse.json({ error: "reviewId required" }, { status: 400 });

        const { error } = await supabaseAdmin.from("activity_reviews").update({ action: "resolved", notes }).eq("id", reviewId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true });
      }

      case "escalate_activity": {
        const { reviewId, notes } = data;
        if (!reviewId) return NextResponse.json({ error: "reviewId required" }, { status: 400 });

        const { error } = await supabaseAdmin.from("activity_reviews").update({ action: "escalated", notes }).eq("id", reviewId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin CRUD error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
