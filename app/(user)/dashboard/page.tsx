import Link from "next/link";
import { getServerCaller } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function UserDashboardPage() {
  const caller = await getServerCaller();
  const bookings = await caller.bookings.listMine();
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && b.endDate >= today,
  );

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
    </div>
  );
}
