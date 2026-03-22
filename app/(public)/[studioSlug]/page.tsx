import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Instagram, MessageCircle, User } from "lucide-react";
import { getWhatsAppLink } from "@/lib/whatsapp";

interface Props {
  params: Promise<{ studioSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { studioSlug } = await params;
  const supabase = await createClient();

  const { data: studio } = await supabase
    .from("studios")
    .select("name, description, cover_image_url")
    .eq("slug", studioSlug)
    .eq("is_active", true)
    .single();

  if (!studio) return { title: "Studio Not Found" };

  return {
    title: `${studio.name} — InkBook`,
    description: studio.description ?? `Visit ${studio.name} on InkBook`,
    openGraph: {
      title: `${studio.name} — InkBook`,
      description: studio.description ?? `Visit ${studio.name} on InkBook`,
      images: studio.cover_image_url ? [studio.cover_image_url] : undefined,
    },
  };
}

export default async function StudioPage({ params }: Props) {
  const { studioSlug } = await params;
  const supabase = await createClient();

  const { data: studio } = await supabase
    .from("studios")
    .select("*")
    .eq("slug", studioSlug)
    .eq("is_active", true)
    .single();

  if (!studio) notFound();

  const { data: artists } = await supabase
    .from("artists")
    .select("*")
    .eq("studio_id", studio.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  // Get featured pieces for each artist
  const artistIds = (artists ?? []).map((a) => a.id);
  let featuredPieces: Record<string, string> = {};

  if (artistIds.length > 0) {
    const { data: pieces } = await supabase
      .from("portfolio_pieces")
      .select("artist_id, image_url")
      .in("artist_id", artistIds)
      .eq("is_featured", true);

    if (pieces) {
      featuredPieces = Object.fromEntries(
        pieces.map((p) => [p.artist_id, p.image_url])
      );
    }
  }

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative h-64 sm:h-80">
        {studio.cover_image_url ? (
          <Image
            src={studio.cover_image_url}
            alt={studio.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="mx-auto flex max-w-6xl items-end gap-4">
            {studio.logo_url ? (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-zinc-800">
                <Image
                  src={studio.logo_url}
                  alt={studio.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-zinc-800 bg-zinc-900 text-2xl font-bold text-zinc-400">
                {studio.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{studio.name}</h1>
              {(studio.address || studio.city) && (
                <p className="mt-1 flex items-center gap-1 text-sm text-zinc-400">
                  <MapPin className="h-3.5 w-3.5" />
                  {[studio.address, studio.city].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Studio Info */}
        <div className="mb-8 flex flex-wrap gap-3">
          {studio.whatsapp_number && (
            <Button asChild variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <a
                href={getWhatsAppLink(studio.whatsapp_number)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          )}
          {studio.instagram_url && (
            <Button asChild variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <a
                href={studio.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="mr-2 h-4 w-4" />
                Instagram
              </a>
            </Button>
          )}
        </div>

        {studio.description && (
          <p className="mb-8 max-w-2xl text-zinc-400">{studio.description}</p>
        )}

        {/* Artists */}
        <h2 className="mb-6 text-2xl font-bold">Our Artists</h2>

        {!artists || artists.length === 0 ? (
          <p className="text-zinc-500">
            No artists to display yet. Check back soon!
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist) => {
              const featuredImage = featuredPieces[artist.id];
              return (
                <div
                  key={artist.id}
                  className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50"
                >
                  {/* Featured image background */}
                  <div className="relative aspect-[4/3]">
                    {featuredImage ? (
                      <Image
                        src={featuredImage}
                        alt={artist.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                        <User className="h-16 w-16 text-zinc-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
                  </div>

                  {/* Artist info */}
                  <div className="relative p-4">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-zinc-700">
                        {artist.avatar_url ? (
                          <Image
                            src={artist.avatar_url}
                            alt={artist.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-sm font-medium text-zinc-400">
                            {artist.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold">{artist.name}</h3>
                    </div>

                    {(artist.specialties ?? []).length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {(artist.specialties ?? []).slice(0, 4).map((s) => (
                          <Badge
                            key={s}
                            variant="outline"
                            className="border-zinc-700 text-xs text-zinc-400"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline" className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                        <Link href={`/${studioSlug}/${artist.slug}`}>
                          View Portfolio
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/${studioSlug}/${artist.slug}/book`}>
                          Book Now
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
