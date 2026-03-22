"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookingsList } from "@/components/shared/bookings-list";
import { BookingsCalendar } from "@/components/shared/bookings-calendar";
import { TableIcon, CalendarDays } from "lucide-react";

interface BookingRow {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  status: string | null;
  artist_id: string;
  artists: { name: string } | null;
}

interface ArtistOption {
  id: string;
  name: string;
}

export function BookingsView({
  bookings,
  artists,
}: {
  bookings: BookingRow[];
  artists: ArtistOption[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [view, setView] = useState<"table" | "calendar">("table");
  const artistFilter = searchParams.get("artist") ?? "all";

  function setArtistFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("artist");
    } else {
      params.set("artist", value);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  const filtered =
    artistFilter === "all"
      ? bookings
      : bookings.filter((b) => b.artist_id === artistFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* View toggle */}
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "table" | "calendar")}
        >
          <TabsList>
            <TabsTrigger value="table">
              <TableIcon className="mr-1.5 h-3.5 w-3.5" />
              Table
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Artist filter */}
        {artists.length > 1 && (
          <Select value={artistFilter} onValueChange={setArtistFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Artists" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Artists</SelectItem>
              {artists.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {view === "table" ? (
        <BookingsList bookings={filtered} />
      ) : (
        <BookingsCalendar bookings={filtered} />
      )}
    </div>
  );
}
