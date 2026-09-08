import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST() {
  const log: string[] = [];

  // 1. Create auth users and profiles
  const demoUsers = [
    { email: "admin@viflow.com", password: "admin123", full_name: "Sarah Mwangi", role: "admin" as const },
    { email: "resident@viflow.com", password: "resident123", full_name: "Tendai Wanjiru", role: "resident" as const },
    { email: "visitor@viflow.com", password: "visitor123", full_name: "Amara Kimani", role: "visitor" as const },
    { email: "guard@viflow.com", password: "guard123", full_name: "James Otieno", role: "guard" as const },
  ];

  const userIds: Record<string, string> = {};

  for (const u of demoUsers) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
    });
    if (error && !error.message?.includes("already")) {
      log.push(`Auth ${u.email}: ${error.message}`);
    }
    const userId = data?.user?.id;
    if (userId) {
      userIds[u.role] = userId;
      await supabaseAdmin.from("profiles").upsert({
        id: userId, full_name: u.full_name, email: u.email, role: u.role,
      }, { onConflict: "id" });
    } else {
      const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("email", u.email).single();
      if (existing) userIds[u.role] = existing.id;
    }
  }
  log.push(`Users: ${Object.keys(userIds).length} ready`);

  // 2. Rooms: Block A (1-10), Block B (1-10)
  const rooms: { room_number: string; block: string; floor: number; is_occupied: boolean }[] = [];

  for (const block of ["A", "B"]) {
    for (let i = 1; i <= 10; i++) {
      rooms.push({
        room_number: String(i),
        block,
        floor: block === "A" ? 1 : 2,
        is_occupied: false,
      });
    }
  }

  for (const room of rooms) {
    await supabaseAdmin.from("rooms").upsert(room, { onConflict: "room_number,block", ignoreDuplicates: true });
  }
  log.push(`Rooms: ${rooms.length} (Block A: 1-10, Block B: 1-10)`);

  // 3. Get room A-4 ID for demo resident
  const { data: roomA4 } = await supabaseAdmin.from("rooms").select("id").eq("block", "A").eq("room_number", "4").single();

  // 4. Create resident profile for demo resident
  if (userIds.resident && roomA4) {
    await supabaseAdmin.from("resident_profiles").upsert({
      user_id: userIds.resident,
      room_id: roomA4.id,
      student_number: "USIU-2024-001",
      status: "active",
    }, { onConflict: "user_id" });

    // Mark room as occupied
    await supabaseAdmin.from("rooms").update({ is_occupied: true }).eq("id", roomA4.id);
    log.push("Resident profile: demo resident linked to room A-4");
  }

  // 5. Demo visitor - fully verified
  if (userIds.visitor) {
    await supabaseAdmin.from("visitor_profiles").upsert({
      user_id: userIds.visitor,
      full_name: "Amara Kimani",
      email: "visitor@viflow.com",
      phone: "+254700123456",
      id_number: "39284756",
      id_verified: true,
      photo_verified: true,
    }, { onConflict: "user_id" });

    // Get visitor profile ID
    const { data: vp } = await supabaseAdmin.from("visitor_profiles").select("id").eq("user_id", userIds.visitor).single();

    if (vp) {
      await supabaseAdmin.from("vehicles").upsert({
        visitor_id: vp.id,
        registration_number: "KDA 123B",
        make: "Toyota",
        model: "Corolla",
        color: "Silver",
        is_active: true,
      }, { onConflict: "registration_number" });
    }
    log.push("Demo visitor: verified with vehicle");
  }

  // 6. Extra visitors (no user accounts - just visitor_profiles)
  const extraVisitors = [
    { full_name: "Aisha Kwame", email: "aisha@example.com", phone: "+254712345001" },
    { full_name: "Brian Ochieng", email: "brian@example.com", phone: "+254712345002" },
    { full_name: "Chloe Njeri", email: "chloe@example.com", phone: "+254712345003" },
    { full_name: "David Muthoni", email: "david@example.com", phone: "+254712345004" },
  ];

  const visitorProfileIds: string[] = [];
  for (const v of extraVisitors) {
    // Create visitor profile linked to demo resident
    const { data: vp, error } = await supabaseAdmin.from("visitor_profiles").upsert({
      user_id: userIds.visitor, // Link to visitor user for simplicity
      full_name: v.full_name,
      email: v.email,
      phone: v.phone,
    }, { onConflict: "email" }).select("id").single();

    if (vp) visitorProfileIds.push(vp.id);
    if (error) log.push(`Visitor ${v.full_name}: ${error.message}`);
  }
  log.push(`Extra visitors: ${visitorProfileIds.length}`);

  // 7. Get room IDs
  const { data: roomA1 } = await supabaseAdmin.from("rooms").select("id").eq("block", "A").eq("room_number", "1").single();
  const { data: roomB2 } = await supabaseAdmin.from("rooms").select("id").eq("block", "B").eq("room_number", "2").single();

  // 8. Invitations
  const invitations = [
    { visitor_name: "Amara Kimani", visitor_email: "visitor@viflow.com", reason: "Study session", status: "accepted", visit_start: daysAgo(2), visit_end: daysFromNow(28), visitor_id: userIds.visitor, room_id: roomA4?.id },
    { visitor_name: "Aisha Kwame", visitor_email: "aisha@example.com", reason: "Birthday celebration", status: "accepted", visit_start: daysAgo(1), visit_end: daysFromNow(29), visitor_id: visitorProfileIds[0], room_id: roomA4?.id },
    { visitor_name: "Brian Ochieng", visitor_email: "brian@example.com", reason: "Group project", status: "accepted", visit_start: new Date().toISOString(), visit_end: daysFromNow(5), visitor_id: visitorProfileIds[1], room_id: roomA1?.id },
    { visitor_name: "Chloe Njeri", visitor_email: "chloe@example.com", reason: "Family visit", status: "pending", visit_start: new Date().toISOString(), visit_end: daysFromNow(3), visitor_id: visitorProfileIds[2], room_id: roomB2?.id },
    { visitor_name: "David Muthoni", visitor_email: "david@example.com", reason: "Dinner", status: "expired", visit_start: daysAgo(14), visit_end: daysAgo(10), visitor_id: visitorProfileIds[3], room_id: roomA1?.id },
  ];

  const inviteIds: string[] = [];
  for (const inv of invitations) {
    const { data, error } = await supabaseAdmin.from("invitations").insert({
      resident_id: userIds.resident, visitor_name: inv.visitor_name, visitor_email: inv.visitor_email,
      visitor_id: inv.visitor_id, reason: inv.reason, status: inv.status,
      visit_start: inv.visit_start, visit_end: inv.visit_end,
      room_id: inv.room_id,
    }).select("id").single();
    if (error) log.push(`Invite: ${error.message}`);
    else inviteIds.push(data.id);
  }
  log.push(`Invitations: ${inviteIds.length}`);

  // 9. Visits
  const visits = [
    { inviteIdx: 0, status: "checked_in", checked_in_at: hoursAgo(3), visitor_id: userIds.visitor, room_id: roomA4?.id },
    { inviteIdx: 1, status: "checked_in", checked_in_at: hoursAgo(2), visitor_id: visitorProfileIds[0], room_id: roomA4?.id },
    { inviteIdx: 2, status: "checked_out", checked_in_at: hoursAgo(5), checked_out_at: hoursAgo(3), visitor_id: visitorProfileIds[1], room_id: roomA1?.id },
  ];

  const visitIds: string[] = [];
  for (const v of visits) {
    if (!inviteIds[v.inviteIdx]) continue;
    const { data, error } = await supabaseAdmin.from("visits").insert({
      visit_code: `VF-${String(v.inviteIdx + 1).padStart(3, "0")}`,
      invitation_id: inviteIds[v.inviteIdx],
      visitor_id: v.visitor_id, resident_id: userIds.resident, room_id: v.room_id,
      status: v.status, checked_in_at: v.checked_in_at, checked_out_at: v.checked_out_at ?? null,
    }).select("id").single();
    if (error) log.push(`Visit: ${error.message}`);
    else visitIds.push(data.id);
  }
  log.push(`Visits: ${visitIds.length}`);

  // 10. Visit logs
  for (const visitId of visitIds) {
    await supabaseAdmin.from("visit_logs").insert({ visit_id: visitId, action: "check_in", performed_by: userIds.guard });
  }

  // 11. Verifications
  for (const visitId of visitIds) {
    await supabaseAdmin.from("verifications").insert({
      visit_id: visitId, visitor_id: userIds.visitor, verified_by: userIds.guard,
      status: "verified", method: "photo_match",
    });
  }

  // 12. Audit logs
  await supabaseAdmin.from("audit_logs").insert([
    { user_id: userIds.admin, action: "user_created", entity_type: "profile", entity_id: userIds.resident, details: { role: "resident" } },
    { user_id: userIds.admin, action: "user_created", entity_type: "profile", entity_id: userIds.guard, details: { role: "guard" } },
    { user_id: userIds.resident, action: "invitation_created", entity_type: "invitation", entity_id: inviteIds[0], details: { visitor: "Amara Kimani" } },
    { user_id: userIds.guard, action: "visit_checked_in", entity_type: "visit", entity_id: visitIds[0], details: { visitor: "Amara Kimani" } },
  ]);

  return NextResponse.json({ success: true, log });
}

function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }
function daysFromNow(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString(); }
function hoursAgo(n: number) { const d = new Date(); d.setHours(d.getHours() - n); return d.toISOString(); }
