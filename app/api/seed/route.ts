import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const demoUsers = [
  {
    email: "admin@viflow.com",
    password: "admin123",
    fullName: "Sarah Mwangi",
    role: "admin" as const,
  },
  {
    email: "resident@viflow.com",
    password: "resident123",
    fullName: "Tendai Wanjiru",
    role: "resident" as const,
  },
  {
    email: "visitor@viflow.com",
    password: "visitor123",
    fullName: "Amara Kimani",
    role: "visitor" as const,
  },
  {
    email: "guard@viflow.com",
    password: "guard123",
    fullName: "James Otieno",
    role: "guard" as const,
  },
];

export async function POST() {
  const results: { email: string; status: string; id?: string; message?: string }[] = [];

  for (const user of demoUsers) {
    // Check if already seeded
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (existingProfile) {
      results.push({ email: user.email, status: "already exists" });
      continue;
    }

    // Create user via GoTrue admin API (triggers may or may not create profile)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName,
        role: user.role,
      },
    });

    if (error) {
      results.push({ email: user.email, status: "auth_error", message: error.message });
      continue;
    }

    const userId = data.user.id;

    // Always ensure profile exists (trigger may or may not have created it)
    const { data: checkProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!checkProfile) {
      const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        id: userId,
        full_name: user.fullName,
        email: user.email,
        role: user.role,
      });

      if (profileError) {
        results.push({ email: user.email, status: "profile_error", message: profileError.message });
        continue;
      }
    }

    // Create visitor profile for visitor users
    if (user.role === "visitor") {
      const { data: existingVisitor } = await supabaseAdmin
        .from("visitor_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingVisitor) {
        await supabaseAdmin.from("visitor_profiles").insert({
          user_id: userId,
          full_name: user.fullName,
          email: user.email,
        });
      }
    }

    results.push({ email: user.email, status: "created", id: userId });
  }

  // Create hostel
  const { data: hostel } = await supabaseAdmin
    .from("hostels")
    .upsert({ name: "Main Hostel", address: "University Campus", total_rooms: 5 }, { onConflict: "name" })
    .select("id")
    .single();

  // Create rooms and assign to the resident
  const { data: residentProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", "resident@viflow.com")
    .single();

  if (residentProfile && hostel) {
    const rooms = [
      { room_number: "214", block: "C", floor: 2, resident_id: residentProfile.id, is_occupied: true, hostel_id: hostel.id },
      { room_number: "108", block: "A", floor: 1, resident_id: null, is_occupied: true, hostel_id: hostel.id },
      { room_number: "301", block: "B", floor: 3, resident_id: null, is_occupied: true, hostel_id: hostel.id },
      { room_number: "205", block: "C", floor: 2, resident_id: null, is_occupied: false, hostel_id: hostel.id },
      { room_number: "110", block: "A", floor: 1, resident_id: null, is_occupied: false, hostel_id: hostel.id },
    ];

    for (const room of rooms) {
      await supabaseAdmin.from("rooms").upsert(room, {
        onConflict: "room_number,block",
        ignoreDuplicates: true,
      });
    }
  }

  return NextResponse.json({ users: results });
}
