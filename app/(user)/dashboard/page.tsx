import Link from "next/link";
import { CalendarX } from "lucide-react";
import { getServerCaller } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusVariant = {
  confirmed: "success",
  completed: "secondary",
  cancelled: "destructive",
} as const;

export default async function UserDashboardPage() {
  const caller = await getServerCaller();
  const bookings = await caller.bookings.listMine();
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && b.endDate >= today,
  );
  const recent = bookings.slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Here&apos;s where things stand.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          {bookings.length > 0 && (
            <Link
              href="/dashboard/bookings"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
            <CalendarX className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">You haven&apos;t made any bookings yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {recent.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
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
                  <Badge variant={statusVariant[booking.status]}>{booking.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
