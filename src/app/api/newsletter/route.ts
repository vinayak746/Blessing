import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import sendMail from "@/lib/sendMail";

export async function POST(req: NextRequest) {
  try {
    // Auth guard — only the admin can use this generic send endpoint
    const session = await auth.api.getSession({ headers: await headers() });
    if (
      !session ||
      !process.env.ADMIN_EMAIL ||
      session.user?.email !== process.env.ADMIN_EMAIL
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to, subject, html, appName } = await req.json();
    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const messageId = await sendMail({ to, subject, html, appName });
    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    console.error("[api/newsletter] Send error:", error);
    return NextResponse.json({ error: "Failed to send mail" }, { status: 500 });
  }
}
