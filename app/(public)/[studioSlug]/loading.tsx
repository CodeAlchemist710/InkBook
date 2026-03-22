import { Skeleton } from "@/components/ui/skeleton";

export default function StudioLoading() {
  return (
    <div>
      <Skeleton className="h-64 w-full sm:h-80" />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
