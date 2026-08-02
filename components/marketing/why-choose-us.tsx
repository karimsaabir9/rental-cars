import Image from "next/image";
import { ShieldCheck, Headset, ReceiptText, CalendarClock } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { stockImageUrl, STOCK_IMAGES } from "@/lib/stock-images";

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: "Fully insured",
    body: "Every rental includes comprehensive coverage, at no extra cost.",
  },
  {
    icon: Headset,
    title: "24/7 support",
    body: "Roadside assistance and a real person on the line, any hour.",
  },
  {
    icon: ReceiptText,
    title: "No hidden fees",
    body: "The price you see at checkout is exactly what you pay.",
  },
  {
    icon: CalendarClock,
    title: "Flexible cancellation",
    body: "Plans change. Cancel free up to 24 hours before pickup.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
            <Image
              src={stockImageUrl("whyChooseUs", 1200)}
              alt={STOCK_IMAGES.whyChooseUs.alt}
              fill
              className="object-cover"
            />
          </div>
        </Reveal>

        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase">Why RentalCars</p>
          <h2 className="mt-3 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for people who expect more from a rental.
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            No queues, no fine print, no surprise charges at return. Just a
            clean fleet and a process that respects your time.
          </p>

          <dl className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {VALUE_PROPS.map((prop) => (
              <Reveal key={prop.title}>
                <div>
                  <prop.icon className="size-5 text-accent" />
                  <dt className="mt-3 font-semibold">{prop.title}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{prop.body}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
