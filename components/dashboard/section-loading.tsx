import { Skeleton } from "@/components/ui/skeleton";

// Shared by (user)/dashboard/loading.tsx and (admin)/admin/loading.tsx --
// each cascades to every route in its section that doesn't define its own
// loading.tsx, so this stays generic rather than mirroring one specific page.
export function SectionLoading() {
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
