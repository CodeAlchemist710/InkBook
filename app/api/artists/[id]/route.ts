import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updateArtistSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(1).optional(),
  bio: z.string().optional().nullable(),
  whatsapp_number: z.string().optional().nullable(),
  instagram_url: z.string().optional().nullable(),
  specialties: z.array(z.string()).optional(),
  avatar_url: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

async function verifyOwnership(supabase: Awaited<ReturnType<typeof createClient>>, artistId: string, userId: string) {
  const { data: artist } = await supabase
    .from("artists")
    .select("id, studio_id")
    .eq("id", artistId)
    .single();

  if (!artist) return null;

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("id", artist.studio_id)
    .eq("owner_id", userId)
    .single();

  return studio ? artist : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const artist = await verifyOwnership(supabase, id, user.id);
  if (!artist) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateArtistSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("artists")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const artist = await verifyOwnership(supabase, id, user.id);
  if (!artist) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("artists").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } });
}
