import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import sendMail from "@/lib/sendMail";
import { newsletterEmail, type TemplateData, type TemplateId } from "@/lib/email-templates";

const BASE_URL =
  process.env.NEWSLETTER_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

const VALID_TEMPLATE_IDS: TemplateId[] = [
  "new-feature",
  "new-integration",
  "tips-roundup",
  "product-update",
  "custom",
];

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { subject?: string; templateId?: string; data?: any };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { subject, templateId, data } = body;
    if (!subject || !templateId || !data) {
      return NextResponse.json(
        { error: "Missing subject, templateId, or data" },
        { status: 400 }
      );
    }

    if (!VALID_TEMPLATE_IDS.includes(templateId as TemplateId)) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );
    }

    const templateData: TemplateData = {
      templateId: templateId as TemplateId,
      data,
    } as TemplateData;

    // Get all confirmed subscribers
    const subscribers = await prisma.subscriber.findMany({
      where: {
        subscribed: true,
        confirmedAt: { not: null },
      },
      select: { id: true, email: true, name: true, unsubscribeToken: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: "No confirmed subscribers to send to" },
        { status: 400 }
      );
    }

    // Send branded email to each subscriber with personalized greeting
    let sentCount = 0;
    let failedCount = 0;

    await Promise.all(
      subscribers.map(async (s) => {
        const unsubscribeUrl = `${BASE_URL}/api/newsletter/unsubscribe?token=${s.unsubscribeToken}`;
        const fullHtml = newsletterEmail({
          name: s.name || "",
          subject,
          templateData,
          unsubscribeUrl,
        });

        try {
          await sendMail({ to: s.email, subject, html: fullHtml });
          sentCount++;
        } catch {
          failedCount++;
        }
      })
    );

    // Return only counts — never expose subscriber emails
    return NextResponse.json({ success: true, sent: sentCount, failed: failedCount });
  } catch (err) {
    console.error("[newsletter/send] Unhandled error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
