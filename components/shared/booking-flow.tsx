"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import Link from "next/link";
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
  isBefore,
  startOfDay,
} from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { BODY_PARTS } from "@/lib/constants";
import { getBookingWhatsAppLink } from "@/lib/whatsapp";

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface ArtistInfo {
  id: string;
  name: string;
  slug: string;
  whatsapp_number: string | null;
}

interface StudioInfo {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  whatsapp_number: string | null;
}

const SIZE_OPTIONS = [
  { value: "small", label: "Small — under 2 inches" },
  { value: "medium", label: "Medium — 2 to 6 inches" },
  { value: "large", label: "Large — 6 to 12 inches" },
  { value: "full-sleeve", label: "Full Sleeve" },
];

const detailsSchema = z.object({
  client_name: z.string().min(2, "Name must be at least 2 characters"),
  client_email: z.string().email("Please enter a valid email"),
  client_phone: z.string().min(6, "Phone must be at least 6 characters"),
  description: z.string().min(1, "Please describe the tattoo you want"),
  placement: z.string().optional(),
  estimated_size: z.string().optional(),
});

type DetailsForm = z.infer<typeof detailsSchema>;

export function BookingFlow({
  artist,
  studio,
}: {
  artist: ArtistInfo;
  studio: StudioInfo;
}) {
  const [step, setStep] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    id: string;
    whatsAppLink: string | null;
  } | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<DetailsForm>({
    resolver: standardSchemaResolver(detailsSchema),
  });

  const monthStr = format(currentMonth, "yyyy-MM");

  const fetchAvailableDates = useCallback(async () => {
    setLoadingDates(true);
    const res = await fetch(
      `/api/availability/${artist.id}?month=${monthStr}`
    );
    if (res.ok) {
      const json = await res.json();
      setAvailableDates(json.dates);
    }
    setLoadingDates(false);
  }, [artist.id, monthStr]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchAvailableDates();
  }, [fetchAvailableDates]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleDateClick(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setLoadingSlots(true);

    const res = await fetch(
      `/api/availability/${artist.id}?date=${dateStr}`
    );
    if (res.ok) {
      const json = await res.json();
      setSlots(json.slots);
    }
    setLoadingSlots(false);
  }

  function handleDetailsNext() {
    setStep(3);
  }

  async function handleConfirm() {
    const details = getValues();
    if (!selectedDate || !selectedSlot) return;

    setSubmitting(true);

    const validRefs = referenceUrls.filter((u) => {
      try {
        new URL(u);
        return true;
      } catch {
        return false;
      }
    });

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artist_id: artist.id,
        studio_id: studio.id,
        date: selectedDate,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        client_name: details.client_name,
        client_email: details.client_email,
        client_phone: details.client_phone,
        description: details.description,
        placement: details.placement || null,
        estimated_size: details.estimated_size || null,
        reference_urls: validRefs.length > 0 ? validRefs : undefined,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Failed to create booking");
      if (res.status === 409) {
        setStep(1);
        setSelectedSlot(null);
      }
      return;
    }

    const json = await res.json();
    setConfirmedBooking({
      id: json.data.id,
      whatsAppLink: json.whatsAppLink,
    });
  }

  // Confirmation view
  if (confirmedBooking) {
    const studioAddress = [studio.address, studio.city]
      .filter(Boolean)
      .join(", ");

    return (
      <Card className="border-zinc-800 bg-zinc-900/50 text-center">
        <CardContent className="py-12">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-bold text-zinc-100">
            Booking Confirmed!
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Reference: {confirmedBooking.id.slice(0, 8).toUpperCase()}
          </p>
          <div className="mx-auto mt-6 max-w-sm space-y-2 text-sm text-zinc-300">
            <p>
              <strong>Date:</strong> {selectedDate}
            </p>
            <p>
              <strong>Time:</strong> {selectedSlot?.start} — {selectedSlot?.end}
            </p>
            <p>
              <strong>Artist:</strong> {artist.name}
            </p>
            {studioAddress && (
              <p>
                <strong>Address:</strong> {studioAddress}
              </p>
            )}
          </div>
          <p className="mt-6 text-sm text-zinc-300">
            The artist will confirm your booking shortly — you&apos;ll receive
            an email confirmation.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {confirmedBooking.whatsAppLink && (
              <Button asChild>
                <a
                  href={confirmedBooking.whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message {artist.name} on WhatsApp
                </a>
              </Button>
            )}
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Link href={`/${studio.slug}/${artist.slug}`}>
                Back to {artist.name}&apos;s portfolio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Build calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });
  const today = startOfDay(new Date());
  const availableSet = new Set(availableDates);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Book with {artist.name}</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                s === step
                  ? "bg-primary text-primary-foreground"
                  : s < step
                    ? "bg-green-600 text-white"
                    : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {s < step ? "✓" : s}
            </div>
            <span
              className={
                s === step ? "text-zinc-100" : "text-zinc-300"
              }
            >
              {s === 1 ? "Date & Time" : s === 2 ? "Your Details" : "Review"}
            </span>
            {s < 3 && <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />}
          </div>
        ))}
      </div>

      {/* Step 1: Date & Time */}
      {step === 1 && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-zinc-100">Choose Date & Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Calendar */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-zinc-200">
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

              <div className="grid grid-cols-7 gap-1 text-center">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (d) => (
                    <div
                      key={d}
                      className="p-1 text-xs font-medium text-zinc-300"
                    >
                      {d}
                    </div>
                  )
                )}
                {calDays.map((date) => {
                  const dateStr = format(date, "yyyy-MM-dd");
                  const isCurrentMonth = isSameMonth(date, currentMonth);
                  const isPast = isBefore(date, today);
                  const isAvailable =
                    isCurrentMonth && !isPast && availableSet.has(dateStr);
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      key={date.toISOString()}
                      disabled={!isAvailable}
                      onClick={() => handleDateClick(dateStr)}
                      className={`aspect-square flex items-center justify-center rounded-md text-sm transition-colors ${
                        !isCurrentMonth
                          ? "text-zinc-700"
                          : isPast
                            ? "text-zinc-700"
                            : isSelected
                              ? "bg-primary text-primary-foreground font-medium"
                              : isAvailable
                                ? "text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                                : "text-zinc-600"
                      }`}
                    >
                      {format(date, "d")}
                    </button>
                  );
                })}
              </div>
              {loadingDates && (
                <p className="mt-2 text-center text-xs text-zinc-300">
                  Loading availability...
                </p>
              )}
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div>
                <h3 className="mb-3 text-sm font-medium text-zinc-300">
                  Available times for {selectedDate}
                </h3>
                {loadingSlots ? (
                  <p className="text-sm text-zinc-300">Loading slots...</p>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-zinc-300">
                    No available slots for this date.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.start}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                          selectedSlot?.start === slot.start
                            ? "border-primary bg-primary/20 text-primary font-medium"
                            : slot.available
                              ? "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                              : "border-zinc-800 text-zinc-600 line-through"
                        }`}
                      >
                        {slot.start}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedDate && selectedSlot && (
              <Button onClick={() => setStep(2)} className="w-full">
                Next
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-zinc-100">Your Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(handleDetailsNext)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label className="text-zinc-300">Name</Label>
                <Input
                  {...register("client_name")}
                  className="border-zinc-700 bg-zinc-800/50"
                />
                {errors.client_name && (
                  <p className="text-sm text-destructive">
                    {errors.client_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Email</Label>
                <Input
                  type="email"
                  {...register("client_email")}
                  className="border-zinc-700 bg-zinc-800/50"
                />
                {errors.client_email && (
                  <p className="text-sm text-destructive">
                    {errors.client_email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Phone</Label>
                <Input
                  {...register("client_phone")}
                  className="border-zinc-700 bg-zinc-800/50"
                />
                {errors.client_phone && (
                  <p className="text-sm text-destructive">
                    {errors.client_phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Tattoo description</Label>
                <Textarea
                  {...register("description")}
                  placeholder="Describe the tattoo you want..."
                  className="border-zinc-700 bg-zinc-800/50"
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Placement</Label>
                <Select
                  onValueChange={(v) => setValue("placement", v)}
                  defaultValue={getValues("placement")}
                >
                  <SelectTrigger className="border-zinc-700 bg-zinc-800/50">
                    <SelectValue placeholder="Select body part" />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_PARTS.map((part) => (
                      <SelectItem key={part} value={part}>
                        {part}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Estimated size</Label>
                <Select
                  onValueChange={(v) => setValue("estimated_size", v)}
                  defaultValue={getValues("estimated_size")}
                >
                  <SelectTrigger className="border-zinc-700 bg-zinc-800/50">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">
                  Reference images (optional)
                </Label>
                {referenceUrls.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={url}
                      onChange={(e) => {
                        const updated = [...referenceUrls];
                        updated[i] = e.target.value;
                        setReferenceUrls(updated);
                      }}
                      placeholder="https://..."
                      className="border-zinc-700 bg-zinc-800/50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setReferenceUrls(referenceUrls.filter((_, j) => j !== i))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {referenceUrls.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReferenceUrls([...referenceUrls, ""])}
                    className="border-white/20 text-white"
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Add reference
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-white/20 text-white"
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1">
                  Next
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-zinc-100">Review & Confirm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Appointment */}
            <div className="rounded-lg border border-zinc-800 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">
                  Appointment
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="text-zinc-300"
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  Edit
                </Button>
              </div>
              <div className="mt-2 space-y-1 text-sm text-zinc-200">
                <p>
                  <strong>Date:</strong> {selectedDate}
                </p>
                <p>
                  <strong>Time:</strong> {selectedSlot?.start} —{" "}
                  {selectedSlot?.end}
                </p>
                <p>
                  <strong>Artist:</strong> {artist.name}
                </p>
                <p>
                  <strong>Studio:</strong> {studio.name}
                </p>
                {(studio.address || studio.city) && (
                  <p>
                    <strong>Address:</strong>{" "}
                    {[studio.address, studio.city].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>

            {/* Client details */}
            <div className="rounded-lg border border-zinc-800 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">
                  Your Details
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(2)}
                  className="text-zinc-300"
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  Edit
                </Button>
              </div>
              <div className="mt-2 space-y-1 text-sm text-zinc-200">
                <p>
                  <strong>Name:</strong> {getValues("client_name")}
                </p>
                <p>
                  <strong>Email:</strong> {getValues("client_email")}
                </p>
                <p>
                  <strong>Phone:</strong> {getValues("client_phone")}
                </p>
              </div>
            </div>

            {/* Tattoo details */}
            <div className="rounded-lg border border-zinc-800 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">
                  Tattoo Details
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(2)}
                  className="text-zinc-300"
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  Edit
                </Button>
              </div>
              <div className="mt-2 space-y-1 text-sm text-zinc-200">
                <p>
                  <strong>Description:</strong> {getValues("description")}
                </p>
                {getValues("placement") && (
                  <p>
                    <strong>Placement:</strong> {getValues("placement")}
                  </p>
                )}
                {getValues("estimated_size") && (
                  <p>
                    <strong>Size:</strong>{" "}
                    {
                      SIZE_OPTIONS.find(
                        (o) => o.value === getValues("estimated_size")
                      )?.label
                    }
                  </p>
                )}
                {referenceUrls.filter(Boolean).length > 0 && (
                  <p>
                    <strong>References:</strong>{" "}
                    {referenceUrls.filter(Boolean).length} link(s)
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full"
              size="lg"
            >
              {submitting ? "Confirming..." : "Confirm Booking"}
            </Button>

            {(() => {
              const phone =
                artist.whatsapp_number ?? studio.whatsapp_number ?? null;
              if (!phone) return null;
              return (
                <div className="text-center">
                  <a
                    href={getBookingWhatsAppLink({
                      phone,
                      artistName: artist.name,
                      studioName: studio.name,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Have questions? Message {artist.name} on WhatsApp
                  </a>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
