"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarRange, Car, Users, CreditCard, Star, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/dashboard/user-menu";
import { NotificationBell } from "@/components/dashboard/notification-bell";

const NAV_ITEMS_BY_ROLE = {
  user: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/bookings", label: "My Bookings", icon: CalendarRange },
    { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/cars", label: "Fleet", icon: Car },
    { href: "/admin/bookings", label: "Bookings", icon: CalendarRange },
    { href: "/admin/payments", label: "Payments", icon: CreditCard },
    { href: "/admin/reviews", label: "Reviews", icon: Star },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
  ],
} as const;

const SETTINGS_HREF_BY_ROLE = {
  user: "/dashboard/profile",
  admin: "/admin/settings",
} as const;

type NavItem = { href: string; label: string; icon: React.ElementType };

// Matches the "Rental" + amber "Cars" split used on the marketing site
// header, so the dashboard reads as the same brand instead of a plain
// black-and-white admin panel.
function BrandTitle({ title }: { title: string }) {
  if (title.startsWith("RentalCars")) {
    return (
      <>
        Rental<span className="text-accent">Cars</span>
        {title.slice("RentalCars".length)}
      </>
    );
  }
  return <>{title}</>;
}

function NavLinks({
  items,
  pathname,
  excludeHref,
  className,
}: {
  items: readonly NavItem[];
  pathname: string;
  excludeHref?: string;
  className?: string;
}) {
  const isExcluded =
    !!excludeHref && (pathname === excludeHref || pathname.startsWith(`${excludeHref}/`));

  const activeHref = isExcluded
    ? undefined
    : items
        .map((item) => item.href)
        .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
        .sort((a, b) => b.length - a.length)[0];

  return (
    <nav className={className}>
      {items.map((item) => {
        const active = item.href === activeHref;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200",
              active
                ? "bg-accent text-accent-foreground"
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
  userEmail,
  userImage,
  children,
}: {
  role: "user" | "admin";
  title: string;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navItems = NAV_ITEMS_BY_ROLE[role];
  const settingsHref = SETTINGS_HREF_BY_ROLE[role];

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
        <span className="font-display text-base font-semibold tracking-tight">
          <BrandTitle title={title} />
        </span>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <UserMenu
            name={userName}
            email={userEmail}
            image={userImage}
            role={role}
            settingsHref={settingsHref}
            variant="compact"
            align="end"
          />
        </div>
      </header>
      <div className="overflow-x-auto border-b border-border bg-card px-3 py-2 lg:hidden">
        <NavLinks
          items={navItems}
          pathname={pathname}
          excludeHref={settingsHref}
          className="flex gap-1"
        />
      </div>

      {/* Desktop sidebar — fixed to the viewport so it (and the profile card at
          its bottom) always stays in view, independent of page scroll. */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card p-4 lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:h-dvh">
        <div className="mb-8 px-2">
          <span className="font-display text-lg font-semibold tracking-tight">
            <BrandTitle title={title} />
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavLinks items={navItems} pathname={pathname} excludeHref={settingsHref} className="space-y-1" />
        </div>
        <div className="shrink-0 border-t border-border pt-3">
          <UserMenu
            name={userName}
            email={userEmail}
            image={userImage}
            role={role}
            settingsHref={settingsHref}
            variant="full"
            align="start"
          />
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:ml-64">
        <header className="hidden items-center justify-end border-b border-border bg-card px-6 py-3 lg:flex">
          <NotificationBell />
        </header>
        <main
          id="main-content"
          key={pathname}
          className="flex-1 animate-in fade-in slide-in-from-bottom-1 p-6 duration-300 sm:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
