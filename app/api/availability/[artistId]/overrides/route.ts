import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_blocked: z.boolean(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
});

async function verifyOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  artistId: string,
  userId: string
) {
  const { data: artist } = await supabase
    .from("artists")
    .select("studio_id")
    .eq("id", artistId)
    .single();

  if (!artist) return false;

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("id", artist.studio_id)
    .eq("owner_id", userId)
    .single();

  return !!studio;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ artistId: string }> }
) {
  const { artistId } = await params;
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await verifyOwnership(supabase, artistId, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let query = supabase
    .from("availability_overrides")
    .select("*")
    .eq("artist_id", artistId)
    .order("date", { ascending: true });

  if (month) {
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return NextResponse.json({ error: "Invalid month format" }, { status: 400 });
    }
    query = query.gte("date", `${month}-01`).lte("date", `${month}-31`);
  }

  const { data: overrides, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: overrides });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ artistId: string }> }
) {
  const { artistId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await verifyOwnership(supabase, artistId, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createOverrideSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // Upsert: delete existing override for this date, then insert
  await supabase
    .from("availability_overrides")
    .delete()
    .eq("artist_id", artistId)
    .eq("date", parsed.data.date);

  const { data: override, error } = await supabase
    .from("availability_overrides")
    .insert({
      artist_id: artistId,
      date: parsed.data.date,
      is_blocked: parsed.data.is_blocked,
      start_time: parsed.data.start_time ?? null,
      end_time: parsed.data.end_time ?? null,
      reason: parsed.data.reason ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: override });
}
