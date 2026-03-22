import { Skeleton } from "@/components/ui/skeleton";

export default function BookingsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-40" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
