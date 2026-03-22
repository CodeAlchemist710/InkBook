import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
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
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Professional booking for
            <br />
            <span className="text-primary">tattoo studios</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-300">
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
              className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 sm:w-auto"
            >
              <a href="#studios">I&apos;m looking for a tattoo</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-zinc-300">
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
            <h2 className="mb-8 text-center text-2xl font-bold">
              Featured Studios
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {studios.map((studio) => (
                <Link key={studio.id} href={`/${studio.slug}`}>
                  <Card className="border-white/10 bg-zinc-900 transition-colors hover:border-white/20">
                    <CardContent className="flex items-center gap-4 p-4">
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
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-lg font-bold text-zinc-400">
                          {studio.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-zinc-100">
                          {studio.name}
                        </h3>
                        {studio.city && (
                          <p className="text-sm text-zinc-300">{studio.city}</p>
                        )}
                        {studio.description && (
                          <p className="mt-1 truncate text-sm text-zinc-300">
                            {studio.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
