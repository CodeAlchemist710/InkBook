import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAvailableSlots, getAvailableDatesInMonth } from "@/lib/availability";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const monthSchema = z.string().regex(/^\d{4}-\d{2}$/);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ artistId: string }> }
) {
  const { artistId } = await params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const month = searchParams.get("month");

  const supabase = await createClient();

  if (date) {
    const parsed = dateSchema.safeParse(date);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }

    const slots = await getAvailableSlots(supabase, artistId, date);
    return NextResponse.json(
      { slots },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  }

  if (month) {
    const parsed = monthSchema.safeParse(month);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid month format. Use YYYY-MM" }, { status: 400 });
    }

    const [year, m] = month.split("-").map(Number);
    const dates = await getAvailableDatesInMonth(supabase, artistId, year, m);
    return NextResponse.json(
      { dates },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  }

  return NextResponse.json(
    { error: "Provide either date or month query parameter" },
    { status: 400 }
  );
}
