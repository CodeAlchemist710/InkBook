"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MoreVertical,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  User,
  ImageIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Artist } from "@/lib/types/database";

export function ArtistCard({
  artist,
  portfolioCount,
}: {
  artist: Artist;
  portfolioCount: number;
}) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  async function handleToggleActive() {
    const res = await fetch(`/api/artists/${artist.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !artist.is_active }),
    });

    if (!res.ok) {
      toast.error("Failed to update artist");
      return;
    }

    toast.success(artist.is_active ? "Artist deactivated" : "Artist activated");
    router.refresh();
  }

  async function handleDelete() {
    const res = await fetch(`/api/artists/${artist.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      toast.error("Failed to delete artist");
      return;
    }

    toast.success("Artist deleted");
    router.refresh();
  }

  return (
    <>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
              {artist.avatar_url ? (
                <Image
                  src={artist.avatar_url}
                  alt={artist.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <Link
                  href={`/dashboard/artists/${artist.id}`}
                  className="truncate font-medium hover:underline"
                >
                  {artist.name}
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/artists/${artist.id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleToggleActive}>
                      {artist.is_active ? (
                        <>
                          <ToggleLeft className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleRight className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" />
                {portfolioCount} piece{portfolioCount !== 1 ? "s" : ""}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant={artist.is_active ? "default" : "secondary"}>
                  {artist.is_active ? "Active" : "Inactive"}
                </Badge>
                {(artist.specialties ?? []).slice(0, 3).map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
                {(artist.specialties ?? []).length > 3 && (
                  <Badge variant="outline">
                    +{(artist.specialties ?? []).length - 3}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {artist.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this artist and all their portfolio
              pieces. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
