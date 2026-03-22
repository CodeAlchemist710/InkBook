import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArtistForm } from "@/components/shared/artist-form";

export default async function NewArtistPage() {
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

  return <ArtistForm studioId={studio.id} />;
}
