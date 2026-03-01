"use client";

import { LandingNavbar } from "@/components/landing/navbar";
import { LandingHero } from "@/components/landing/hero";
import { LandingFeatures } from "@/components/landing/features";
import { LandingHowItWorks } from "@/components/landing/how-it-works";
import { LandingNewsletter } from "@/components/landing/newsletter";
import { LandingFooter } from "@/components/landing/footer";
// To add pricing: import { LandingPricing } from "@/components/landing/pricing";
// Then place <LandingPricing /> between <LandingHowItWorks /> and <LandingNewsletter />

export default function LandingPageClient() {
  return (
    <div className="min-h-screen bg-[#fdfaf3] text-[#1a1408] font-sans overflow-x-hidden scroll-smooth">
      <LandingNavbar />
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingNewsletter />
      <LandingFooter />
    </div>
  );
}
