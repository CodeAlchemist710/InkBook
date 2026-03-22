import { SupabaseClient } from "@supabase/supabase-js";
import {
  format,
  parse,
  getDay,
  getDaysInMonth,
  isBefore,
  isToday,
} from "date-fns";
import type { Database } from "@/lib/types/database";

type Supabase = SupabaseClient<Database>;

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function generateSlots(
  startTime: string,
  endTime: string,
  slotDuration: number
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  let current = startTime;

  while (timeToMinutes(current) + slotDuration <= timeToMinutes(endTime)) {
    const end = addMinutes(current, slotDuration);
    slots.push({ start: current, end });
    current = end;
  }

  return slots;
}

export async function getAvailableSlots(
  supabase: Supabase,
  artistId: string,
  dateStr: string
): Promise<TimeSlot[]> {
  // Check overrides first
  const { data: override } = await supabase
    .from("availability_overrides")
    .select("*")
    .eq("artist_id", artistId)
    .eq("date", dateStr)
    .single();

  if (override?.is_blocked) {
    return [];
  }

  let startTime: string;
  let endTime: string;
  let slotDuration: number;

  if (override && !override.is_blocked && override.start_time && override.end_time) {
    startTime = override.start_time;
    endTime = override.end_time;
    slotDuration = 60; // default for overrides
  } else {
    // Get day of week (0=Sunday in JS, match our DB convention)
    const date = parse(dateStr, "yyyy-MM-dd", new Date());
    const dayOfWeek = getDay(date); // 0=Sun, 1=Mon, ...

    const { data: rule } = await supabase
      .from("availability_rules")
      .select("*")
      .eq("artist_id", artistId)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .single();

    if (!rule) {
      return [];
    }

    startTime = rule.start_time;
    endTime = rule.end_time;
    slotDuration = rule.slot_duration ?? 60;
  }

  // Generate all possible slots
  const rawSlots = generateSlots(startTime, endTime, slotDuration);

  // Get existing bookings for this date
  const { data: bookings } = await supabase
    .from("bookings")
    .select("start_time, end_time")
    .eq("artist_id", artistId)
    .eq("date", dateStr)
    .in("status", ["pending", "confirmed"]);

  const bookedSlots = bookings ?? [];

  // Check if date is today for filtering past slots
  const dateObj = parse(dateStr, "yyyy-MM-dd", new Date());
  const isDateToday = isToday(dateObj);
  const nowMinutes = isDateToday
    ? new Date().getHours() * 60 + new Date().getMinutes()
    : 0;

  return rawSlots
    .filter((slot) => {
      // Filter out past slots if today
      if (isDateToday && timeToMinutes(slot.start) <= nowMinutes) {
        return false;
      }
      return true;
    })
    .map((slot) => {
      // Check if slot overlaps with any booking
      const isBooked = bookedSlots.some((booking) => {
        const bookStart = timeToMinutes(booking.start_time);
        const bookEnd = timeToMinutes(booking.end_time);
        const slotStart = timeToMinutes(slot.start);
        const slotEnd = timeToMinutes(slot.end);
        return slotStart < bookEnd && slotEnd > bookStart;
      });

      return {
        start: slot.start,
        end: slot.end,
        available: !isBooked,
      };
    });
}

export async function getAvailableDatesInMonth(
  supabase: Supabase,
  artistId: string,
  year: number,
  month: number
): Promise<string[]> {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  // Get all rules for this artist
  const { data: rules } = await supabase
    .from("availability_rules")
    .select("day_of_week, is_active")
    .eq("artist_id", artistId)
    .eq("is_active", true);

  const activeDays = new Set((rules ?? []).map((r) => r.day_of_week));

  // Get all overrides for this month
  const { data: overrides } = await supabase
    .from("availability_overrides")
    .select("date, is_blocked")
    .eq("artist_id", artistId)
    .gte("date", `${monthStr}-01`)
    .lte("date", `${monthStr}-${String(daysInMonth).padStart(2, "0")}`);

  const overrideMap = new Map(
    (overrides ?? []).map((o) => [o.date, o.is_blocked])
  );

  const today = format(new Date(), "yyyy-MM-dd");
  const availableDates: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${monthStr}-${String(day).padStart(2, "0")}`;

    // Skip past dates
    if (isBefore(parse(dateStr, "yyyy-MM-dd", new Date()), parse(today, "yyyy-MM-dd", new Date())) && dateStr !== today) {
      continue;
    }

    const hasOverride = overrideMap.has(dateStr);
    const isBlocked = overrideMap.get(dateStr);

    if (hasOverride && isBlocked) {
      continue; // Blocked date
    }

    if (hasOverride && !isBlocked) {
      availableDates.push(dateStr); // Custom hours override
      continue;
    }

    // Check regular rules
    const date = parse(dateStr, "yyyy-MM-dd", new Date());
    const dayOfWeek = getDay(date);

    if (activeDays.has(dayOfWeek)) {
      availableDates.push(dateStr);
    }
  }

  return availableDates;
}
