"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">
        There was a problem loading this page.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/overview">Go to Overview</Link>
        </Button>
      </div>
    </div>
  );
}
