import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { Car as CarIcon, Users, Fuel, Gauge, Tag } from "lucide-react";
import { auth } from "@/lib/auth";
import { getServerCaller } from "@/trpc/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";

const SPECS = (car: {
  seats: number;
  transmission: string;
  fuelType: string;
  licensePlate: string;
}) => [
  { icon: Users, label: "Seats", value: String(car.seats) },
  { icon: Gauge, label: "Transmission", value: car.transmission },
  { icon: Fuel, label: "Fuel", value: car.fuelType },
  { icon: Tag, label: "Plate", value: car.licensePlate },
];

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caller = await getServerCaller();
  const car = await caller.cars.getById({ id });
  const session = await auth.api.getSession({ headers: await headers() });

  const bookHref =
    !session || session.user.role === "user"
      ? session
        ? `/dashboard/bookings/new?carId=${car.id}`
        : `/login?redirectTo=${encodeURIComponent(`/dashboard/bookings/new?carId=${car.id}`)}`
      : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <Reveal>
        <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
          {car.imageUrl ? (
            <Image
              src={car.imageUrl}
              alt={`${car.make} ${car.model}`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <CarIcon className="size-14 opacity-30" />
            </div>
          )}
        </div>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <Reveal delay={0.05}>
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="font-mono uppercase">
                {car.category}
              </Badge>
              <Badge variant={car.status === "available" ? "success" : "outline"}>
                {car.status}
              </Badge>
            </div>

            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {car.make} {car.model}{" "}
              <span className="text-muted-foreground font-normal">{car.year}</span>
            </h1>

            {car.description && (
              <p className="mt-4 max-w-xl text-muted-foreground">{car.description}</p>
            )}

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SPECS(car).map((spec) => (
                <div key={spec.label} className="rounded-lg border border-border p-3">
                  <spec.icon className="size-4 text-accent" />
                  <p className="mt-2 font-mono text-sm tabular-nums">{spec.value}</p>
                  <p className="text-xs text-muted-foreground">{spec.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="lg:sticky lg:top-24">
            <CardContent>
              <p className="readout w-fit text-lg">
                ${car.pricePerDay}
                <span className="text-muted-foreground text-sm">/day</span>
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {car.status === "available"
                  ? "Available now — reserve without a deposit."
                  : "Currently unavailable for booking."}
              </p>
              {bookHref && car.status === "available" ? (
                <Button asChild className="mt-6 w-full">
                  <Link href={bookHref}>Book Now</Link>
                </Button>
              ) : car.status === "available" ? (
                <Button asChild variant="outline" className="mt-6 w-full">
                  <Link href="/admin/bookings">Manage bookings</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </main>
  );
}
