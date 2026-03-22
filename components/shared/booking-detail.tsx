"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Check,
  X,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { getWhatsAppLink } from "@/lib/whatsapp";

interface BookingData {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  description: string | null;
  placement: string | null;
  estimated_size: string | null;
  reference_urls: string[] | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  artists: { name: string; whatsapp_number: string | null } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  no_show: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export function BookingDetail({ booking }: { booking: BookingData }) {
  const router = useRouter();
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);

  async function updateStatus(status: string) {
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      toast.error("Failed to update status");
      return;
    }

    toast.success(`Booking ${status}`);
    router.refresh();
  }

  async function saveNotes() {
    setSavingNotes(true);
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notes || null }),
    });

    setSavingNotes(false);
    if (!res.ok) {
      toast.error("Failed to save notes");
      return;
    }
    toast.success("Notes saved");
  }

  const status = booking.status ?? "pending";
  const statusClass = STATUS_COLORS[status] ?? STATUS_COLORS.pending;

  return (
    <>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/bookings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Booking Details</h1>
        <Badge className={statusClass}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>

      {/* Status actions */}
      <div className="flex flex-wrap gap-2">
        {status === "pending" && (
          <Button onClick={() => updateStatus("confirmed")} size="sm">
            <Check className="mr-2 h-4 w-4" />
            Confirm
          </Button>
        )}
        {status !== "cancelled" && status !== "completed" && (
          <Button
            onClick={() => updateStatus("cancelled")}
            variant="outline"
            size="sm"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}
        {status === "confirmed" && (
          <Button
            onClick={() => updateStatus("completed")}
            variant="outline"
            size="sm"
          >
            Mark Completed
          </Button>
        )}
        {status === "confirmed" && (
          <Button
            onClick={() => updateStatus("no_show")}
            variant="outline"
            size="sm"
          >
            No Show
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Appointment */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Date:</strong> {booking.date}
            </p>
            <p>
              <strong>Time:</strong> {booking.start_time?.slice(0, 5)} —{" "}
              {booking.end_time?.slice(0, 5)}
            </p>
            <p>
              <strong>Artist:</strong> {booking.artists?.name ?? "—"}
            </p>
          </CardContent>
        </Card>

        {/* Client */}
        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Name:</strong> {booking.client_name}
            </p>
            <p>
              <strong>Email:</strong> {booking.client_email ?? "—"}
            </p>
            <p>
              <strong>Phone:</strong> {booking.client_phone ?? "—"}
            </p>
            {booking.client_phone && (
              <Button asChild variant="outline" size="sm">
                <a
                  href={getWhatsAppLink(
                    booking.client_phone,
                    `Hi ${booking.client_name}! Regarding your booking on ${booking.date}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp Client
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Tattoo Details */}
        <Card>
          <CardHeader>
            <CardTitle>Tattoo Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Description:</strong>{" "}
              {booking.description ?? "No description"}
            </p>
            {booking.placement && (
              <p>
                <strong>Placement:</strong> {booking.placement}
              </p>
            )}
            {booking.estimated_size && (
              <p>
                <strong>Size:</strong> {booking.estimated_size}
              </p>
            )}
            {(booking.reference_urls ?? []).length > 0 && (
              <div>
                <strong>References:</strong>
                <ul className="mt-1 space-y-1">
                  {(booking.reference_urls ?? []).map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        Reference {i + 1}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Internal Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="notes" className="sr-only">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add private notes about this booking..."
              rows={4}
            />
            <Button
              size="sm"
              onClick={saveNotes}
              disabled={savingNotes}
            >
              {savingNotes ? "Saving..." : "Save Notes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
