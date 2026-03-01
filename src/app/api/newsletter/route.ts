import { NextRequest, NextResponse } from "next/server";
import sendMail from "@/lib/sendMail";

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html, appName } = await req.json();
    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const messageId = await sendMail({ to, subject, html, appName });
    return NextResponse.json({ success: true, messageId });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to send mail" }, { status: 500 });
  }
}
