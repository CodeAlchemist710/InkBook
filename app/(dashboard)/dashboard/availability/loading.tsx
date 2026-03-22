import { Skeleton } from "@/components/ui/skeleton";

export default function AvailabilityLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
