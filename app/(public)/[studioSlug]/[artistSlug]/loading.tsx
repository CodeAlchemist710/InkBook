import { Skeleton } from "@/components/ui/skeleton";

export default function ArtistLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="mb-6 h-4 w-48" />
      <div className="mb-8 flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex gap-3 mb-8">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
