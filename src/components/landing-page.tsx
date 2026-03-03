import { LandingNavbar } from "@/components/landing/navbar";
import { LandingHero } from "@/components/landing/hero";
import dynamic from "next/dynamic";

// Code-split below-fold sections — JS for each chunk is loaded in a separate
// bundle but still server-rendered on first paint (ssr: true).
const LandingFeatures = dynamic(() =>
  import("@/components/landing/features").then((m) => ({ default: m.LandingFeatures })),
  { ssr: true }
);
const LandingHowItWorks = dynamic(() =>
  import("@/components/landing/how-it-works").then((m) => ({ default: m.LandingHowItWorks })),
  { ssr: true }
);
const LandingNewsletter = dynamic(() =>
  import("@/components/landing/newsletter").then((m) => ({ default: m.LandingNewsletter })),
  { ssr: true }
);
const LandingFooter = dynamic(() =>
  import("@/components/landing/footer").then((m) => ({ default: m.LandingFooter })),
  { ssr: true }
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden scroll-smooth">
      <LandingNavbar />
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingNewsletter />
      <LandingFooter />
    </div>
  );
}
