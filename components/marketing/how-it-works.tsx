import { RevealGroup } from "@/components/motion/reveal";

const STEPS = [
  {
    n: "01",
    title: "Browse the fleet",
    body: "Filter by category, transmission, or budget. Every listing shows real availability.",
  },
  {
    n: "02",
    title: "Book in a minute",
    body: "Pick your dates, confirm the price, and your reservation is instant — no back and forth.",
  },
  {
    n: "03",
    title: "Pick up and drive",
    body: "Show up, grab the keys, go. Manage or cancel anytime from your dashboard.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase">Process</p>
        <h2 className="mt-3 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
          Three steps, no dealership hassle.
        </h2>

        <RevealGroup className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n}>
              <span className="readout font-display text-base">{step.n}</span>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
