import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ImageIcon, CalendarDays, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "InkBook — Professional Booking for Tattoo Studios",
  description:
    "The all-in-one platform for tattoo studios to showcase portfolios, manage bookings, and connect with clients.",
  openGraph: {
    title: "InkBook — Professional Booking for Tattoo Studios",
    description:
      "The all-in-one platform for tattoo studios to showcase portfolios, manage bookings, and connect with clients.",
    type: "website",
  },
};

const features = [
  {
    icon: ImageIcon,
    title: "Portfolio",
    description: "Showcase your best work with a stunning gallery.",
  },
  {
    icon: CalendarDays,
    title: "Booking",
    description: "Let clients book sessions based on your availability.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    description: "Connect with clients instantly via WhatsApp.",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();

  const { data: studios } = await supabase
    .from("studios")
    .select("id, name, slug, logo_url, city, description")
    .eq("is_active", true)
    .limit(6);

  return (
    <div>
      {/* Hero */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl">
            Professional booking for
            <br />
            <span className="text-zinc-600">tattoo studios</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600">
            Showcase your portfolio, manage your schedule, and let clients book
            sessions — all in one platform built for tattoo artists.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/signup">I&apos;m a studio owner</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <a href="#studios">I&apos;m looking for a tattoo</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
                  <feature.icon className="h-6 w-6 text-zinc-700" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Studios */}
      {studios && studios.length > 0 && (
        <section id="studios" className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-zinc-900">
              Featured Studios
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {studios.map((studio) => (
                <Link key={studio.id} href={`/${studio.slug}`}>
                  <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                    {studio.logo_url ? (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={studio.logo_url}
                          alt={studio.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg font-bold text-zinc-500">
                        {studio.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-zinc-900">
                        {studio.name}
                      </h3>
                      {studio.city && (
                        <p className="text-sm text-zinc-500">{studio.city}</p>
                      )}
                      {studio.description && (
                        <p className="mt-1 truncate text-sm text-zinc-600">
                          {studio.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
