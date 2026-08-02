"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Button } from "@/components/ui/button";

const STATS = [
  { label: "FLEET", value: "120+" },
  { label: "CITIES", value: "18" },
  { label: "RATING", value: "4.9" },
  { label: "SUPPORT", value: "24/7" },
];

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        ".hero-eyebrow",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.5 },
      )
        .fromTo(
          ".hero-line",
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.12 },
          "-=0.2",
        )
        .fromTo(
          ".hero-sub",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.3",
        )
        .fromTo(
          ".hero-cta",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 },
          "-=0.35",
        )
        .fromTo(
          ".hero-stat",
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
          "-=0.25",
        );

      gsap.to(".hero-glow", {
        x: 40,
        y: -20,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: containerRef },
  );

  return (
    <section ref={containerRef} className="showroom relative overflow-hidden bg-background">
      <div
        className="hero-glow pointer-events-none absolute -top-32 right-[-10%] size-[36rem] rounded-full opacity-30 blur-[120px]"
        style={{ background: "var(--accent)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, #fff 0px, #fff 1px, transparent 1px, transparent 64px)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6 py-28 sm:py-36">
        <p className="hero-eyebrow font-mono text-xs tracking-[0.3em] text-accent uppercase">
          Premium Car Rental
        </p>

        <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.05] font-semibold tracking-tight text-foreground sm:text-7xl">
          <span className="hero-line block">Drive something</span>
          <span className="hero-line block text-accent">worth the drive.</span>
        </h1>

        <p className="hero-sub mt-6 max-w-lg text-lg text-muted-foreground">
          A curated fleet, instant booking, and zero surprises. Reserve in under
          a minute and pick up the keys today.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Button asChild size="lg" className="hero-cta group">
            <Link href="/cars">
              Browse the fleet
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="hero-cta">
            <Link href="/signup">Create an account</Link>
          </Button>
        </div>

        <dl className="mt-20 grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="hero-stat">
              <dt className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
                {stat.label}
              </dt>
              <dd className="readout mt-2 w-fit">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
