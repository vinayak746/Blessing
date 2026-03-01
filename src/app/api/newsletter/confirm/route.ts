import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { randomUUID } from "crypto";

const BASE_URL =
  process.env.NEWSLETTER_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { confirmToken: token },
    });

    if (!subscriber) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    if (subscriber.confirmedAt && subscriber.subscribed) {
      return NextResponse.redirect(
        new URL("/newsletter/confirmed", BASE_URL).toString()
      );
    }

    // Mark as confirmed and rotate the confirmToken so it cannot be replayed
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        confirmedAt: new Date(),
        subscribed: true,
        confirmToken: randomUUID(), // invalidate the used token
      },
    });

    return NextResponse.redirect(
      new URL("/newsletter/confirmed", BASE_URL).toString()
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
