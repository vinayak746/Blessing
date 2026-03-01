"use client";

import { motion, useAnimationFrame, useMotionValue } from "motion/react";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Zap } from "lucide-react";

const LOGOS = [
  { src: "/logos/slack.svg", label: "Slack" },
  { src: "/logos/github.svg", label: "GitHub" },
  { src: "/logos/google.svg", label: "Google" },
  { src: "/logos/stripe.svg", label: "Stripe" },
  { src: "/logos/discord.svg", label: "Discord" },
  { src: "/logos/whatsapp.svg", label: "WhatsApp" },
  { src: "/logos/anthropic.svg", label: "Anthropic" },
  { src: "/logos/openai.svg", label: "OpenAI" },
  { src: "/logos/gemini.svg", label: "Gemini" },
  { src: "/logos/googleform.svg", label: "Google Forms" },
];

function LogoStrip({ innerRef }: { innerRef?: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={innerRef} className="flex items-center gap-14 pr-14 shrink-0">
      {LOGOS.map((logo) => (
        <div
          key={logo.label}
          className="flex flex-col items-center gap-2 shrink-0"
        >
          <div className="size-10 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity duration-300">
            <Image
              src={logo.src}
              alt={logo.label}
              width={40}
              height={40}
              className="object-contain max-h-10"
            />
          </div>
          <span className="text-[10px] text-[#b09060] whitespace-nowrap">
            {logo.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Truly endless marquee — driven by useAnimationFrame at a fixed px/s rate.
 * Measures the real rendered width of one strip and wraps at exactly that
 * boundary, so there are zero percentage-rounding jumps.
 */
function InfiniteMarquee() {
  const stripRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const SPEED = 55; // px per second

  useAnimationFrame((_, delta) => {
    const stripWidth = stripRef.current?.offsetWidth ?? 0;
    if (stripWidth === 0) return;
    const next = x.get() - (SPEED * delta) / 1000;
    x.set(next <= -stripWidth ? next + stripWidth : next);
  });

  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div className="flex" style={{ x }}>
        {/* Three copies guarantees content fills any viewport width */}
        <LogoStrip innerRef={stripRef} />
        <LogoStrip />
        <LogoStrip />
      </motion.div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden py-28 px-6 text-center">
      {/* animated blobs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-[#f9e6b5] blur-3xl opacity-60"
        animate={{ scale: [1, 1.1, 1], opacity: [0.55, 0.7, 0.55] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-20 -left-32 size-72 rounded-full bg-[#e3d4aa] blur-3xl opacity-30"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-10 -right-32 size-72 rounded-full bg-[#d4af37] blur-3xl opacity-20"
        animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative max-w-4xl mx-auto flex flex-col items-center gap-6">
        <motion.span
          className="inline-flex items-center gap-2 text-sm font-medium border border-[#e3d4aa] bg-[#fffdf6] px-4 py-1.5 rounded-full text-[#8B5A2B]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Zap className="size-3.5" />
          The new standard for workflow automation
        </motion.span>

        <motion.h1
          className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          Automate your work.{" "}
          <span className="text-[#8B5A2B]">Elevate your business.</span>
        </motion.h1>

        <motion.p
          className="max-w-xl text-lg text-[#746641]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          Connect your apps, orchestrate complex workflows, and eliminate manual
          tasks with our intelligent automation engine. Built for teams that
          demand excellence.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center gap-3 mt-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#4A2010] text-[#fdfaf3] font-semibold text-base px-8 py-3.5 rounded-xl hover:bg-[#6B3A1F] transition-colors shadow-lg shadow-[#4A2010]/30"
            >
              Start Building Free →
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 border border-[#e3d4aa] bg-[#fffdf6] text-[#1a1408] font-semibold text-base px-8 py-3.5 rounded-xl hover:border-[#8B5A2B] transition-colors"
            >
              See how it works
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Truly endless pixel-based marquee ── */}
      <div className="relative mt-20 w-full">
        <p className="text-center text-xs font-semibold tracking-widest uppercase text-[#b09060] mb-8">
          Connects with your favourite tools
        </p>
        <InfiniteMarquee />
      </div>
    </section>
  );
}
