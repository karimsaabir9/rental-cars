import { Hero } from "@/components/marketing/hero";
import { FeaturedFleet } from "@/components/marketing/featured-fleet";
import { HowItWorks } from "@/components/marketing/how-it-works";

export default function Home() {
  return (
    <main>
      <Hero />
      <FeaturedFleet />
      <HowItWorks />
    </main>
  );
}
