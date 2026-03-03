"use client";

import NewsletterSignup from "@/components/newsletter-signup";
import { FadeUp } from "./motion-helpers";

export function LandingNewsletter() {
  return (
    <section
      id="newsletter"
      className="relative py-28 px-6 overflow-hidden bg-[#1a1408] dark:bg-[#0a0805] text-[#fdfaf3]"
    >
      {/* CSS-only animated blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/2 -translate-y-1/2 size-72 rounded-full bg-[#8B5A2B]/30 dark:bg-[#d4af37]/10 blur-3xl"
        style={{ animation: "blob-pulse 7s ease-in-out infinite", willChange: "transform" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/2 -translate-y-1/2 size-72 rounded-full bg-[#d4af37]/20 dark:bg-[#d4af37]/8 blur-3xl"
        style={{ animation: "blob-pulse-slow 9s ease-in-out 1s infinite", willChange: "transform" }}
      />

      <div className="relative max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
        <FadeUp>
          <span className="inline-block text-xs font-semibold tracking-widest uppercase border border-[#e3d4aa]/30 dark:border-[#d4af37]/20 bg-white/5 px-3 py-1 rounded-full text-[#d4af37] mb-2">
            Stay in the loop
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-2">
            Get Automation Tips &amp; Updates
          </h2>
          <p className="text-[#c2ad7a] max-w-md mt-4 mx-auto">
            Tips, new integrations, and early access to upcoming features —
            straight to your inbox. No spam, ever.
          </p>
        </FadeUp>

        <FadeUp delay={0.15} className="w-full max-w-lg mt-2">
          <NewsletterSignup dark />
        </FadeUp>

        <FadeUp delay={0.3}>
          <p className="text-xs text-[#746641] dark:text-[#6b5d3f]">
            Unsubscribe anytime. We respect your privacy.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}
