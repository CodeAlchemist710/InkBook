import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { ArtistCard } from "@/components/shared/artist-card";

export default async function ArtistsPage() {
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
    .select("*")
    .eq("studio_id", studio.id)
    .order("created_at", { ascending: false });

  // Get portfolio counts for each artist
  const artistIds = (artists ?? []).map((a) => a.id);
  let portfolioCounts: Record<string, number> = {};

  if (artistIds.length > 0) {
    const { data: counts } = await supabase
      .from("portfolio_pieces")
      .select("artist_id")
      .in("artist_id", artistIds);

    if (counts) {
      portfolioCounts = counts.reduce<Record<string, number>>((acc, row) => {
        acc[row.artist_id] = (acc[row.artist_id] ?? 0) + 1;
        return acc;
      }, {});
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Artists</h1>
        <Button asChild>
          <Link href="/dashboard/artists/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Artist
          </Link>
        </Button>
      </div>

      {!artists || artists.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Users className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-medium">No artists yet</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Add your first artist to start building their portfolio.
          </p>
          <Button asChild>
            <Link href="/dashboard/artists/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Artist
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              portfolioCount={portfolioCounts[artist.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
