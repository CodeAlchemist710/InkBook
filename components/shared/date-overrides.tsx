"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 22) TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

interface Override {
  id: string;
  date: string;
  is_blocked: boolean | null;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

interface Rule {
  day_of_week: number;
  is_active: boolean | null;
}

export function DateOverrides({ artistId }: { artistId: string }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Override form state
  const [overrideAction, setOverrideAction] = useState<"block" | "custom">(
    "block"
  );
  const [customStart, setCustomStart] = useState("09:00");
  const [customEnd, setCustomEnd] = useState("18:00");
  const [reason, setReason] = useState("");

  const monthStr = format(currentMonth, "yyyy-MM");

  const fetchData = useCallback(async () => {
    const [overridesRes, rulesRes] = await Promise.all([
      fetch(
        `/api/availability/${artistId}/overrides?month=${monthStr}`
      ),
      fetch(`/api/availability/${artistId}/rules`),
    ]);

    if (overridesRes.ok) {
      const json = await overridesRes.json();
      setOverrides(json.data);
    }
    if (rulesRes.ok) {
      const json = await rulesRes.json();
      setRules(json.data);
    }
  }, [artistId, monthStr]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const activeDays = new Set(
    rules.filter((r) => r.is_active !== false).map((r) => r.day_of_week)
  );

  const overrideMap = new Map(overrides.map((o) => [o.date, o]));

  function getDayStatus(date: Date): "working" | "blocked" | "custom" | "off" {
    const dateStr = format(date, "yyyy-MM-dd");
    const override = overrideMap.get(dateStr);

    if (override) {
      if (override.is_blocked) return "blocked";
      return "custom";
    }

    const dayOfWeek = getDay(date);
    if (activeDays.has(dayOfWeek)) return "working";
    return "off";
  }

  function handleDateClick(date: Date) {
    if (!isSameMonth(date, currentMonth)) return;
    setSelectedDate(date);
    setOverrideAction("block");
    setCustomStart("09:00");
    setCustomEnd("18:00");
    setReason("");

    const dateStr = format(date, "yyyy-MM-dd");
    const existing = overrideMap.get(dateStr);
    if (existing) {
      if (existing.is_blocked) {
        setOverrideAction("block");
        setReason(existing.reason ?? "");
      } else {
        setOverrideAction("custom");
        setCustomStart(existing.start_time?.slice(0, 5) ?? "09:00");
        setCustomEnd(existing.end_time?.slice(0, 5) ?? "18:00");
      }
    }

    setDialogOpen(true);
  }

  async function handleSaveOverride() {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const body =
      overrideAction === "block"
        ? {
            date: dateStr,
            is_blocked: true,
            reason: reason || null,
            start_time: null,
            end_time: null,
          }
        : {
            date: dateStr,
            is_blocked: false,
            start_time: customStart,
            end_time: customEnd,
            reason: null,
          };

    const res = await fetch(`/api/availability/${artistId}/overrides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      toast.error("Failed to save override");
      return;
    }

    toast.success("Override saved");
    setDialogOpen(false);
    fetchData();
  }

  async function handleRemoveOverride() {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const res = await fetch(
      `/api/availability/${artistId}/overrides/${dateStr}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      toast.error("Failed to remove override");
      return;
    }

    toast.success("Override removed");
    setDialogOpen(false);
    fetchData();
  }

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const hasOverride = selectedDate
    ? overrideMap.has(format(selectedDate, "yyyy-MM-dd"))
    : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Date Overrides</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-xs font-medium text-muted-foreground p-1">
              {d}
            </div>
          ))}
          {calDays.map((date) => {
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const status = getDayStatus(date);
            const isToday = isSameDay(date, new Date());

            let bgClass = "";
            if (isCurrentMonth) {
              if (status === "working") bgClass = "bg-green-50 dark:bg-green-950/30";
              if (status === "blocked") bgClass = "bg-red-50 dark:bg-red-950/30";
              if (status === "custom") bgClass = "bg-yellow-50 dark:bg-yellow-950/30";
            }

            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                disabled={!isCurrentMonth}
                className={`relative aspect-square flex items-center justify-center rounded-md text-sm transition-colors ${
                  !isCurrentMonth
                    ? "text-muted-foreground/30"
                    : "hover:ring-2 hover:ring-primary/50 cursor-pointer"
                } ${bgClass} ${isToday ? "ring-1 ring-primary font-bold" : ""} ${
                  status === "blocked" && isCurrentMonth
                    ? "line-through text-red-500"
                    : ""
                }`}
              >
                {format(date, "d")}
                {isCurrentMonth && status === "working" && (
                  <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-green-500" />
                )}
                {isCurrentMonth && status === "blocked" && (
                  <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-red-500" />
                )}
                {isCurrentMonth && status === "custom" && (
                  <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-yellow-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Working day
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Blocked
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            Custom hours
          </div>
        </div>

        {/* Override dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedDate
                  ? format(selectedDate, "EEEE, MMMM d, yyyy")
                  : ""}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={overrideAction === "block" ? "default" : "outline"}
                  onClick={() => setOverrideAction("block")}
                  className="flex-1"
                >
                  Block this day
                </Button>
                <Button
                  variant={overrideAction === "custom" ? "default" : "outline"}
                  onClick={() => setOverrideAction("custom")}
                  className="flex-1"
                >
                  Custom hours
                </Button>
              </div>

              {overrideAction === "block" && (
                <div className="space-y-2">
                  <Label>Reason (optional)</Label>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Day off, Holiday"
                  />
                </div>
              )}

              {overrideAction === "custom" && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    <Label>Start</Label>
                    <Select value={customStart} onValueChange={setCustomStart}>
                      <SelectTrigger>
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
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label>End</Label>
                    <Select value={customEnd} onValueChange={setCustomEnd}>
                      <SelectTrigger>
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
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSaveOverride} className="flex-1">
                  Save
                </Button>
                {hasOverride && (
                  <Button
                    variant="outline"
                    onClick={handleRemoveOverride}
                    className="flex-1"
                  >
                    Remove override
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
