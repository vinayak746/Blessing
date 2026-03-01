"use client";

import { useState } from "react";

interface NewsletterSignupProps {
  dark?: boolean;
}

export default function NewsletterSignup({ dark = false }: NewsletterSignupProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to subscribe");
      setStatus("success");
      setEmail("");
      setName("");
    } catch (err: any) {
      setStatus("error");
      setError(err.message);
    }
  }

  if (status === "success") {
    return (
      <p className={`text-sm font-medium ${dark ? "text-[#d4af37]" : "text-[#8B5A2B]"}`}>
        ✓ Check your inbox to confirm your subscription!
      </p>
    );
  }

  const inputClass = dark
    ? "bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-[#d4af37]"
    : "bg-[#fffdf6] border border-[#e3d4aa] text-[#1a1408] placeholder:text-[#746641] focus:border-[#8B5A2B]";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
      <input
        type="text"
        placeholder="Your first name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors ${inputClass}`}
      />
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          placeholder="Enter your email address..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-colors ${inputClass}`}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={`shrink-0 px-6 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
            dark
              ? "bg-[#d4af37] text-[#1a1408] hover:bg-[#c4a030]"
              : "bg-[#1a1408] text-[#fdfaf3] hover:bg-[#8B5A2B]"
          }`}
        >
          {status === "loading" ? "Subscribing…" : "Subscribe →"}
        </button>
      </div>
      {status === "error" && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </form>
  );
}
