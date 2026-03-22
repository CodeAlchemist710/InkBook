"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Star,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TATTOO_STYLES, BODY_PARTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { PortfolioPiece } from "@/lib/types/database";

export function PortfolioManager({
  artistId,
  studioId,
}: {
  artistId: string;
  studioId: string;
}) {
  const [pieces, setPieces] = useState<PortfolioPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchPieces = useCallback(async () => {
    const res = await fetch(`/api/artists/${artistId}/portfolio`);
    if (res.ok) {
      const json = await res.json();
      setPieces(json.data);
    }
    setLoading(false);
  }, [artistId]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchPieces();
  }, [fetchPieces]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleDelete(pieceId: string) {
    const res = await fetch(
      `/api/artists/${artistId}/portfolio/${pieceId}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      toast.error("Failed to delete piece");
      return;
    }

    toast.success("Piece deleted");
    setDeleteTarget(null);
    fetchPieces();
  }

  async function handleToggleFeatured(piece: PortfolioPiece) {
    const res = await fetch(
      `/api/artists/${artistId}/portfolio/${piece.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_featured: !piece.is_featured }),
      }
    );

    if (!res.ok) {
      toast.error("Failed to update piece");
      return;
    }

    toast.success(piece.is_featured ? "Unfeatured" : "Set as featured");
    fetchPieces();
  }

  async function handleMove(piece: PortfolioPiece, direction: "up" | "down") {
    const idx = pieces.findIndex((p) => p.id === piece.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;

    if (swapIdx < 0 || swapIdx >= pieces.length) return;

    const other = pieces[swapIdx];

    // Swap sort_order values
    await Promise.all([
      fetch(`/api/artists/${artistId}/portfolio/${piece.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: other.sort_order }),
      }),
      fetch(`/api/artists/${artistId}/portfolio/${other.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: piece.sort_order }),
      }),
    ]);

    fetchPieces();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Portfolio</h2>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Portfolio</h2>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Piece
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Portfolio Piece</DialogTitle>
            </DialogHeader>
            <UploadForm
              artistId={artistId}
              studioId={studioId}
              onSuccess={() => {
                setUploadOpen(false);
                fetchPieces();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {pieces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No portfolio pieces yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Upload tattoo photos to build this artist&apos;s portfolio.
          </p>
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Piece
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {pieces.map((piece, idx) => (
            <div
              key={piece.id}
              className="group relative overflow-hidden rounded-lg border bg-muted"
            >
              <div className="relative aspect-square">
                <Image
                  src={piece.image_url}
                  alt={piece.title ?? "Portfolio piece"}
                  fill
                  className="object-cover"
                />
                {piece.title && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-sm font-medium text-white">
                      {piece.title}
                    </p>
                  </div>
                )}
                {piece.is_featured && (
                  <div className="absolute left-2 top-2">
                    <Badge className="bg-yellow-500 text-white">Featured</Badge>
                  </div>
                )}
              </div>
              <div className="space-y-2 p-2">
                {(piece.styles ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(piece.styles ?? []).slice(0, 2).map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleToggleFeatured(piece)}
                    title={piece.is_featured ? "Unfeature" : "Set as featured"}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${piece.is_featured ? "fill-yellow-500 text-yellow-500" : ""}`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={idx === 0}
                    onClick={() => handleMove(piece, "up")}
                    title="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={idx === pieces.length - 1}
                    onClick={() => handleMove(piece, "down")}
                    title="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => setDeleteTarget(piece.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this piece?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this portfolio piece. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UploadForm({
  artistId,
  studioId,
  onSuccess,
}: {
  artistId: string;
  studioId: string;
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [bodyPart, setBodyPart] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    if (!file) {
      toast.error("Please select an image");
      return;
    }

    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${studioId}/${artistId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("portfolio")
      .upload(path, file);

    if (uploadError) {
      toast.error(uploadError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("portfolio").getPublicUrl(path);

    const res = await fetch(`/api/artists/${artistId}/portfolio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: publicUrl,
        title: title || null,
        styles: selectedStyles,
        body_part: bodyPart || null,
        is_featured: isFeatured,
      }),
    });

    setUploading(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Failed to add piece");
      return;
    }

    toast.success("Piece added");
    onSuccess();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Image</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <div className="space-y-2">
        <Label>Title (optional)</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Phoenix back piece"
        />
      </div>
      <div className="space-y-2">
        <Label>Styles</Label>
        <div className="flex flex-wrap gap-2">
          {TATTOO_STYLES.map((style) => (
            <Badge
              key={style}
              variant={selectedStyles.includes(style) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() =>
                setSelectedStyles((prev) =>
                  prev.includes(style)
                    ? prev.filter((s) => s !== style)
                    : [...prev, style]
                )
              }
            >
              {style}
            </Badge>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Body part</Label>
        <Select value={bodyPart} onValueChange={setBodyPart}>
          <SelectTrigger>
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
      <div className="flex items-center gap-2">
        <Checkbox
          id="featured"
          checked={isFeatured}
          onCheckedChange={(checked) => setIsFeatured(checked === true)}
        />
        <Label htmlFor="featured">Featured piece</Label>
      </div>
      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full"
      >
        {uploading ? "Uploading..." : "Upload"}
      </Button>
    </div>
  );
}
