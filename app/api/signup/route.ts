import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

const signupSchema = z.object({
  user_id: z.string().uuid(),
  studio_name: z.string().min(2),
  slug: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient.from("studios").insert({
    owner_id: parsed.data.user_id,
    name: parsed.data.studio_name,
    slug: parsed.data.slug,
    is_active: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } });
}
