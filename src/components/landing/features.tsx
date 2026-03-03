"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Zap, Link2, BrainCircuit, BarChart3, Bot, ShieldCheck } from "lucide-react";
import { FadeUp, StaggerGrid } from "./motion-helpers";

/* ─── 3-D tilt card ─────────────────────────────────────────── */

function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Raw mouse position relative to card centre (-0.5 … 0.5)
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Spring-smoothed values
  const springConfig = { stiffness: 180, damping: 22 };
  const x = useSpring(rawX, springConfig);
  const y = useSpring(rawY, springConfig);

  // Map to rotation angles (±10°) and a subtle brightness shift
  const rotateY = useTransform(x, [-0.5, 0.5], [-10, 10]);
  const rotateX = useTransform(y, [-0.5, 0.5], [10, -10]);
  const glareX = useTransform(x, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(y, [-0.5, 0.5], ["0%", "100%"]);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden cursor-default ${className ?? ""}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 800 }}
      variants={{
        hidden: { opacity: 0, y: 30 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {/* specular glare layer */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: useTransform(
            [glareX, glareY],
            ([gx, gy]) =>
              `radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.18) 0%, transparent 65%)`
          ),
        }}
      />
      {children}
    </motion.div>
  );
}

/* ─── icon badge — spins on hover ───────────────────────────── */
function IconBadge({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="size-10 rounded-xl bg-accent dark:bg-surface-icon flex items-center justify-center"
      whileHover={{ rotate: 15, scale: 1.15 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      {children}
    </motion.div>
  );
}

function IconBadgeLg({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="size-11 rounded-xl bg-muted dark:bg-surface-icon flex items-center justify-center"
      whileHover={{ rotate: 15, scale: 1.15 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      {children}
    </motion.div>
  );
}

/* ─── exported section ───────────────────────────────────────── */

export function LandingFeatures() {
  return (
    <>
      {/* ── Why Blessing ── */}
      <section id="features" className="py-24 px-6 bg-[#f9e6b5]/25 dark:bg-surface-elevated">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="mb-14">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary border border-border bg-card px-3 py-1 rounded-full mb-4">
              Why Blessing
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-3">
              Everything You Need to Automate
            </h2>
            <p className="text-muted-foreground max-w-lg">
              From simple task triggers to complex multi-step workflows —
              Blessing gives you the tools to build automation that actually
              works.
            </p>
          </FadeUp>

          <StaggerGrid className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <Zap className="size-5 text-[#d4af37]" />,
                title: "Instant Triggers",
                desc: "React to events in real time. New form submission? Message received? Blessing fires your workflow the moment it happens.",
              },
              {
                icon: <Link2 className="size-5 text-[#d4af37]" />,
                title: "Deep Integrations",
                desc: "Connect Slack, Stripe, Discord, WhatsApp, Google Forms, and more with zero code. One click and you're live.",
              },
              {
                icon: <BrainCircuit className="size-5 text-[#d4af37]" />,
                title: "AI-Powered Logic",
                desc: "Let AI make decisions inside your workflows — classify data, summarise messages, or route tickets automatically.",
              },
              {
                icon: <BarChart3 className="size-5 text-[#d4af37]" />,
                title: "Execution Logs",
                desc: "Track every workflow run, spot issues early, and understand exactly what happened with detailed execution history.",
              },
            ].map((f) => (
              <TiltCard
                key={f.title}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4"
              >
                <IconBadge>{f.icon}</IconBadge>
                <h3 className="font-bold text-base">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </TiltCard>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ── Powerful Nodes ── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <FadeUp className="mb-14">
            <h2 className="text-4xl md:text-5xl font-bold mb-3">
              Powerful Automation Nodes
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Build sophisticated workflows using our library of pre-built
              connectors and intelligent logic controllers.
            </p>
          </FadeUp>

          <StaggerGrid className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="size-6 text-[#d4af37]" />,
                title: "Real-time Sync",
                desc: "Keep your data in sync across platforms. When a message hits Slack, trigger actions across your entire stack instantly.",
              },
              {
                icon: <Bot className="size-6 text-[#d4af37]" />,
                title: "AI Smart Filters",
                desc: "Let AI sort through the noise. Route Discord messages or WhatsApp threads based on sentiment and urgency.",
              },
              {
                icon: <ShieldCheck className="size-6 text-[#d4af37]" />,
                title: "Protected Flows",
                desc: "End-to-end encryption for all your cross-platform communications. Your business secrets stay secret.",
              },
            ].map((n) => (
              <TiltCard
                key={n.title}
                className="bg-card border border-border rounded-2xl p-8 text-left flex flex-col gap-4"
              >
                <IconBadgeLg>{n.icon}</IconBadgeLg>
                <h3 className="font-bold text-lg">{n.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{n.desc}</p>
              </TiltCard>
            ))}
          </StaggerGrid>
        </div>
      </section>
    </>
  );
}
