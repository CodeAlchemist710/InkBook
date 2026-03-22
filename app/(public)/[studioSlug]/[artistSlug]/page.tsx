import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Instagram, MessageCircle, CalendarDays, ChevronRight, User } from "lucide-react";
import { getBookingWhatsAppLink } from "@/lib/whatsapp";
import { PortfolioGallery } from "@/components/shared/portfolio-gallery";

interface Props {
  params: Promise<{ studioSlug: string; artistSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { studioSlug, artistSlug } = await params;
  const supabase = await createClient();

  const { data: studio } = await supabase
    .from("studios")
    .select("id, name")
    .eq("slug", studioSlug)
    .eq("is_active", true)
    .single();

  if (!studio) return { title: "Not Found" };

  const { data: artist } = await supabase
    .from("artists")
    .select("name")
    .eq("studio_id", studio.id)
    .eq("slug", artistSlug)
    .eq("is_active", true)
    .single();

  if (!artist) return { title: "Not Found" };

  const { data: featured } = await supabase
    .from("portfolio_pieces")
    .select("image_url")
    .eq("is_featured", true)
    .limit(1)
    .single();

  return {
    title: `${artist.name} — ${studio.name} | InkBook`,
    description: `View ${artist.name}'s tattoo portfolio at ${studio.name}`,
    openGraph: {
      title: `${artist.name} — ${studio.name} | InkBook`,
      description: `View ${artist.name}'s tattoo portfolio at ${studio.name}`,
      images: featured?.image_url ? [featured.image_url] : undefined,
    },
  };
}

export default async function ArtistPortfolioPage({ params }: Props) {
  const { studioSlug, artistSlug } = await params;
  const supabase = await createClient();

  const { data: studio } = await supabase
    .from("studios")
    .select("*")
    .eq("slug", studioSlug)
    .eq("is_active", true)
    .single();

  if (!studio) notFound();

  const { data: artist } = await supabase
    .from("artists")
    .select("*")
    .eq("studio_id", studio.id)
    .eq("slug", artistSlug)
    .eq("is_active", true)
    .single();

  if (!artist) notFound();

  const { data: pieces } = await supabase
    .from("portfolio_pieces")
    .select("*")
    .eq("artist_id", artist.id)
    .order("sort_order", { ascending: true });

  const whatsAppPhone =
    artist.whatsapp_number ?? studio.whatsapp_number ?? null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: artist.name,
    description: artist.bio ?? undefined,
    image: artist.avatar_url ?? undefined,
    worksFor: {
      "@type": "LocalBusiness",
      name: studio.name,
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-zinc-500">
        <Link href={`/${studioSlug}`} className="hover:text-zinc-900">
          {studio.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-zinc-900">{artist.name}</span>
      </nav>

      {/* Artist Hero */}
      <div className="mb-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 shadow-sm">
          {artist.avatar_url ? (
            <Image
              src={artist.avatar_url}
              alt={artist.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-100">
              <User className="h-10 w-10 text-zinc-400" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-zinc-900">{artist.name}</h1>
          {artist.bio && (
            <p className="mt-2 max-w-2xl text-zinc-600">{artist.bio}</p>
          )}
          {(artist.specialties ?? []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(artist.specialties ?? []).map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/${studioSlug}/${artistSlug}/book`}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Book a Session
          </Link>
        </Button>
        {whatsAppPhone && (
          <Button asChild variant="outline">
            <a
              href={getBookingWhatsAppLink({
                phone: whatsAppPhone,
                artistName: artist.name,
                studioName: studio.name,
              })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </a>
          </Button>
        )}
        {artist.instagram_url && (
          <Button asChild variant="outline">
            <a
              href={artist.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="mr-2 h-4 w-4" />
              Instagram
            </a>
          </Button>
        )}
      </div>

      {/* Portfolio Gallery */}
      <PortfolioGallery pieces={pieces ?? []} artistName={artist.name} />
    </div>
  );
}
