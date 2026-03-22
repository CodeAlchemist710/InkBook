import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createPieceSchema = z.object({
  image_url: z.string().url(),
  title: z.string().optional().nullable(),
  styles: z.array(z.string()).optional(),
  body_part: z.string().optional().nullable(),
  is_featured: z.boolean().optional(),
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pieces, error } = await supabase
    .from("portfolio_pieces")
    .select("*")
    .eq("artist_id", id)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: pieces });
}

export async function POST(
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
  const parsed = createPieceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { data: pieceData } = parsed;

  // Get max sort_order
  const { data: maxPiece } = await supabase
    .from("portfolio_pieces")
    .select("sort_order")
    .eq("artist_id", id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxPiece?.sort_order ?? -1) + 1;

  // If marking as featured, unset existing featured
  if (pieceData.is_featured) {
    await supabase
      .from("portfolio_pieces")
      .update({ is_featured: false })
      .eq("artist_id", id)
      .eq("is_featured", true);
  }

  const { data: piece, error } = await supabase
    .from("portfolio_pieces")
    .insert({
      artist_id: id,
      image_url: pieceData.image_url,
      title: pieceData.title ?? null,
      styles: pieceData.styles ?? [],
      body_part: pieceData.body_part ?? null,
      is_featured: pieceData.is_featured ?? false,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: piece });
}
