"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  User,
  Car,
  Users,
  LogOut,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const NAV_ITEMS_BY_ROLE = {
  user: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/bookings", label: "My Bookings", icon: CalendarRange },
    { href: "/dashboard/profile", label: "Profile", icon: User },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/cars", label: "Fleet", icon: Car },
    { href: "/admin/bookings", label: "Bookings", icon: CalendarRange },
    { href: "/admin/users", label: "Users", icon: Users },
  ],
} as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type NavItem = { href: string; label: string; icon: React.ElementType };

function NavLinks({
  items,
  pathname,
  className,
}: {
  items: readonly NavItem[];
  pathname: string;
  className?: string;
}) {
  return (
    <nav className={className}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  role,
  title,
  userName,
  children,
}: {
  role: "user" | "admin";
  title: string;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = NAV_ITEMS_BY_ROLE[role];

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
        <span className="font-display text-base font-semibold tracking-tight">{title}</span>
        <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
          <LogOut className="size-4" />
        </Button>
      </header>
      <div className="overflow-x-auto border-b border-border bg-card px-3 py-2 lg:hidden">
        <NavLinks items={navItems} pathname={pathname} className="flex gap-1" />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card p-4 lg:flex">
        <div className="mb-8 px-2">
          <span className="font-display text-lg font-semibold tracking-tight">{title}</span>
        </div>
        <NavLinks items={navItems} pathname={pathname} className="flex-1 space-y-1" />
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center gap-2 px-2">
            <Avatar className="size-7">
              <AvatarFallback className="bg-secondary text-xs">{initials(userName)}</AvatarFallback>
            </Avatar>
            <p className="truncate text-sm text-muted-foreground">{userName}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <main key={pathname} className="flex-1 animate-in fade-in slide-in-from-bottom-1 p-6 duration-300 sm:p-8">
        {children}
      </main>
    </div>
  );
}
