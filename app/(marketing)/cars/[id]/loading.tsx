import { Skeleton } from "@/components/ui/skeleton";

export default function CarDetailLoading() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <Skeleton className="aspect-video w-full rounded-xl" />

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-4 h-9 w-72" />
          <Skeleton className="mt-4 h-4 w-full max-w-xl" />
          <Skeleton className="mt-2 h-4 w-2/3 max-w-xl" />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
          <Skeleton className="mt-8 h-40 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </main>
  );
}
