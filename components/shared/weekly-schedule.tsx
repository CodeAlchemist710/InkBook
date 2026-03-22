"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
];

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 22) TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

const SLOT_DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
];

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

function timeToPercent(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return ((h - 6) * 60 + m) / (16 * 60) * 100; // 6:00-22:00 = 16 hours
}

export function WeeklySchedule({ artistId }: { artistId: string }) {
  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>(() => {
    const initial: Record<number, DaySchedule> = {};
    DAYS.forEach((d) => {
      initial[d.value] = {
        enabled: false,
        startTime: "09:00",
        endTime: "18:00",
        slotDuration: 60,
      };
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadRules = useCallback(async () => {
    const res = await fetch(`/api/availability/${artistId}/rules`);
    if (!res.ok) return;
    const json = await res.json();
    const rules = json.data as {
      day_of_week: number;
      start_time: string;
      end_time: string;
      slot_duration: number | null;
      is_active: boolean | null;
    }[];

    setSchedule((prev) => {
      const updated = { ...prev };
      rules.forEach((rule) => {
        updated[rule.day_of_week] = {
          enabled: rule.is_active !== false,
          startTime: rule.start_time.slice(0, 5),
          endTime: rule.end_time.slice(0, 5),
          slotDuration: rule.slot_duration ?? 60,
        };
      });
      return updated;
    });
    setLoaded(true);
  }, [artistId]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadRules();
  }, [loadRules]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function updateDay(dayOfWeek: number, updates: Partial<DaySchedule>) {
    setSchedule((prev) => ({
      ...prev,
      [dayOfWeek]: { ...prev[dayOfWeek], ...updates },
    }));
  }

  async function handleSave() {
    setSaving(true);

    const rules = DAYS.map((d) => ({
      day_of_week: d.value,
      start_time: schedule[d.value].startTime,
      end_time: schedule[d.value].endTime,
      slot_duration: schedule[d.value].slotDuration,
      is_active: schedule[d.value].enabled,
    }));

    const res = await fetch(`/api/availability/${artistId}/rules`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rules),
    });

    setSaving(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Failed to save schedule");
      return;
    }

    toast.success("Schedule saved");
  }

  if (!loaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map((day) => {
          const s = schedule[day.value];
          return (
            <div key={day.value} className="space-y-2">
              <div
                className={`flex flex-wrap items-center gap-4 rounded-lg border p-3 ${
                  !s.enabled ? "opacity-50 bg-muted/30" : "bg-card"
                }`}
              >
                <div className="flex items-center gap-2 w-32">
                  <Switch
                    checked={s.enabled}
                    onCheckedChange={(checked) =>
                      updateDay(day.value, { enabled: checked })
                    }
                  />
                  <Label className="text-sm font-medium">{day.label}</Label>
                </div>

                {s.enabled && (
                  <>
                    <Select
                      value={s.startTime}
                      onValueChange={(v) =>
                        updateDay(day.value, { startTime: v })
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <span className="text-sm text-muted-foreground">to</span>

                    <Select
                      value={s.endTime}
                      onValueChange={(v) =>
                        updateDay(day.value, { endTime: v })
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={String(s.slotDuration)}
                      onValueChange={(v) =>
                        updateDay(day.value, { slotDuration: Number(v) })
                      }
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SLOT_DURATIONS.map((d) => (
                          <SelectItem key={d.value} value={String(d.value)}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>

              {s.enabled && (
                <div className="h-2 rounded-full bg-muted relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 rounded-full bg-primary/40"
                    style={{
                      left: `${timeToPercent(s.startTime)}%`,
                      width: `${timeToPercent(s.endTime) - timeToPercent(s.startTime)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        <Button onClick={handleSave} disabled={saving} className="mt-4">
          {saving ? "Saving..." : "Save All"}
        </Button>
      </CardContent>
    </Card>
  );
}
