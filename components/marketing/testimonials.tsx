import { Star } from "lucide-react";
import { RevealGroup } from "@/components/motion/reveal";

const TESTIMONIALS = [
  {
    initials: "MR",
    name: "Marcus R.",
    context: "Booked a Model 3 for a weekend trip",
    quote:
      "Reserved a car from my phone in the parking lot of the airport and it was ready when I landed. No line, no upsell pitch — just the keys.",
  },
  {
    initials: "SK",
    name: "Sarah K.",
    context: "Rents monthly for client visits",
    quote:
      "I've used three other rental apps and this is the first one where the price at checkout matched the price on the listing. Every time.",
  },
  {
    initials: "DL",
    name: "David L.",
    context: "Rented an SUV for a family move",
    quote:
      "Something came up and I had to push my pickup back a day. Cancelling and rebooking took under a minute, no fee, no phone call.",
  },
];

export function Testimonials() {
  return (
    <section className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase">Testimonials</p>
        <h2 className="mt-3 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
          Trusted by drivers who value their time.
        </h2>

        <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="flex h-full flex-col rounded-xl border border-border bg-card p-6"
            >
              <div className="flex gap-0.5 text-accent" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm text-foreground">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs font-medium">
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.context}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
