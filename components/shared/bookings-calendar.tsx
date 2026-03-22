"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
} from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, X, Eye } from "lucide-react";

interface BookingRow {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  client_name: string;
  status: string | null;
  artists: { name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-green-500",
  cancelled: "bg-red-400",
  completed: "bg-blue-500",
  no_show: "bg-zinc-400",
};

export function BookingsCalendar({ bookings }: { bookings: BookingRow[] }) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group bookings by date
  const bookingsByDate = new Map<string, BookingRow[]>();
  for (const b of bookings) {
    const existing = bookingsByDate.get(b.date) ?? [];
    existing.push(b);
    bookingsByDate.set(b.date, existing);
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const selectedBookings = selectedDate
    ? (bookingsByDate.get(selectedDate) ?? []).sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      )
    : [];

  async function quickAction(id: string, status: string) {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Failed to update");
      return;
    }
    toast.success(`Booking ${status}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          {/* Month nav */}
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentMonth(new Date());
                  setSelectedDate(format(new Date(), "yyyy-MM-dd"));
                }}
              >
                Today
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="p-1 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
            {calDays.map((date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const inMonth = isSameMonth(date, currentMonth);
              const dayBookings = bookingsByDate.get(dateStr) ?? [];
              const isSelected = selectedDate === dateStr;
              const today = isToday(date);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative min-h-[3.5rem] rounded-md border p-1 text-left text-sm transition-colors ${
                    !inMonth
                      ? "border-transparent text-muted-foreground/30"
                      : isSelected
                        ? "border-primary bg-primary/5"
                        : today
                          ? "border-primary/50"
                          : "border-transparent hover:bg-muted/50"
                  }`}
                >
                  <span
                    className={`text-xs ${today ? "font-bold text-primary" : ""}`}
                  >
                    {format(date, "d")}
                  </span>
                  {inMonth && dayBookings.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap gap-0.5">
                      {dayBookings.slice(0, 3).map((b) => (
                        <span
                          key={b.id}
                          className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[b.status ?? "pending"]}`}
                        />
                      ))}
                      {dayBookings.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{dayBookings.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected date details */}
      {selectedDate && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="mb-3 text-sm font-medium">
              {format(new Date(selectedDate + "T00:00:00"), "EEEE, MMMM d, yyyy")}
              <span className="ml-2 text-muted-foreground">
                ({selectedBookings.length} booking
                {selectedBookings.length !== 1 ? "s" : ""})
              </span>
            </h3>

            {selectedBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No bookings for this date.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div
                      className={`h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[b.status ?? "pending"]}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {b.start_time?.slice(0, 5)} — {b.client_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {b.artists?.name ?? "—"} ·{" "}
                        {b.status?.charAt(0).toUpperCase()}
                        {b.status?.slice(1)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {b.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => quickAction(b.id, "confirmed")}
                          title="Confirm"
                        >
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        </Button>
                      )}
                      {b.status !== "cancelled" && b.status !== "completed" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => quickAction(b.id, "cancelled")}
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        asChild
                      >
                        <Link href={`/dashboard/bookings/${b.id}`} title="View">
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-yellow-500" />
          Pending
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Confirmed
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Completed
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          Cancelled
        </div>
      </div>
    </div>
  );
}
