import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { Car as CarIcon, Users, Fuel, Gauge, Tag } from "lucide-react";
import { auth } from "@/lib/auth";
import { getServerCaller } from "@/trpc/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { carCategoryLabel } from "@/lib/car-categories";
import { AvailabilityCalendar } from "@/components/bookings/availability-calendar";
import { StarRatingDisplay } from "@/components/reviews/star-rating";
import { ReviewsSection } from "@/components/reviews/reviews-section";

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

const STATUS_BADGE_VARIANT = {
  available: "success",
  rented: "warning",
  maintenance: "secondary",
} as const;

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caller = await getServerCaller();
  const car = await caller.cars.getById({ id }).catch((error) => {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
    throw error;
  });
  const session = await auth.api.getSession({ headers: await headers() });

  const canBook = car.status !== "maintenance" && car.status !== "unavailable";
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
              sizes="(min-width: 1024px) 1024px, 100vw"
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
                {carCategoryLabel(car.category)}
              </Badge>
              <Badge variant={STATUS_BADGE_VARIANT[car.displayStatus]}>{car.displayStatus}</Badge>
            </div>

            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {car.make} {car.model}{" "}
              <span className="text-muted-foreground font-normal">{car.year}</span>
            </h1>

            {car.reviewCount > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <StarRatingDisplay rating={car.avgRating ?? 0} />
                <span className="text-sm text-muted-foreground">
                  {car.avgRating?.toFixed(1)} ({car.reviewCount} review
                  {car.reviewCount > 1 ? "s" : ""})
                </span>
              </div>
            )}

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

            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-base">Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <AvailabilityCalendar carId={car.id} />
              </CardContent>
            </Card>
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
                {car.displayStatus === "maintenance"
                  ? "Currently unavailable for booking."
                  : car.displayStatus === "rented"
                    ? "Currently out on rent — check the calendar for open dates."
                    : "Available now — reserve without a deposit."}
              </p>
              {bookHref && canBook ? (
                <Button asChild className="mt-6 w-full">
                  <Link href={bookHref}>Book Now</Link>
                </Button>
              ) : canBook ? (
                <Button asChild variant="outline" className="mt-6 w-full">
                  <Link href="/admin/bookings">Manage bookings</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <Reveal delay={0.15}>
        <div className="mt-14 max-w-2xl">
          <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight">Reviews</h2>
          <ReviewsSection carId={car.id} />
        </div>
      </Reveal>
    </main>
  );
}
