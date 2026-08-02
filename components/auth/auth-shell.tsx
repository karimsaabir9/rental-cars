import Link from "next/link";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="showroom relative hidden flex-col justify-between overflow-hidden bg-background p-12 lg:flex">
        <div
          className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full opacity-25 blur-[100px]"
          style={{ background: "var(--accent)" }}
          aria-hidden
        />
        <Link href="/" className="relative font-display text-lg font-semibold tracking-tight text-foreground">
          Rental<span className="text-accent">Cars</span>
        </Link>
        <div className="relative max-w-sm">
          <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase">Premium Car Rental</p>
          <h2 className="mt-4 font-display text-3xl leading-tight font-semibold text-foreground">
            Every booking, instrument-panel clear.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Track your reservations, manage the fleet, and see exactly where every car and dollar stands.
          </p>
        </div>
        <p className="relative font-mono text-xs text-muted-foreground">© {new Date().getFullYear()} RentalCars</p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
