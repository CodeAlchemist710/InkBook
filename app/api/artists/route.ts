import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createArtistSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(1),
  bio: z.string().optional().nullable(),
  whatsapp_number: z.string().optional().nullable(),
  instagram_url: z.string().optional().nullable(),
  specialties: z.array(z.string()).optional(),
  avatar_url: z.string().optional().nullable(),
  studio_id: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createArtistSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { data } = parsed;

  // Verify user owns the studio
  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("id", data.studio_id)
    .eq("owner_id", user.id)
    .single();

  if (!studio) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: artist, error } = await supabase
    .from("artists")
    .insert({
      name: data.name,
      slug: data.slug,
      bio: data.bio ?? null,
      whatsapp_number: data.whatsapp_number ?? null,
      instagram_url: data.instagram_url ?? null,
      specialties: data.specialties ?? [],
      avatar_url: data.avatar_url ?? null,
      studio_id: data.studio_id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: artist });
}
