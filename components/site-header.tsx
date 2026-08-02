import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/dashboard/user-menu";

type SessionUser = {
  name: string;
  email: string;
  image?: string | null;
  role: "user" | "admin";
};

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const dashboardHref = user?.role === "admin" ? "/admin" : "/dashboard";
  const settingsHref = user?.role === "admin" ? "/admin/settings" : "/dashboard/profile";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-1.5 font-display text-lg font-semibold tracking-tight">
          Rental<span className="text-accent">Cars</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/cars"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Browse Cars
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href={dashboardHref}>Dashboard</Link>
              </Button>
              <UserMenu
                name={user.name}
                email={user.email}
                image={user.image}
                role={user.role}
                settingsHref={settingsHref}
                variant="compact"
                align="end"
              />
            </div>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
