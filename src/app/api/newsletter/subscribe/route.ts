import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { randomUUID } from "crypto";
import sendMail from "@/lib/sendMail";
import { confirmationEmail } from "@/lib/email-templates";

const BASE_URL =
  process.env.NEWSLETTER_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

// Simple email regex — catches most invalid inputs
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// In-memory IP rate limiter (resets on cold start — good enough for serverless)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 requests per window

function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (entry.resetAt <= now) rateLimitMap.delete(key);
  }
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  // Rate limiting (clean expired entries first)
  cleanupRateLimitMap();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: { email?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const email = body.email?.trim().toLowerCase();
  const name = (body.name ?? "").trim().slice(0, 100);

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "Please enter a valid email address" },
      { status: 400 }
    );
  }

  // Check if already subscribed
  const existing = await prisma.subscriber.findUnique({ where: { email } });
  if (existing && existing.subscribed && existing.confirmedAt) {
    return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
  }

  // Generate tokens
  const confirmToken = randomUUID();
  const unsubscribeToken = randomUUID();

  // Upsert subscriber
  await prisma.subscriber.upsert({
    where: { email },
    update: {
      name,
      confirmToken,
      unsubscribeToken,
      subscribed: false,
      confirmedAt: null,
    },
    create: { email, name, confirmToken, unsubscribeToken },
  });

  // Send confirmation email — wrapped separately so DB write isn't lost
  const confirmUrl = `${BASE_URL}/api/newsletter/confirm?token=${confirmToken}`;
  try {
    await sendMail({
      to: email,
      subject: "Confirm your Blessing newsletter subscription ✦",
      html: confirmationEmail({ name, confirmUrl }),
    });
  } catch (mailErr) {
    console.error("[newsletter/subscribe] Failed to send confirmation email:", mailErr);
    return NextResponse.json(
      { success: true, warning: "Subscribed but confirmation email could not be sent. Please try again." },
      { status: 202 }
    );
  }

  return NextResponse.json({ success: true });
}
