import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { email, password, fullName, role } = await request.json();

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (role !== "guard" && role !== "admin") {
      return NextResponse.json({ error: "Only guard and admin accounts can be provisioned" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Manually create profile (triggers removed)
    const userId = data.user.id;
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: fullName,
      email,
      role,
    }, { onConflict: "id" });

    if (profileError) {
      return NextResponse.json({ user: data.user, warning: `Profile: ${profileError.message}` }, { status: 201 });
    }

    return NextResponse.json({ user: data.user }, { status: 201 });
  } catch (error) {
    console.error("Provision error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
