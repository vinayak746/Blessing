import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const BASE_URL =
  process.env.NEWSLETTER_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

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
      return NextResponse.redirect(
        new URL("/newsletter/unsubscribed", BASE_URL).toString()
      );
    }

    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        subscribed: false,
        unsubscribeToken: crypto.randomUUID(), // rotate token to prevent replay
      },
    });

    return NextResponse.redirect(
      new URL("/newsletter/unsubscribed", BASE_URL).toString()
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
