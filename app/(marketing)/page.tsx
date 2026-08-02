import { Hero } from "@/components/marketing/hero";
import { WhyChooseUs } from "@/components/marketing/why-choose-us";
import { FeaturedFleet } from "@/components/marketing/featured-fleet";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Testimonials } from "@/components/marketing/testimonials";
import { CtaBanner } from "@/components/marketing/cta-banner";

export default function Home() {
  return (
    <main>
      <Hero />
      <WhyChooseUs />
      <FeaturedFleet />
      <HowItWorks />
      <Testimonials />
      <CtaBanner />
    </main>
  );
}
