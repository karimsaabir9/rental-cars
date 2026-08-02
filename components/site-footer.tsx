import Link from "next/link";

const EXPLORE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/cars", label: "Browse Cars" },
  { href: "#how-it-works", label: "How It Works" },
];

const ACCOUNT_LINKS = [
  { href: "/login", label: "Sign In" },
  { href: "/signup", label: "Create Account" },
];

export function SiteFooter() {
  return (
    <footer className="showroom border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2">
            <Link
              href="/"
              className="font-display text-lg font-semibold tracking-tight text-foreground"
            >
              Rental<span className="text-accent">Cars</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              A curated fleet and an instant-booking flow, built for people who
              expect more from a rental.
            </p>
          </div>

          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
              Account
            </p>
            <ul className="mt-4 space-y-2.5">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} RentalCars. All rights reserved.</p>
          <p className="font-mono">Fleet status: all systems available</p>
        </div>
      </div>
    </footer>
  );
}
