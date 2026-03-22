import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArtistForm } from "@/components/shared/artist-form";
import { PortfolioManager } from "@/components/shared/portfolio-manager";
import { Separator } from "@/components/ui/separator";

export default async function EditArtistPage({
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
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/login");

  const { data: artist } = await supabase
    .from("artists")
    .select("*")
    .eq("id", id)
    .eq("studio_id", studio.id)
    .single();

  if (!artist) redirect("/dashboard/artists");

  return (
    <div className="space-y-8">
      <ArtistForm studioId={studio.id} artist={artist} />
      <Separator />
      <PortfolioManager artistId={artist.id} studioId={studio.id} />
    </div>
  );
}
