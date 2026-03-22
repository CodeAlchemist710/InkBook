import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ChevronRight } from "lucide-react";
import { BookingFlow } from "@/components/shared/booking-flow";

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

  return {
    title: `Book with ${artist.name} — ${studio.name} | InkBook`,
    description: `Book a tattoo session with ${artist.name} at ${studio.name}`,
  };
}

export default async function BookingPage({ params }: Props) {
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-zinc-500">
        <Link href={`/${studioSlug}`} className="hover:text-zinc-900">
          {studio.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/${studioSlug}/${artistSlug}`}
          className="hover:text-zinc-900"
        >
          {artist.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-zinc-900">Book</span>
      </nav>

      <BookingFlow
        artist={{
          id: artist.id,
          name: artist.name,
          slug: artist.slug,
          whatsapp_number: artist.whatsapp_number,
        }}
        studio={{
          id: studio.id,
          name: studio.name,
          slug: studio.slug,
          address: studio.address,
          city: studio.city,
          whatsapp_number: studio.whatsapp_number,
        }}
      />
    </div>
  );
}
