"use client";

import { motion } from "motion/react";
import NewsletterSignup from "@/components/newsletter-signup";
import { FadeUp } from "./motion-helpers";

export function LandingNewsletter() {
  return (
    <section
      id="newsletter"
      className="relative py-28 px-6 overflow-hidden bg-[#1a1408] text-[#fdfaf3]"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/2 -translate-y-1/2 size-72 rounded-full bg-[#8B5A2B]/30 blur-3xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/2 -translate-y-1/2 size-72 rounded-full bg-[#d4af37]/20 blur-3xl"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      <div className="relative max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
        <FadeUp>
          <span className="inline-block text-xs font-semibold tracking-widest uppercase border border-[#e3d4aa]/30 bg-white/5 px-3 py-1 rounded-full text-[#d4af37] mb-2">
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

        <motion.p
          className="text-xs text-[#746641]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          Unsubscribe anytime. We respect your privacy.
        </motion.p>
      </div>
    </section>
  );
}
