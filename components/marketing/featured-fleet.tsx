import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getServerCaller } from "@/trpc/server";
import { CarCard } from "@/components/cars/car-card";
import { RevealGroup } from "@/components/motion/reveal";

export async function FeaturedFleet() {
  const caller = await getServerCaller();
  const cars = await caller.cars.list();
  const featured = cars.slice(0, 3);

  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase">
            The Fleet
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Handpicked, not homogenous.
          </h2>
        </div>
        <Link
          href="/cars"
          className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-accent"
        >
          View all cars
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {featured.length === 0 ? (
        <p className="mt-10 text-muted-foreground">
          The fleet is being prepared — check back shortly.
        </p>
      ) : (
        <RevealGroup className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </RevealGroup>
      )}
    </section>
  );
}
