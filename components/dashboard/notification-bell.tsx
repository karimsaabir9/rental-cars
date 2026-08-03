"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const utils = trpc.useUtils();
  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: items } = trpc.notifications.listMine.useQuery();

  const invalidate = () => {
    utils.notifications.unreadCount.invalidate();
    utils.notifications.listMine.invalidate();
  };

  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: invalidate });
  const markAllRead = trpc.notifications.markAllRead.useMutation({ onSuccess: invalidate });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {!!unreadCount && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0 font-normal">Notifications</DropdownMenuLabel>
          {!!unreadCount && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="text-xs font-medium text-accent hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {!items || items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {items.map((n) => {
              const body = (
                <div className="flex flex-col gap-0.5 py-0.5">
                  <span className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</span>
                  <span className="text-xs text-muted-foreground">{n.message}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>
              );
              return n.link ? (
                <DropdownMenuItem
                  key={n.id}
                  asChild
                  className="cursor-pointer items-start"
                  onClick={() => !n.read && markRead.mutate({ id: n.id })}
                >
                  <Link href={n.link}>{body}</Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  key={n.id}
                  className="items-start"
                  onClick={() => !n.read && markRead.mutate({ id: n.id })}
                >
                  {body}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
