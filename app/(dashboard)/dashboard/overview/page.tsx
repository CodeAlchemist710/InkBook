import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays, TrendingUp, ArrowRight } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { TodayActions } from "@/components/shared/today-actions";

export default async function OverviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: studio } = await supabase
    .from("studios")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/login");

  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const [artistsResult, upcomingResult, monthResult, todayResult] =
    await Promise.all([
      supabase
        .from("artists")
        .select("id", { count: "exact", head: true })
        .eq("studio_id", studio.id),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("studio_id", studio.id)
        .gte("date", today)
        .in("status", ["pending", "confirmed"]),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("studio_id", studio.id)
        .gte("date", monthStart)
        .lte("date", monthEnd),
      supabase
        .from("bookings")
        .select("*, artists(name)")
        .eq("studio_id", studio.id)
        .eq("date", today)
        .in("status", ["pending", "confirmed"])
        .order("start_time", { ascending: true }),
    ]);

  const artistCount = artistsResult.count ?? 0;
  const upcomingCount = upcomingResult.count ?? 0;
  const monthCount = monthResult.count ?? 0;
  const todayBookings = todayResult.data ?? [];

  const stats = [
    {
      title: "Artists",
      count: artistCount,
      icon: Users,
      subtitle:
        artistCount === 0 ? "Add your first artist to get started" : undefined,
    },
    {
      title: "Upcoming Bookings",
      count: upcomingCount,
      icon: CalendarDays,
      subtitle: upcomingCount === 0 ? "No upcoming bookings yet" : undefined,
    },
    {
      title: "This Month",
      count: monthCount,
      icon: TrendingUp,
      subtitle: monthCount === 0 ? "No bookings this month" : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {studio.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your studio today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{stat.title}</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              {stat.subtitle && (
                <CardDescription>{stat.subtitle}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Schedule */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Today&apos;s Schedule</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/bookings">
                View all
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {todayBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sessions scheduled for today.
            </p>
          ) : (
            <div className="space-y-3">
              {todayBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {booking.start_time?.slice(0, 5)} —{" "}
                        {booking.end_time?.slice(0, 5)}
                      </span>
                      <Badge
                        variant={
                          booking.status === "confirmed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {booking.client_name}
                      {booking.artists &&
                        ` · ${(booking.artists as { name: string }).name}`}
                    </p>
                  </div>
                  <TodayActions
                    bookingId={booking.id}
                    status={booking.status ?? "pending"}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
