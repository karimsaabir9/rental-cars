"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

// Nested under admin/layout.tsx, so DashboardShell (sidebar, nav,
// notification bell) stays mounted -- only the content area is replaced.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-20 text-center">
      <TriangleAlert className="size-8 text-muted-foreground" />
      <p className="font-medium">Something went wrong loading this page.</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Try again, or use the sidebar to navigate elsewhere.
      </p>
      <Button onClick={reset} className="mt-2">
        Try again
      </Button>
    </div>
  );
}
