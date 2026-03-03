"use client";

import { FadeUp, StaggerGrid, CardItem } from "./motion-helpers";

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp className="mb-14">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary border border-border bg-card px-3 py-1 rounded-full mb-4">
            How it works
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-3">
            Automate in 3 Simple Steps
          </h2>
          <p className="text-muted-foreground max-w-lg">
            No developers needed. Go from idea to automated workflow in minutes
            with our intuitive visual builder.
          </p>
        </FadeUp>

        <StaggerGrid className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              emoji: "🔌",
              title: "Connect Your Apps",
              desc: "Link your tools in seconds using secure OAuth — connect Slack, Stripe, Discord, WhatsApp, Google Forms, and more. No API keys to manage.",
            },
            {
              step: "2",
              emoji: "🏗️",
              title: "Build Your Workflow",
              desc: "Use our drag-and-drop canvas to design your automation. Add triggers, conditions, actions, and AI steps visually.",
            },
            {
              step: "3",
              emoji: "🚀",
              title: "Launch & Relax",
              desc: "Activate your workflow and watch it run. Blessing handles everything 24/7 while you focus on growing your business.",
            },
          ].map((s) => (
            <CardItem
              key={s.step}
              className="relative bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center gap-4 cursor-default"
            >
              <span className="size-9 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                {s.step}
              </span>
              <span className="text-4xl">{s.emoji}</span>
              <h3 className="font-bold text-lg">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </CardItem>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
