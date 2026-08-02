import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { stockImageUrl, STOCK_IMAGES } from "@/lib/stock-images";

export function CtaBanner() {
  return (
    <section className="px-6 py-24">
      <Reveal>
        <div className="showroom relative mx-auto max-w-6xl overflow-hidden rounded-2xl">
          <Image
            src={stockImageUrl("ctaBanner", 1800)}
            alt={STOCK_IMAGES.ctaBanner.alt}
            width={1800}
            height={1000}
            className="h-[26rem] w-full object-cover object-[50%_35%] sm:h-[28rem]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(0deg, rgba(18,21,27,0.92) 0%, rgba(18,21,27,0.55) 45%, rgba(18,21,27,0.2) 100%)",
            }}
          />
          <div className="absolute inset-0 flex flex-col items-start justify-end p-8 sm:p-14">
            <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase">
              Ready when you are
            </p>
            <h2 className="mt-3 max-w-lg font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Your next car is one tap away.
            </h2>
            <Button asChild size="lg" className="mt-8 group">
              <Link href="/cars">
                Browse the fleet
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
