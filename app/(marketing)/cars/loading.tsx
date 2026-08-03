import { Skeleton } from "@/components/ui/skeleton";

export default function CarsLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase">The Fleet</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Browse Cars</h1>

      <Skeleton className="mt-8 h-[92px] rounded-xl" />

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border">
            <Skeleton className="aspect-video w-full rounded-none" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
