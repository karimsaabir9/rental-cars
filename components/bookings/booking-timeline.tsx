import { Ban, CheckCircle2, Clock, PackageCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOOKING_STATUS_LABEL } from "@/lib/booking-status";

type TimelineEvent = {
  id: string;
  status: keyof typeof BOOKING_STATUS_LABEL;
  note: string | null;
  createdAt: Date | string;
  actor: { name: string; role: string };
};

const STATUS_ICON = {
  confirmed: CheckCircle2,
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  completed: PackageCheck,
  cancelled: Ban,
} as const;

const STATUS_COLOR = {
  confirmed: "bg-success text-white",
  pending: "bg-accent text-accent-foreground",
  approved: "bg-success text-white",
  rejected: "bg-destructive text-white",
  completed: "bg-secondary text-secondary-foreground",
  cancelled: "bg-muted text-muted-foreground",
} as const;

export function BookingTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="space-y-6">
      {events.map((event, i) => {
        const Icon = STATUS_ICON[event.status];
        const isLast = i === events.length - 1;
        return (
          <li key={event.id} className="relative flex gap-4 pb-1">
            {!isLast && (
              <span
                aria-hidden
                className="absolute top-8 left-4 h-[calc(100%-1.5rem)] w-px -translate-x-1/2 bg-border"
              />
            )}
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                STATUS_COLOR[event.status],
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-sm font-medium">{BOOKING_STATUS_LABEL[event.status]}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {new Date(event.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                &middot; {event.actor.name}
                {event.actor.role === "admin" && " (Admin)"}
              </p>
              {event.note && <p className="mt-1.5 text-sm text-muted-foreground">{event.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
