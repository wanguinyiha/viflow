import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { ids, userId } = body as { ids?: string[]; userId?: string };

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  let query = supabaseAdmin
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId);

  if (ids && ids.length > 0) {
    query = query.in("id", ids);
  } else {
    query = query.eq("read", false);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
