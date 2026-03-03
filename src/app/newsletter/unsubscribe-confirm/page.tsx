"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";

function UnsubscribeConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleUnsubscribe() {
    if (!token) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("done");
      // Redirect to final page after a beat
      setTimeout(() => router.push("/newsletter/unsubscribed"), 1500);
    } catch {
      setStatus("error");
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <p className="text-muted-foreground">Invalid or missing unsubscribe link.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <Link href="/" className="flex items-center gap-3 mb-10">
        <Image
          src="/logos/logo.png"
          alt="Blessing"
          width={48}
          height={48}
          className="rounded-xl"
        />
        <span className="font-bold text-2xl tracking-tight text-foreground">
          Blessing
        </span>
      </Link>

      <div className="bg-card border border-border rounded-2xl p-10 max-w-md w-full flex flex-col items-center gap-5 shadow-sm">
        {status === "done" ? (
          <>
            <span className="text-5xl">✅</span>
            <h1 className="text-2xl font-bold text-foreground">Unsubscribed</h1>
            <p className="text-muted-foreground text-sm">Redirecting…</p>
          </>
        ) : (
          <>
            <span className="text-5xl">📧</span>
            <h1 className="text-2xl font-bold text-foreground">
              Unsubscribe from Blessing?
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              You&apos;ll stop receiving newsletter emails. You can always
              re-subscribe from our homepage.
            </p>

            <button
              onClick={handleUnsubscribe}
              disabled={status === "loading"}
              className="mt-2 bg-[#1a1408] dark:bg-primary text-[#fdfaf3] dark:text-primary-foreground font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-[#8B5A2B] dark:hover:bg-[#c4a030] transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "Unsubscribing…" : "Yes, unsubscribe me"}
            </button>

            {status === "error" && (
              <p className="text-sm text-red-500">
                Something went wrong. Please try again.
              </p>
            )}

            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Never mind, take me back
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribeConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <UnsubscribeConfirmContent />
    </Suspense>
  );
}
