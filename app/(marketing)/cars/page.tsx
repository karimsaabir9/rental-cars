import { SearchX } from "lucide-react";
import { getServerCaller } from "@/trpc/server";
import { CarCard } from "@/components/cars/car-card";
import { CarFilters } from "@/components/cars/car-filters";
import { RevealGroup } from "@/components/motion/reveal";
import { CAR_CATEGORY_VALUES, type CarCategory } from "@/lib/car-categories";

const SORT_VALUES = ["price_asc", "price_desc", "rating_desc", "popular_desc", "newest"] as const;
type CarSort = (typeof SORT_VALUES)[number];

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    make?: string;
    transmission?: string;
    minSeats?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const caller = await getServerCaller();

  const category = CAR_CATEGORY_VALUES.includes(params.category as CarCategory)
    ? (params.category as CarCategory)
    : undefined;
  const sort = SORT_VALUES.includes(params.sort as CarSort) ? (params.sort as CarSort) : undefined;

  const [cars, makes] = await Promise.all([
    caller.cars.list({
      category,
      make: params.make,
      transmission: params.transmission as "automatic" | "manual" | undefined,
      minSeats: params.minSeats ? Number(params.minSeats) : undefined,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      sort,
    }),
    caller.cars.listMakes(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase">The Fleet</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Browse Cars</h1>

      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <CarFilters makes={makes} />
      </div>

      {cars.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 py-16 text-center">
          <SearchX className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">No cars match your filters right now.</p>
        </div>
      ) : (
        <RevealGroup className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </RevealGroup>
      )}
    </main>
  );
}
