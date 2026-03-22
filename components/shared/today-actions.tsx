"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export function TodayActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string;
}) {
  const router = useRouter();

  async function updateStatus(newStatus: string) {
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      toast.error("Failed to update");
      return;
    }

    toast.success(`Booking ${newStatus}`);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      {status === "pending" && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => updateStatus("confirmed")}
          title="Confirm"
        >
          <Check className="h-4 w-4 text-green-600" />
        </Button>
      )}
      {status !== "cancelled" && status !== "completed" && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => updateStatus("cancelled")}
          title="Cancel"
        >
          <X className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
}
