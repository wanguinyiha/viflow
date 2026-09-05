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
  const results = [];

  for (const user of demoUsers) {
    // Check if user already exists
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
    const alreadyExists = existing?.users?.some((u) => u.email === user.email);

    if (alreadyExists) {
      results.push({ email: user.email, status: "already exists" });
      continue;
    }

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
      results.push({ email: user.email, status: "error", message: error.message });
    } else {
      results.push({ email: user.email, status: "created", id: data.user.id });
    }
  }

  // Create rooms and assign to the resident
  const { data: residentProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", "resident@viflow.com")
    .single();

  if (residentProfile) {
    const rooms = [
      { room_number: "214", block: "C", resident_id: residentProfile.id, is_occupied: true },
      { room_number: "108", block: "A", resident_id: null, is_occupied: true },
      { room_number: "301", block: "B", resident_id: null, is_occupied: true },
      { room_number: "205", block: "C", resident_id: null, is_occupied: false },
      { room_number: "110", block: "A", resident_id: null, is_occupied: false },
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
