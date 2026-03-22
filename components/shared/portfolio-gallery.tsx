"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ImageIcon } from "lucide-react";
import type { PortfolioPiece } from "@/lib/types/database";

export function PortfolioGallery({
  pieces,
  artistName,
}: {
  pieces: PortfolioPiece[];
  artistName: string;
}) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<PortfolioPiece | null>(
    null
  );

  const allStyles = Array.from(
    new Set(pieces.flatMap((p) => p.styles ?? []))
  ).sort();

  const filteredPieces = activeFilter
    ? pieces.filter((p) => (p.styles ?? []).includes(activeFilter))
    : pieces;

  if (pieces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-200 p-12 text-center">
        <ImageIcon className="mb-4 h-12 w-12 text-zinc-300" />
        <h3 className="text-lg font-medium text-zinc-900">
          No portfolio pieces yet
        </h3>
        <p className="text-sm text-zinc-500">
          {artistName} hasn&apos;t uploaded any work yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-zinc-900">Portfolio</h2>

      {allStyles.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeFilter === null ? "default" : "outline"}
            onClick={() => setActiveFilter(null)}
          >
            All
          </Button>
          {allStyles.map((style) => (
            <Button
              key={style}
              size="sm"
              variant={activeFilter === style ? "default" : "outline"}
              onClick={() =>
                setActiveFilter(activeFilter === style ? null : style)
              }
            >
              {style}
            </Button>
          ))}
        </div>
      )}

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredPieces.map((piece) => (
          <button
            key={piece.id}
            onClick={() => setSelectedPiece(piece)}
            className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <Image
              src={piece.image_url}
              alt={piece.title ?? "Portfolio piece"}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
            {piece.title && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="truncate text-sm font-medium text-white">
                  {piece.title}
                </p>
              </div>
            )}
            {piece.is_featured && (
              <div className="absolute left-2 top-2">
                <Badge className="bg-yellow-500 text-xs text-white">
                  Featured
                </Badge>
              </div>
            )}
          </button>
        ))}
      </div>

      <Dialog
        open={!!selectedPiece}
        onOpenChange={(open) => !open && setSelectedPiece(null)}
      >
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {selectedPiece && (
            <>
              <div className="relative aspect-square max-h-[70vh] w-full sm:aspect-auto sm:h-[70vh]">
                <Image
                  src={selectedPiece.image_url}
                  alt={selectedPiece.title ?? "Portfolio piece"}
                  fill
                  className="object-contain"
                  sizes="90vw"
                  priority
                />
              </div>
              <div className="p-4">
                <DialogHeader>
                  <DialogTitle>
                    {selectedPiece.title || "Untitled"}
                  </DialogTitle>
                  {selectedPiece.description && (
                    <DialogDescription>
                      {selectedPiece.description}
                    </DialogDescription>
                  )}
                </DialogHeader>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(selectedPiece.styles ?? []).map((s) => (
                    <Badge key={s} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                  {selectedPiece.body_part && (
                    <Badge variant="outline">
                      {selectedPiece.body_part}
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
