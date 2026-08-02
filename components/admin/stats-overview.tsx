"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { trpc } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RevealGroup } from "@/components/motion/reveal";
import { BOOKING_STATUS_LABEL } from "@/lib/booking-status";

const STATUS_COLOR: Record<string, string> = {
  confirmed: "var(--success)",
  pending: "var(--accent)",
  approved: "var(--success)",
  rejected: "var(--destructive)",
  completed: "var(--muted-foreground)",
  cancelled: "var(--border)",
};

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  fontFamily: "var(--font-mono)",
};

export function StatsOverview() {
  const { data, isLoading } = trpc.stats.overview.useQuery();

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!data) return null;

  const statCards = [
    { label: "Total Revenue", value: `$${data.revenue.toFixed(2)}` },
    { label: "Active Rentals", value: data.activeRentals },
    { label: "Pending Approval", value: data.pendingApprovals },
    { label: "Total Cars", value: data.totalCars },
    { label: "Available Cars", value: data.availableCars },
    { label: "Total Users", value: data.totalUsers },
    { label: "Total Bookings", value: data.totalBookings },
    { label: "Fleet Utilization", value: `${(data.fleetUtilization * 100).toFixed(0)}%` },
  ];

  return (
    <div className="space-y-6">
      <RevealGroup className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold tabular-nums">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </RevealGroup>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.bookingsByStatus}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {data.bookingsByStatus.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLOR[entry.status] ?? "var(--muted)"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => [
                      value,
                      BOOKING_STATUS_LABEL[
                        item.payload.status as keyof typeof BOOKING_STATUS_LABEL
                      ],
                    ]}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
