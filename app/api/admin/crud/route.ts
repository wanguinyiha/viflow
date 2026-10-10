import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/api-auth";
import { invitationCancelled, visitorDenied, adminVisitDenied, activityFlagged, roomChanged } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const GUARD_ACTIONS = new Set([
  "verify_visitor_id",
  "verify_visitor_photo",
  "deny_visit",
]);

export async function POST(request: Request) {
  const auth = await requireUser(["admin", "guard"]);
  if (!auth.ok) return auth.response;

  const supabaseAdmin = getSupabaseAdmin();
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (auth.role !== "admin" && !GUARD_ACTIONS.has(action)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    switch (action) {
      case "create_user": {
        const { email, password, fullName, phone, role, roomId, studentNumber } = data;
        if (!email || !password || !fullName || !role) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Create Supabase Auth user with service role (server-side, no client exposure)
        const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName, role },
        });
        if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

        const userId = userData.user.id;

        // Create profile record
        const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
          id: userId, full_name: fullName, email, phone: phone || null, role,
        }, { onConflict: "id" });
        if (profileError) {
          // Cleanup: delete auth user if profile creation fails
          await supabaseAdmin.auth.admin.deleteUser(userId);
          return NextResponse.json({ error: profileError.message }, { status: 400 });
        }

        // Handle role-specific profile creation
        if (role === "resident") {
          if (!roomId) {
            // Cleanup: delete auth user and profile
            await supabaseAdmin.auth.admin.deleteUser(userId);
            await supabaseAdmin.from("profiles").delete().eq("id", userId);
            return NextResponse.json({ error: "Room is required for residents" }, { status: 400 });
          }

          // Check if room is already occupied
          const { data: existingResident } = await supabaseAdmin
            .from("resident_profiles")
            .select("id")
            .eq("room_id", roomId)
            .single();
          if (existingResident) {
            await supabaseAdmin.auth.admin.deleteUser(userId);
            await supabaseAdmin.from("profiles").delete().eq("id", userId);
            return NextResponse.json({ error: "Room is already occupied" }, { status: 400 });
          }

          // Create resident profile with room assignment
          const { error: residentError } = await supabaseAdmin.from("resident_profiles").insert({
            user_id: userId,
            room_id: roomId,
            student_number: studentNumber || null,
            status: "active",
          });
          if (residentError) {
            await supabaseAdmin.auth.admin.deleteUser(userId);
            await supabaseAdmin.from("profiles").delete().eq("id", userId);
            return NextResponse.json({ error: residentError.message }, { status: 400 });
          }

          // Mark room as occupied
          await supabaseAdmin.from("rooms").update({ is_occupied: true }).eq("id", roomId);
        }

        if (role === "visitor") {
          await supabaseAdmin.from("visitor_profiles").upsert({
            user_id: userId, full_name: fullName, email, phone: phone || null,
          }, { onConflict: "user_id" });
        }

        // Log the action
        await supabaseAdmin.from("audit_logs").insert({
          action: "user_created",
          entity_type: "profile",
          entity_id: userId,
          details: { email, full_name: fullName, role },
        });

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

        // Check if user is a resident and clean up room assignment
        const { data: residentProfile } = await supabaseAdmin
          .from("resident_profiles")
          .select("id, room_id")
          .eq("user_id", userId)
          .single();

        if (residentProfile) {
          // Mark room as unoccupied
          if (residentProfile.room_id) {
            await supabaseAdmin.from("rooms").update({ is_occupied: false }).eq("id", residentProfile.room_id);
          }
          // Delete resident profile
          await supabaseAdmin.from("resident_profiles").delete().eq("id", residentProfile.id);
        }

        // Change role to visitor
        const { error } = await supabaseAdmin.from("profiles").update({ role: "visitor" }).eq("id", userId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        // Log the action
        await supabaseAdmin.from("audit_logs").insert({
          action: "user_deactivated",
          entity_type: "profile",
          entity_id: userId,
          details: { previous_role: "resident", room_freed: !!residentProfile },
        });

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

      case "change_room": {
        const { residentProfileId, newRoomId } = data;
        if (!residentProfileId || !newRoomId) return NextResponse.json({ error: "residentProfileId and newRoomId required" }, { status: 400 });

        // Get current room
        const { data: currentProfile } = await supabaseAdmin.from("resident_profiles").select("room_id").eq("id", residentProfileId).single();
        if (!currentProfile) return NextResponse.json({ error: "Resident not found" }, { status: 404 });

        // Check if new room is occupied
        const { data: newRoomOccupant } = await supabaseAdmin.from("resident_profiles").select("id").eq("room_id", newRoomId).single();
        if (newRoomOccupant) return NextResponse.json({ error: "New room is already occupied" }, { status: 400 });

        // Get room info for notification
        const { data: oldRoom } = await supabaseAdmin.from("rooms").select("room_number, block").eq("id", currentProfile.room_id).single();
        const { data: newRoom } = await supabaseAdmin.from("rooms").select("room_number, block").eq("id", newRoomId).single();

        // Get resident info
        const { data: residentProfile } = await supabaseAdmin
          .from("resident_profiles")
          .select("user_id, profiles!inner(full_name)")
          .eq("id", residentProfileId)
          .single();
        const residentUser = residentProfile?.profiles as { full_name?: string } | null;

        // Update resident profile
        const { error } = await supabaseAdmin.from("resident_profiles").update({ room_id: newRoomId }).eq("id", residentProfileId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        // Update room occupancy
        await supabaseAdmin.from("rooms").update({ is_occupied: false }).eq("id", currentProfile.room_id);
        await supabaseAdmin.from("rooms").update({ is_occupied: true }).eq("id", newRoomId);

        // Log the room change
        await supabaseAdmin.from("audit_logs").insert({
          action: "room_changed",
          entity_type: "resident_profile",
          entity_id: residentProfileId,
          details: { old_room_id: currentProfile.room_id, new_room_id: newRoomId },
        });

        // Notify admins about room change
        if (residentUser && oldRoom && newRoom) {
          const { data: admins } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("role", "admin");

          if (admins) {
            for (const admin of admins) {
              roomChanged({
                adminUserId: admin.id,
                residentName: residentUser.full_name ?? "A resident",
                oldRoom: `${oldRoom.block} — ${oldRoom.room_number}`,
                newRoom: `${newRoom.block} — ${newRoom.room_number}`,
                residentId: residentProfileId,
              });
            }
          }
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
        // Check if room has a resident
        const { data: occupant } = await supabaseAdmin.from("resident_profiles").select("id").eq("room_id", roomId).single();
        if (occupant) return NextResponse.json({ error: "Cannot delete occupied room" }, { status: 400 });

        const { error } = await supabaseAdmin.from("rooms").delete().eq("id", roomId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true });
      }

      case "cancel_invitation": {
        const { invitationId } = data;
        // Fetch invitation data before cancelling
        const { data: inv } = await supabaseAdmin
          .from("invitations")
          .select("id, resident_id, visitor_id, visitor_name, visitor:visitor_profiles(user_id)")
          .eq("id", invitationId)
          .single();

        const { error } = await supabaseAdmin.from("invitations").update({ status: "cancelled" }).eq("id", invitationId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        // Notify visitor if they have a user account
        if (inv) {
          const visitorUser = (inv.visitor as { user_id?: string } | null)?.user_id;
          invitationCancelled({
            visitorUserId: visitorUser ?? null,
            residentName: "Your host",
            invitationId,
          });
        }

        return NextResponse.json({ success: true });
      }

      case "deny_visit": {
        const { visitId, reason } = data;
        // Fetch visit data before denying
        const { data: visit } = await supabaseAdmin
          .from("visits")
          .select("id, resident_id, visitor:visitor_profiles(full_name)")
          .eq("id", visitId)
          .single();

        const { error } = await supabaseAdmin.from("visits").update({ status: "denied" }).eq("id", visitId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        // Log the denial
        await supabaseAdmin.from("audit_logs").insert({
          action: "visit_denied",
          entity_type: "visit",
          entity_id: visitId,
          details: { reason: reason || "No reason provided" },
        });

        // Notify resident
        if (visit?.resident_id) {
          visitorDenied({
            residentId: visit.resident_id,
            visitorName: (visit.visitor as { full_name?: string } | null)?.full_name ?? "A visitor",
            visitId,
          });
        }

        // Notify admin
        const { data: admins } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("role", "admin");

        if (admins) {
          for (const admin of admins) {
            adminVisitDenied({
              adminUserId: admin.id,
              visitorName: (visit?.visitor as { full_name?: string } | null)?.full_name ?? "A visitor",
              visitId,
            });
          }
        }

        return NextResponse.json({ success: true });
      }

      case "flag_activity": {
        const { visitId, reason, reviewedBy } = data;
        if (!visitId || !reason || !reviewedBy) return NextResponse.json({ error: "visitId, reason, and reviewedBy required" }, { status: 400 });

        const { data: review, error } = await supabaseAdmin.from("activity_reviews").insert({
          visit_id: visitId, reviewed_by: reviewedBy, action: "flagged", reason,
        }).select("id").single();
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        // Notify all admins
        const { data: admins } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("role", "admin");

        if (admins && review) {
          for (const admin of admins) {
            activityFlagged({
              adminUserId: admin.id,
              title: "Activity Flagged for Review",
              message: `Activity flagged: ${reason}`,
              activityReviewId: review.id,
            });
          }
        }

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
