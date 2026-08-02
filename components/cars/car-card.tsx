import Image from "next/image";
import Link from "next/link";
import { Car as CarIcon, Users, Fuel, Gauge } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { carCategoryLabel } from "@/lib/car-categories";

type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  pricePerDay: string;
  seats: number;
  transmission: string;
  fuelType: string;
  imageUrl: string | null;
};

export function CarCard({ car }: { car: Car }) {
  return (
    <Link href={`/cars/${car.id}`} className="group block">
      <Card className="overflow-hidden py-0 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {car.imageUrl ? (
            <Image
              src={car.imageUrl}
              alt={`${car.make} ${car.model}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <CarIcon className="size-10 opacity-30" />
            </div>
          )}
          <span className="absolute top-3 left-3 rounded-md bg-black/60 px-2 py-1 font-mono text-xs tracking-wide text-white uppercase backdrop-blur-sm">
            {carCategoryLabel(car.category)}
          </span>
        </div>
        <CardContent className="pt-4">
          <h3 className="font-display font-semibold">
            {car.make} {car.model}{" "}
            <span className="font-body text-muted-foreground font-normal">{car.year}</span>
          </h3>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="size-3.5" /> {car.seats}
            </span>
            <span className="flex items-center gap-1">
              <Gauge className="size-3.5" /> {car.transmission}
            </span>
            <span className="flex items-center gap-1">
              <Fuel className="size-3.5" /> {car.fuelType}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between pb-4">
          <span className="readout">
            ${car.pricePerDay}
            <span className="text-muted-foreground">/day</span>
          </span>
          <span className="text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
            View &rarr;
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
