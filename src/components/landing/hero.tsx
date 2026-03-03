import Link from "next/link";
import Image from "next/image";
import { Zap } from "lucide-react";

const LOGOS = [
  { src: "/logos/slack.svg", label: "Slack" },
  { src: "/logos/github.svg", label: "GitHub", dark: true },
  { src: "/logos/google.svg", label: "Google" },
  { src: "/logos/stripe.svg", label: "Stripe" },
  { src: "/logos/discord.svg", label: "Discord" },
  { src: "/logos/whatsapp.svg", label: "WhatsApp" },
  { src: "/logos/anthropic.svg", label: "Anthropic" },
  { src: "/logos/openai.svg", label: "OpenAI", dark: true },
  { src: "/logos/gemini.svg", label: "Gemini" },
  { src: "/logos/googleform.svg", label: "Google Forms" },
];

function LogoStrip() {
  return (
    <div className="flex items-center gap-14 shrink-0 pr-14">
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
              className={`object-contain max-h-10${logo.dark ? " dark:invert" : ""}`}
              loading="lazy"
            />
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {logo.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * CSS-only infinite marquee.
 * Uses translate3d for GPU compositing → silky 60 fps.
 * Three copies so the seam is never visible on ultra-wide screens.
 */
function InfiniteMarquee() {
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        className="flex w-max"
        style={{
          animation: "marquee 40s linear infinite",
          willChange: "transform",
        }}
      >
        <LogoStrip />
        <LogoStrip />
        <LogoStrip />
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden py-28 px-6 text-center">
      {/* ── animated blobs — pure CSS, GPU-composited ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-[#f9e6b5] dark:bg-[#d4af37] blur-3xl opacity-60 dark:opacity-15"
        style={{ animation: "scale-breath 8s ease-in-out infinite", willChange: "transform" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-20 -left-32 size-72 rounded-full bg-[#e3d4aa] dark:bg-[#8B5A2B] blur-3xl opacity-30 dark:opacity-10"
        style={{ animation: "drift-left 10s ease-in-out infinite", willChange: "transform" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-10 -right-32 size-72 rounded-full bg-[#d4af37] blur-3xl opacity-20 dark:opacity-10"
        style={{ animation: "drift-right 12s ease-in-out infinite", willChange: "transform" }}
      />

      {/* ── Hero content with staggered fade-in ── */}
      <div className="relative max-w-4xl mx-auto flex flex-col items-center gap-6">
        <span
          className="inline-flex items-center gap-2 text-sm font-medium border border-border bg-card px-4 py-1.5 rounded-full text-primary"
          style={{ animation: "fade-in-up 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s both", willChange: "transform, opacity" }}
        >
          <Zap className="size-3.5" />
          The new standard for workflow automation
        </span>

        <h1
          className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight"
          style={{ animation: "fade-in-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.25s both", willChange: "transform, opacity" }}
        >
          Automate your work.{" "}
          <span className="text-primary">Elevate your business.</span>
        </h1>

        <p
          className="max-w-xl text-lg text-muted-foreground"
          style={{ animation: "fade-in-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.4s both", willChange: "transform, opacity" }}
        >
          Connect your apps, orchestrate complex workflows, and eliminate manual
          tasks with our intelligent automation engine. Built for teams that
          demand excellence.
        </p>

        <div
          className="flex flex-col sm:flex-row items-center gap-3 mt-2"
          style={{ animation: "fade-in-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.55s both", willChange: "transform, opacity" }}
        >
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-[#4A2010] dark:bg-primary text-[#fdfaf3] dark:text-primary-foreground font-semibold text-base px-8 py-3.5 rounded-xl hover:bg-[#6B3A1F] dark:hover:bg-[#c4a030] transition-all duration-200 shadow-lg shadow-[#4A2010]/30 dark:shadow-primary/20 hover:scale-[1.04] active:scale-[0.97]"
          >
            Start Building Free →
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-2 border border-border bg-card text-foreground font-semibold text-base px-8 py-3.5 rounded-xl hover:border-primary transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
          >
            See how it works
          </Link>
        </div>
      </div>

      {/* ── CSS-only infinite marquee ── */}
      <div className="relative mt-20 w-full">
        <p
          className="text-center text-xs font-semibold tracking-widest uppercase text-muted-foreground dark:text-primary/80 mb-8"
          style={{ animation: "fade-in 0.8s ease 0.7s both" }}
        >
          Connects with your favourite tools
        </p>
        <div style={{ animation: "fade-in 1s ease 0.9s both" }}>
          <InfiniteMarquee />
        </div>
      </div>
    </section>
  );
}
