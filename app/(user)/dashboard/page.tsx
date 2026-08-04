import Link from "next/link";
import { Car, ShieldCheck, Headset } from "lucide-react";
import { getServerCaller } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_VARIANT } from "@/lib/booking-status";

const FIRST_RUN_HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: "Fully insured",
    body: "Every rental includes comprehensive coverage, at no extra cost.",
  },
  {
    icon: Headset,
    title: "24/7 support",
    body: "Roadside assistance and a real person on the line, any hour.",
  },
];

function FirstRunWelcome() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome to RentalCars</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You haven&apos;t booked a car yet — here&apos;s how to get started.
      </p>

      <Card className="mt-6">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Car className="size-6" />
          </div>
          <div>
            <p className="font-medium">Find a car and reserve it in under a minute</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse the fleet, pick your dates, and we&apos;ll take it from there.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/cars">Browse Cars</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIRST_RUN_HIGHLIGHTS.map((item) => (
          <Card key={item.title}>
            <CardContent className="flex items-start gap-3 py-5">
              <item.icon className="mt-0.5 size-5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.body}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function UserDashboardPage() {
  const caller = await getServerCaller();
  const bookings = await caller.bookings.listMine();

  if (bookings.length === 0) {
    return <FirstRunWelcome />;
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter(
    (b) => (b.status === "confirmed" || b.status === "approved") && b.endDate >= today,
  );
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const recent = bookings.slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Here&apos;s where things stand.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active / Upcoming Rentals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-semibold tabular-nums">{upcoming.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-semibold tabular-nums">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-semibold tabular-nums">{bookings.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Button asChild>
          <Link href="/cars">Browse Cars</Link>
        </Button>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recent activity</h2>
          <Link
            href="/dashboard/bookings"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>

        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {recent.map((booking) => (
            <Link
              key={booking.id}
              href={`/dashboard/bookings/${booking.id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-secondary"
            >
              <div>
                <p className="text-sm font-medium">
                  {booking.car.make} {booking.car.model}
                </p>
                <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                  {booking.startDate} &rarr; {booking.endDate}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm tabular-nums">${booking.totalPrice}</span>
                <Badge variant={BOOKING_STATUS_VARIANT[booking.status]}>
                  {BOOKING_STATUS_LABEL[booking.status]}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
