import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendBookingStatusEmail } from "@/lib/email";
import { getBookingWhatsAppLink } from "@/lib/whatsapp";

const updateBookingSchema = z.object({
  status: z
    .enum(["pending", "confirmed", "cancelled", "completed", "no_show"])
    .optional(),
  notes: z.string().optional().nullable(),
  cancel_reason: z.string().optional().nullable(),
});

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

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, artists(name, whatsapp_number), studios(name, address, city, whatsapp_number)")
    .eq("id", id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("id", booking.studio_id)
    .eq("owner_id", user.id)
    .single();

  if (!studio) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { cancel_reason, ...updateData } = parsed.data;

  // If cancelling with reason, store in notes
  if (updateData.status === "cancelled" && cancel_reason) {
    updateData.notes = cancel_reason;
  }

  const { data: updated, error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send status email for confirmed/cancelled
  if (
    (updateData.status === "confirmed" || updateData.status === "cancelled") &&
    booking.client_email
  ) {
    const artistData = booking.artists as { name: string; whatsapp_number: string | null } | null;
    const studioData = booking.studios as { name: string; address: string | null; city: string | null; whatsapp_number: string | null } | null;
    const artistName = artistData?.name ?? "Artist";
    const studioName = studioData?.name ?? "Studio";
    const studioAddress = [studioData?.address, studioData?.city].filter(Boolean).join(", ") || null;
    const phone = artistData?.whatsapp_number ?? studioData?.whatsapp_number ?? null;

    const whatsAppLink = phone
      ? getBookingWhatsAppLink({
          phone,
          artistName,
          studioName,
          date: booking.date,
          time: booking.start_time,
        })
      : null;

    sendBookingStatusEmail({
      clientEmail: booking.client_email,
      clientName: booking.client_name,
      artistName,
      studioName,
      studioAddress,
      date: booking.date,
      startTime: booking.start_time,
      endTime: booking.end_time,
      status: updateData.status as "confirmed" | "cancelled",
      reason: cancel_reason,
      whatsAppLink,
    });
  }

  return NextResponse.json({ data: updated });
}
