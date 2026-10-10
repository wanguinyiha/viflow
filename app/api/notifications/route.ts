import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const supabaseAdmin = getSupabaseAdmin();
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  if (auth.role !== "admin" && userId !== auth.userId) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
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

export async function POST(req: NextRequest) {
  const auth = await requireUser(["guard", "resident", "admin"]);
  if (!auth.ok) return auth.response;

  const supabaseAdmin = getSupabaseAdmin();
  const body = await req.json();
  const { userId, title, message, type, kind, entityType, entityId, link } = body as {
    userId: string;
    title: string;
    message: string;
    type: string;
    kind?: string;
    entityType?: string;
    entityId?: string;
    link?: string;
  };

  if (!userId || !title || !message) {
    return NextResponse.json({ error: "userId, title, and message required" }, { status: 400 });
  }

  if (auth.role !== "admin" && auth.role !== "guard" && userId !== auth.userId) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message,
      type: type ?? "general",
      kind: kind ?? "notification",
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      link: link ?? null,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const supabaseAdmin = getSupabaseAdmin();
  const body = await req.json();
  const { ids, userId } = body as { ids?: string[]; userId?: string };

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  if (auth.role !== "admin" && userId !== auth.userId) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
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
