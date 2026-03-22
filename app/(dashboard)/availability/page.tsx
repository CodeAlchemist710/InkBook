import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityManager } from "@/components/shared/availability-manager";

export default async function AvailabilityPage() {
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

  const { data: artists } = await supabase
    .from("artists")
    .select("id, name")
    .eq("studio_id", studio.id)
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Availability</h1>
      {!artists || artists.length === 0 ? (
        <p className="text-muted-foreground">
          Add an artist first to manage their availability.
        </p>
      ) : (
        <AvailabilityManager artists={artists} />
      )}
    </div>
  );
}
