"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WeeklySchedule } from "@/components/shared/weekly-schedule";
import { DateOverrides } from "@/components/shared/date-overrides";
import { Separator } from "@/components/ui/separator";

interface ArtistOption {
  id: string;
  name: string;
}

export function AvailabilityManager({
  artists,
}: {
  artists: ArtistOption[];
}) {
  const [selectedId, setSelectedId] = useState(artists[0].id);

  return (
    <div className="space-y-6">
      {artists.length > 1 && (
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select artist" />
          </SelectTrigger>
          <SelectContent>
            {artists.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <WeeklySchedule key={`schedule-${selectedId}`} artistId={selectedId} />
      <Separator />
      <DateOverrides key={`overrides-${selectedId}`} artistId={selectedId} />
    </div>
  );
}
