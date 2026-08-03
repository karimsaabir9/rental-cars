import { Skeleton } from "@/components/ui/skeleton";

// Cascades to every /dashboard/* route that doesn't define its own
// loading.tsx, so this stays generic rather than mirroring one specific page.
export default function DashboardLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-48" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}
