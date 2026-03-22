import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updatePieceSchema = z.object({
  title: z.string().optional().nullable(),
  styles: z.array(z.string()).optional(),
  body_part: z.string().optional().nullable(),
  is_featured: z.boolean().optional(),
  sort_order: z.number().optional(),
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
  { params }: { params: Promise<{ id: string; pieceId: string }> }
) {
  const { id, pieceId } = await params;
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
  const parsed = updatePieceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { data: pieceData } = parsed;

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
    .update(pieceData)
    .eq("id", pieceId)
    .eq("artist_id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: piece });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; pieceId: string }> }
) {
  const { id, pieceId } = await params;
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

  // Get the piece to find its storage path
  const { data: piece } = await supabase
    .from("portfolio_pieces")
    .select("image_url")
    .eq("id", pieceId)
    .eq("artist_id", id)
    .single();

  if (!piece) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete from database
  const { error } = await supabase
    .from("portfolio_pieces")
    .delete()
    .eq("id", pieceId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Try to delete from storage (best effort)
  try {
    const url = new URL(piece.image_url);
    const pathMatch = url.pathname.match(/\/object\/public\/portfolio\/(.+)/);
    if (pathMatch) {
      await supabase.storage.from("portfolio").remove([pathMatch[1]]);
    }
  } catch {
    // Storage deletion is best-effort
  }

  return NextResponse.json({ data: { success: true } });
}
