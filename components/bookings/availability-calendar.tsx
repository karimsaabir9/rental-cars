"use client";

import { useMemo } from "react";
import { trpc } from "@/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function AvailabilityCalendar({ carId }: { carId: string }) {
  const { data, isLoading } = trpc.cars.getAvailability.useQuery({ carId });

  const bookedDates = useMemo(() => {
    const set = new Set<string>();
    if (!data) return set;
    for (const range of data) {
      const cursor = new Date(range.startDate);
      const end = new Date(range.endDate);
      while (cursor <= end) {
        set.add(toDateStr(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return set;
  }, [data]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const now = new Date();
  const months = [0, 1].map((offset) => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {months.map(({ year, month }) => (
        <MonthGrid key={`${year}-${month}`} year={year} month={month} bookedDates={bookedDates} />
      ))}
    </div>
  );
}

function MonthGrid({
  year,
  month,
  bookedDates,
}: {
  year: number;
  month: number;
  bookedDates: Set<string>;
}) {
  const cells = buildMonthGrid(year, month);
  const label = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const todayStr = toDateStr(new Date());

  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={i} />;
          const dateStr = toDateStr(date);
          const isBooked = bookedDates.has(dateStr);
          const isPast = dateStr < todayStr;
          return (
            <span
              key={i}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md text-foreground",
                isPast && "text-muted-foreground/40",
                !isPast && isBooked && "bg-destructive/15 text-destructive",
                !isPast && !isBooked && "bg-success/10",
              )}
            >
              {date.getDate()}
            </span>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-success/40" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-destructive/40" /> Booked
        </span>
      </div>
    </div>
  );
}
