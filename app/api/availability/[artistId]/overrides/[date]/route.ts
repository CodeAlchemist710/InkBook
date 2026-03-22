import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ artistId: string; date: string }> }
) {
  const { artistId, date } = await params;
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

  const { error } = await supabase
    .from("availability_overrides")
    .delete()
    .eq("artist_id", artistId)
    .eq("date", date);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } });
}
