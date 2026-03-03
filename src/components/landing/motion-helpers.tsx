"use client";

import { useRef, useEffect, type ReactNode } from "react";

/** Lightweight IntersectionObserver hook — fires once */
function useInView(ref: React.RefObject<HTMLElement | null>, margin = "-80px") {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in-view");
          io.disconnect();
        }
      },
      { rootMargin: margin, threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
}

export function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useInView(ref);

  const delayClass =
    delay >= 0.5 ? "stagger-5" :
    delay >= 0.35 ? "stagger-4" :
    delay >= 0.3 ? "stagger-3" :
    delay >= 0.2 ? "stagger-2" :
    delay >= 0.1 ? "stagger-1" : "";

  return (
    <div
      ref={ref}
      className={`animate-fade-in-up ${delayClass} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function StaggerGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useInView(ref);

  return (
    <div ref={ref} className={`animate-fade-in-up ${className ?? ""}`}>
      {children}
    </div>
  );
}

export function CardItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`transition-transform duration-200 ease-out hover:-translate-y-1 will-change-transform ${className ?? ""}`}>
      {children}
    </div>
  );
}
