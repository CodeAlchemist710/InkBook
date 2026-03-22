import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = createServiceClient();

  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/signup`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const { data: studios } = await supabase
    .from("studios")
    .select("slug, updated_at")
    .eq("is_active", true);

  if (studios) {
    for (const studio of studios) {
      entries.push({
        url: `${baseUrl}/${studio.slug}`,
        lastModified: studio.updated_at ? new Date(studio.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  const { data: artists } = await supabase
    .from("artists")
    .select("slug, updated_at, studios(slug)")
    .eq("is_active", true);

  if (artists) {
    for (const artist of artists) {
      const studioSlug = (artist.studios as { slug: string } | null)?.slug;
      if (studioSlug) {
        entries.push({
          url: `${baseUrl}/${studioSlug}/${artist.slug}`,
          lastModified: artist.updated_at ? new Date(artist.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  }

  return entries;
}
