"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { FadeUp, StaggerGrid, CardItem } from "./motion-helpers";

/**
 * LandingPricing
 *
 * Not currently used on the landing page.
 * Import and add to landing-page.tsx when pricing is ready to go live:
 *
 *   import { LandingPricing } from "@/components/landing/pricing";
 *   // then place <LandingPricing /> between <LandingHowItWorks /> and <LandingNewsletter />
 */
export function LandingPricing() {
  return (
    <section id="pricing" className="py-24 px-6 bg-[#f9e6b5]/25">
      <div className="max-w-4xl mx-auto">
        <FadeUp className="text-center mb-14">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#8B5A2B] border border-[#e3d4aa] bg-[#fffdf6] px-3 py-1 rounded-full mb-4">
            Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-[#746641]">
            Start free. Upgrade when you&apos;re ready.
          </p>
        </FadeUp>

        <StaggerGrid className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <CardItem className="bg-[#fffdf6] border border-[#e3d4aa] rounded-2xl p-8 flex flex-col gap-5">
            <div>
              <h3 className="font-bold text-xl mb-1">Free</h3>
              <p className="text-[#746641] text-sm">Perfect for getting started</p>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-5xl font-extrabold">$0</span>
              <span className="text-[#746641] mb-2">/month</span>
            </div>
            <ul className="flex flex-col gap-3 flex-1">
              {[
                "5 active workflows",
                "100 tasks/month",
                "Core app integrations",
                "Community support",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm text-[#1a1408]"
                >
                  <CheckCircle2 className="size-4 text-[#8B5A2B] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-2 text-center border border-[#4A2010] text-[#4A2010] font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[#4A2010] hover:text-white transition-colors"
            >
              Get started free
            </Link>
          </CardItem>

          {/* Pro */}
          <CardItem className="bg-[#4A2010] text-[#fdfaf3] rounded-2xl p-8 flex flex-col gap-5 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-10 -right-10 size-40 rounded-full bg-[#d4af37]/20 blur-2xl pointer-events-none"
            />
            <div>
              <span className="text-xs font-semibold bg-[#d4af37] text-[#1a1408] px-2.5 py-0.5 rounded-full">
                Coming soon
              </span>
              <h3 className="font-bold text-xl mt-3 mb-1">Pro</h3>
              <p className="text-[#c2ad7a] text-sm">
                For teams that mean business
              </p>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-5xl font-extrabold">$29</span>
              <span className="text-[#c2ad7a] mb-2">/month</span>
            </div>
            <ul className="flex flex-col gap-3 flex-1">
              {[
                "Unlimited workflows",
                "All app integrations",
                "AI-powered nodes",
                "Priority support",
                "Execution analytics",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-[#d4af37] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-2 text-center bg-[#d4af37] text-[#1a1408] font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[#c4a030] transition-colors"
            >
              Join waitlist
            </Link>
          </CardItem>
        </StaggerGrid>
      </div>
    </section>
  );
}
