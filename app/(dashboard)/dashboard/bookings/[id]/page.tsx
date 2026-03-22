import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingDetail } from "@/components/shared/booking-detail";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: studio } = await supabase
    .from("studios")
    .select("id, whatsapp_number")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/login");

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, artists(name, whatsapp_number)")
    .eq("id", id)
    .eq("studio_id", studio.id)
    .single();

  if (!booking) redirect("/dashboard/bookings");

  return (
    <div className="space-y-6">
      <BookingDetail booking={booking} />
    </div>
  );
}
