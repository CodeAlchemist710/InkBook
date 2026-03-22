import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, CalendarDays, TrendingUp } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";

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

  const [artistsResult, upcomingResult, monthResult] = await Promise.all([
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
  ]);

  const artistCount = artistsResult.count ?? 0;
  const upcomingCount = upcomingResult.count ?? 0;
  const monthCount = monthResult.count ?? 0;

  const stats = [
    {
      title: "Artists",
      count: artistCount,
      icon: Users,
      subtitle: artistCount === 0 ? "Add your first artist to get started" : undefined,
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
      <h1 className="text-2xl font-semibold">
        Welcome back, {studio.name}
      </h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{stat.title}</CardTitle>
                <stat.icon className="h-5 w-5 text-muted-foreground" />
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
    </div>
  );
}
