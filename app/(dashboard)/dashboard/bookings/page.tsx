import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingsView } from "@/components/shared/bookings-view";

export default async function BookingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/login");

  const [{ data: bookings }, { data: artists }] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, artists(name)")
      .eq("studio_id", studio.id)
      .order("date", { ascending: false }),
    supabase
      .from("artists")
      .select("id, name")
      .eq("studio_id", studio.id)
      .order("name"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Bookings</h1>
      <BookingsView
        bookings={bookings ?? []}
        artists={artists ?? []}
      />
    </div>
  );
}
