import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

// ─── Zod schemas per template ────────────────────────────────────────

const newFeatureSchema = z.object({
  featureName: z.string().min(1),
  description: z.string(),
  benefits: z.array(z.string()),
  ctaUrl: z.string().optional(),
});

const newIntegrationSchema = z.object({
  appName: z.string().min(1),
  description: z.string(),
  automations: z.array(z.string()),
});

const tipItemSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const tipsRoundupSchema = z.object({
  intro: z.string(),
  tips: z.array(tipItemSchema).min(1),
});

const updateItemSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const productUpdateSchema = z.object({
  intro: z.string(),
  updates: z.array(updateItemSchema).min(1),
  comingSoon: z.string(),
});

const customSchema = z.object({
  heading: z.string(),
  body: z.string(),
  ctaText: z.string().optional(),
  ctaUrl: z.string().optional(),
});

const templateDataSchemas: Record<TemplateId, z.ZodSchema> = {
  "new-feature": newFeatureSchema,
  "new-integration": newIntegrationSchema,
  "tips-roundup": tipsRoundupSchema,
  "product-update": productUpdateSchema,
  custom: customSchema,
};

const sendBodySchema = z.object({
  subject: z.string().min(1),
  templateId: z.enum(["new-feature", "new-integration", "tips-roundup", "product-update", "custom"]),
  data: z.record(z.string(), z.any()),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const parsed = sendBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Missing or invalid subject, templateId, or data" },
        { status: 400 }
      );
    }

    const { subject, templateId, data } = parsed.data;

    // Validate data shape against the template-specific schema
    const dataSchema = templateDataSchemas[templateId];
    const dataParsed = dataSchema.safeParse(data);
    if (!dataParsed.success) {
      return NextResponse.json(
        { error: "Invalid template data" },
        { status: 400 }
      );
    }

    const templateData: TemplateData = {
      templateId,
      data: dataParsed.data,
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
