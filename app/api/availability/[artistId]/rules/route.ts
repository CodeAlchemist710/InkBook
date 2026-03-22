import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ruleSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  slot_duration: z.number().min(15).max(240),
  is_active: z.boolean(),
});

const putSchema = z.array(ruleSchema);

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
  _request: Request,
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

  const { data: rules, error } = await supabase
    .from("availability_rules")
    .select("*")
    .eq("artist_id", artistId)
    .order("day_of_week", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: rules });
}

export async function PUT(
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
  const parsed = putSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // Delete existing rules
  const { error: deleteError } = await supabase
    .from("availability_rules")
    .delete()
    .eq("artist_id", artistId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Insert new rules (only active ones)
  const activeRules = parsed.data.filter((r) => r.is_active);

  if (activeRules.length > 0) {
    const { error: insertError } = await supabase
      .from("availability_rules")
      .insert(
        activeRules.map((r) => ({
          artist_id: artistId,
          day_of_week: r.day_of_week,
          start_time: r.start_time,
          end_time: r.end_time,
          slot_duration: r.slot_duration,
          is_active: true,
        }))
      );

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ data: { success: true } });
}
