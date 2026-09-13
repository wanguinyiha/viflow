import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { invitationAccepted } from "@/lib/notifications";

export const dynamic = "force-dynamic";

function generateRandomPassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, fullName, phone, idNumber, vehiclePlate, invitationId } = body;

    if (!email || !fullName) {
      return NextResponse.json({ error: "Email and full name are required" }, { status: 400 });
    }

    // Check if visitor already has a profile by email
    const { data: existingVisitor } = await supabaseAdmin
      .from("visitor_profiles")
      .select("id, user_id")
      .eq("email", email)
      .single();

    let userId = existingVisitor?.user_id;
    let visitorProfileId = existingVisitor?.id;

    if (!existingVisitor) {
      // Check if a profile already exists for this email
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (existingProfile) {
        userId = existingProfile.id;
      }

      if (!existingProfile) {
        // Create auth user with service role (no confirmation email sent)
        const tempPassword = generateRandomPassword();
        const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: fullName, role: "visitor" },
        });

        if (authError) {
          console.error("Auth user creation error:", authError);
          return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        userId = userData.user.id;

        // Create profile
        const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
          id: userId,
          full_name: fullName,
          email,
          phone: phone || null,
          role: "visitor",
        }, { onConflict: "id" });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          return NextResponse.json({ error: "Failed to create profile: " + profileError.message }, { status: 400 });
        }
      }

      // Create visitor profile
      const { data: newVisitorProfile, error: visitorProfileError } = await supabaseAdmin
        .from("visitor_profiles")
        .insert({
          user_id: userId,
          full_name: fullName,
          email,
          phone: phone || null,
          id_number: idNumber || null,
        })
        .select("id")
        .single();

      if (visitorProfileError) {
        console.error("Visitor profile creation error:", visitorProfileError);
        return NextResponse.json({ error: "Failed to create visitor profile: " + visitorProfileError.message }, { status: 400 });
      }

      visitorProfileId = newVisitorProfile.id;
    } else {
      // Update existing visitor profile with new info
      await supabaseAdmin
        .from("visitor_profiles")
        .update({
          full_name: fullName,
          phone: phone || null,
          id_number: idNumber || null,
        })
        .eq("id", existingVisitor.id);
    }

    if (!visitorProfileId) {
      return NextResponse.json({ error: "Failed to create visitor profile" }, { status: 400 });
    }

    // Add vehicle if provided and not N/A
    if (vehiclePlate && vehiclePlate.toUpperCase() !== "N/A" && visitorProfileId) {
      const { data: existingVehicle } = await supabaseAdmin
        .from("vehicles")
        .select("id")
        .eq("visitor_id", visitorProfileId)
        .eq("registration_number", vehiclePlate)
        .single();

      if (!existingVehicle) {
        const { error: vehicleError } = await supabaseAdmin.from("vehicles").insert({
          visitor_id: visitorProfileId,
          registration_number: vehiclePlate,
        });
        if (vehicleError) console.error("Vehicle error:", vehicleError);
      }
    }

    // Update invitation if exists
    if (invitationId) {
      const { data: invitation } = await supabaseAdmin
        .from("invitations")
        .select("*, room:rooms(id)")
        .eq("id", invitationId)
        .single();

      if (invitation) {
        // Update invitation with visitor info
        await supabaseAdmin
          .from("invitations")
          .update({
            visitor_id: visitorProfileId,
            visitor_name: fullName,
            status: "accepted",
          })
          .eq("id", invitationId);

        // Create visit record
        const room = invitation.room as { id: string } | null;
        if (room) {
          const { error: visitError } = await supabaseAdmin.from("visits").insert({
            invitation_id: invitationId,
            visit_code: invitation.visit_code,
            visitor_id: visitorProfileId,
            resident_id: invitation.resident_id,
            room_id: room.id,
            status: "authorized",
          });
          if (visitError) {
            console.error("Visit create error:", visitError);
            return NextResponse.json({ error: "Failed to create visit record: " + visitError.message }, { status: 400 });
          }

          // Notify resident that visitor accepted their invitation
          invitationAccepted({
            residentId: invitation.resident_id,
            visitorName: fullName,
            invitationId,
          });
        }
      }
    }

    return NextResponse.json({ success: true, visitorProfileId, invitationId });
  } catch (error) {
    console.error("Visitor registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
