import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const BASE_URL =
  process.env.NEWSLETTER_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

/**
 * GET — validate token and redirect to a confirmation page.
 * No state-changing side effects so browser prefetch is safe.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Missing or invalid token" },
      { status: 400 }
    );
  }

  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Invalid unsubscribe token" },
        { status: 400 }
      );
    }

    // Already unsubscribed — just redirect to the done page
    if (!subscriber.subscribed) {
      return NextResponse.redirect(
        new URL("/newsletter/unsubscribed", BASE_URL).toString()
      );
    }

    // Token is valid and user is subscribed — show confirmation UI
    return NextResponse.redirect(
      new URL(`/newsletter/unsubscribe-confirm?token=${token}`, BASE_URL).toString()
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

/**
 * POST — actually perform the unsubscribe mutation.
 * Requires explicit user action (form submit), not a simple GET/prefetch.
 */
export async function POST(req: NextRequest) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const token = body.token;
  if (!token || typeof token !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid token" },
      { status: 400 }
    );
  }

  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Invalid unsubscribe token" },
        { status: 400 }
      );
    }

    if (!subscriber.subscribed) {
      return NextResponse.json({ success: true, alreadyUnsubscribed: true });
    }

    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        subscribed: false,
        unsubscribeToken: crypto.randomUUID(), // rotate token to prevent replay
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
