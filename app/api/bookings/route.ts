import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { getAvailableSlots } from "@/lib/availability";
import { getBookingWhatsAppLink } from "@/lib/whatsapp";
import {
  sendBookingConfirmationToClient,
  sendBookingNotificationToArtist,
} from "@/lib/email";

const bookingSchema = z.object({
  artist_id: z.string().uuid(),
  studio_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string(),
  end_time: z.string(),
  client_name: z.string().min(2),
  client_email: z.string().email(),
  client_phone: z.string().min(6),
  description: z.string().min(1),
  placement: z.string().optional().nullable(),
  estimated_size: z
    .enum(["small", "medium", "large", "full-sleeve"])
    .optional()
    .nullable(),
  reference_urls: z.array(z.string().url()).optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const data = parsed.data;

  // Verify slot availability using the regular (anon) client for RLS reads
  const supabase = await createClient();
  const slots = await getAvailableSlots(supabase, data.artist_id, data.date);
  const requestedSlot = slots.find(
    (s) => s.start === data.start_time && s.end === data.end_time
  );

  if (!requestedSlot || !requestedSlot.available) {
    return NextResponse.json(
      { error: "This time slot is no longer available. Please choose another." },
      { status: 409 }
    );
  }

  // Insert booking using service role client (bypasses RLS for anonymous insert)
  const serviceClient = createServiceClient();

  const { data: booking, error } = await serviceClient
    .from("bookings")
    .insert({
      artist_id: data.artist_id,
      studio_id: data.studio_id,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      client_name: data.client_name,
      client_email: data.client_email,
      client_phone: data.client_phone,
      description: data.description,
      placement: data.placement ?? null,
      estimated_size: data.estimated_size ?? null,
      reference_urls: data.reference_urls ?? [],
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get artist and studio info for emails
  const [{ data: artist }, { data: studio }] = await Promise.all([
    supabase.from("artists").select("name, whatsapp_number").eq("id", data.artist_id).single(),
    supabase.from("studios").select("name, address, city, owner_id, whatsapp_number").eq("id", data.studio_id).single(),
  ]);

  const artistName = artist?.name ?? "Artist";
  const studioName = studio?.name ?? "Studio";
  const studioAddress = [studio?.address, studio?.city].filter(Boolean).join(", ") || null;
  const whatsAppPhone = artist?.whatsapp_number ?? studio?.whatsapp_number ?? null;

  const whatsAppLink = whatsAppPhone
    ? getBookingWhatsAppLink({
        phone: whatsAppPhone,
        artistName,
        studioName,
        date: data.date,
        time: data.start_time,
      })
    : null;

  // Send emails (fire and forget — don't block response)
  sendBookingConfirmationToClient({
    clientEmail: data.client_email,
    clientName: data.client_name,
    artistName,
    studioName,
    studioAddress,
    date: data.date,
    startTime: data.start_time,
    endTime: data.end_time,
    whatsAppLink,
  });

  // Get owner email for notification
  if (studio?.owner_id) {
    const { data: ownerUser } = await serviceClient.auth.admin.getUserById(
      studio.owner_id
    );
    if (ownerUser?.user?.email) {
      sendBookingNotificationToArtist({
        ownerEmail: ownerUser.user.email,
        clientName: data.client_name,
        clientEmail: data.client_email,
        clientPhone: data.client_phone,
        artistName,
        studioName,
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        description: data.description,
        placement: data.placement ?? null,
        estimatedSize: data.estimated_size ?? null,
      });
    }
  }

  return NextResponse.json({ data: booking, whatsAppLink });
}
