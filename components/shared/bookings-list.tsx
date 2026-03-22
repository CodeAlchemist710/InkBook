"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MoreVertical, Check, X, Eye, CheckCircle, UserX } from "lucide-react";

interface BookingRow {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  client_name: string;
  status: string | null;
  artists: { name: string } | null;
}

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending", variant: "secondary" },
  confirmed: { label: "Confirmed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  completed: { label: "Completed", variant: "outline" },
  no_show: { label: "No Show", variant: "secondary" },
};

export function BookingsList({ bookings }: { bookings: BookingRow[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const filtered =
    statusFilter === "all"
      ? bookings
      : bookings.filter((b) => b.status === statusFilter);

  async function updateStatus(id: string, status: string, reason?: string) {
    const body: Record<string, string> = { status };
    if (reason) body.cancel_reason = reason;

    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      toast.error("Failed to update booking");
      return;
    }

    toast.success(`Booking ${status}`);
    router.refresh();
  }

  function handleCancelConfirm() {
    if (cancelTarget) {
      updateStatus(cancelTarget, "cancelled", cancelReason || undefined);
      setCancelTarget(null);
      setCancelReason("");
    }
  }

  return (
    <>
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No bookings found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((booking) => {
                const statusInfo = STATUS_BADGE[booking.status ?? "pending"];
                return (
                  <TableRow key={booking.id} className="even:bg-muted/50">
                    <TableCell>{booking.date}</TableCell>
                    <TableCell>
                      {booking.start_time?.slice(0, 5)} —{" "}
                      {booking.end_time?.slice(0, 5)}
                    </TableCell>
                    <TableCell>{booking.client_name}</TableCell>
                    <TableCell>{booking.artists?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusInfo?.variant ?? "secondary"}>
                        {statusInfo?.label ?? booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/bookings/${booking.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {booking.status === "pending" && (
                            <DropdownMenuItem
                              onClick={() => updateStatus(booking.id, "confirmed")}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Confirm
                            </DropdownMenuItem>
                          )}
                          {(booking.status === "confirmed") && (
                            <>
                              <DropdownMenuItem
                                onClick={() => updateStatus(booking.id, "completed")}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Complete
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateStatus(booking.id, "no_show")}
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                No Show
                              </DropdownMenuItem>
                            </>
                          )}
                          {booking.status !== "cancelled" &&
                            booking.status !== "completed" && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setCancelTarget(booking.id)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Cancel with reason dialog */}
      <Dialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null);
            setCancelReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Reason (optional)</Label>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Artist unavailable, client requested"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelTarget(null);
                setCancelReason("");
              }}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
            >
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
