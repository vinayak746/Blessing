/**
 * Plain-text-style email templates for Blessing newsletter.
 *
 * Emails look like a real person wrote them — no banners, no buttons,
 * no colored backgrounds. Just clean text in a simple white email.
 */

function plainLayout(body: string, footer: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff">
    <tr><td style="padding:40px 24px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;text-align:left">
        <tr><td style="font-size:15px;line-height:1.7;color:#1a1a1a">
          ${body}
        </td></tr>
        <tr><td style="padding-top:32px;border-top:1px solid #e5e5e5;margin-top:32px">
          ${footer}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function esc(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToHtml(str: string) {
  return str
    .split(/\n{2,}/)
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">${esc(p.trim()).replace(/\n/g, "<br/>")}</p>`
    )
    .join("");
}

function safeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "#";
    return esc(parsed.href);
  } catch {
    return "#";
  }
}

function link(text: string, url: string) {
  return `<a href="${safeUrl(url)}" style="color:#1a1a1a;text-decoration:underline">${esc(text)}</a>`;
}

// ─── Confirmation Email ──────────────────────────────────────────────

const LOGO_BASE =
  process.env.NEWSLETTER_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

export function confirmationEmail(opts: {
  name: string;
  confirmUrl: string;
}) {
  const hi = opts.name ? esc(opts.name) : "there";
  const logoUrl = `${LOGO_BASE}/logos/logo.png`;
  const safeConfirmUrl = safeUrl(opts.confirmUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff">
    <tr><td style="padding:32px 24px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;text-align:left">

        <!-- Logo -->
        <tr><td style="padding-bottom:24px">
          <img src="${logoUrl}" alt="Blessing" width="110" style="display:block;height:auto;border:0" />
        </td></tr>

        <!-- Greeting -->
        <tr><td style="font-size:15px;line-height:1.7;color:#1a1a1a">
          <p style="margin:0 0 16px;font-size:17px;font-weight:600;color:#111">Hey ${hi}!</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#333">
            Thanks for subscribing to Blessing. Just one quick step — confirm your email to start receiving updates.
          </p>

          <!-- Button -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
            <tr><td style="background:#111;border-radius:6px">
              <a href="${safeConfirmUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none">Confirm my email</a>
            </td></tr>
          </table>

          <p style="margin:0 0 12px;font-size:13px;color:#888">Here's what you'll get:</p>
          <p style="margin:0 0 4px;font-size:14px;color:#333">⚡ New feature announcements</p>
          <p style="margin:0 0 4px;font-size:14px;color:#333">🔌 Integration updates</p>
          <p style="margin:0 0 0;font-size:14px;color:#333">💡 Workflow tips & tricks</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:28px;border-top:1px solid #eee;margin-top:28px">
          <p style="margin:0;font-size:12px;color:#aaa;line-height:1.5">
            If you didn't sign up, you can safely ignore this email.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Structured Template Types ───────────────────────────────────────

export type TemplateId =
  | "new-feature"
  | "new-integration"
  | "tips-roundup"
  | "product-update"
  | "custom";

export interface NewFeatureData {
  featureName: string;
  description: string;
  benefits: string[];
  ctaUrl?: string;
}

export interface NewIntegrationData {
  appName: string;
  description: string;
  automations: string[];
}

export interface TipItem {
  title: string;
  description: string;
}

export interface TipsRoundupData {
  intro: string;
  tips: TipItem[];
}

export interface UpdateItem {
  title: string;
  description: string;
}

export interface ProductUpdateData {
  intro: string;
  updates: UpdateItem[];
  comingSoon: string;
}

export interface CustomData {
  heading: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
}

export type TemplateData =
  | { templateId: "new-feature"; data: NewFeatureData }
  | { templateId: "new-integration"; data: NewIntegrationData }
  | { templateId: "tips-roundup"; data: TipsRoundupData }
  | { templateId: "product-update"; data: ProductUpdateData }
  | { templateId: "custom"; data: CustomData };

export interface TemplateConfig {
  id: TemplateId;
  label: string;
  emoji: string;
  defaultSubject: string;
}

export const NEWSLETTER_TEMPLATES: TemplateConfig[] = [
  { id: "new-feature", label: "New Feature", emoji: "🚀", defaultSubject: "New in Blessing" },
  { id: "new-integration", label: "New Integration", emoji: "🔌", defaultSubject: "New Integration on Blessing" },
  { id: "tips-roundup", label: "Tips Roundup", emoji: "💡", defaultSubject: "Workflow Tips You'll Wish You Knew Sooner" },
  { id: "product-update", label: "Product Update", emoji: "📦", defaultSubject: "What's New in Blessing" },
  { id: "custom", label: "Custom", emoji: "✍️", defaultSubject: "" },
];

// ─── Plain text generators per template ──────────────────────────────

function line(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">${text}</p>`;
}

function bold(text: string) {
  return `<strong>${esc(text)}</strong>`;
}

function generateNewFeatureText(d: NewFeatureData): string {
  const lines: string[] = [];

  lines.push(line(`We just shipped something new — ${bold(d.featureName)}.`));

  if (d.description) {
    lines.push(line(esc(d.description)));
  }

  const benefits = d.benefits.filter(Boolean);
  if (benefits.length) {
    lines.push(line("Here's what it does:"));
    lines.push(line(benefits.map((b) => `• ${esc(b)}`).join("<br/>")));
  }

  if (d.ctaUrl) {
    lines.push(line(`Try it out: ${link(d.ctaUrl, d.ctaUrl)}`));
  }

  return lines.join("\n");
}

function generateNewIntegrationText(d: NewIntegrationData): string {
  const lines: string[] = [];

  lines.push(line(`${bold(d.appName)} is now available on Blessing.`));

  if (d.description) {
    lines.push(line(esc(d.description)));
  }

  const autos = d.automations.filter(Boolean);
  if (autos.length) {
    lines.push(line("What you can automate:"));
    lines.push(line(autos.map((a) => `• ${esc(a)}`).join("<br/>")));
  }

  return lines.join("\n");
}

function generateTipsRoundupText(d: TipsRoundupData): string {
  const lines: string[] = [];

  if (d.intro) {
    lines.push(line(esc(d.intro)));
  }

  const tips = d.tips.filter((t) => t.title);
  tips.forEach((t, i) => {
    lines.push(line(`${bold(`${i + 1}. ${t.title}`)}<br/>${esc(t.description)}`));
  });

  return lines.join("\n");
}

function generateProductUpdateText(d: ProductUpdateData): string {
  const lines: string[] = [];

  if (d.intro) {
    lines.push(line(esc(d.intro)));
  }

  const updates = d.updates.filter((u) => u.title);
  updates.forEach((u) => {
    lines.push(line(`✅ ${bold(u.title)}<br/>${esc(u.description)}`));
  });

  if (d.comingSoon) {
    lines.push(line(`Coming soon: ${esc(d.comingSoon)}`));
  }

  return lines.join("\n");
}

function generateCustomText(d: CustomData): string {
  const lines: string[] = [];

  if (d.heading) {
    lines.push(line(bold(d.heading)));
  }

  if (d.body) {
    lines.push(textToHtml(d.body));
  }

  if (d.ctaText && d.ctaUrl) {
    lines.push(line(`${link(d.ctaText, d.ctaUrl)}`));
  }

  return lines.join("\n");
}

// ─── Main generators ─────────────────────────────────────────────────

/**
 * Generate the inner content from structured template data.
 * Returns minimal HTML that renders as clean plain text.
 */
export function generateContentHtml(template: TemplateData): string {
  switch (template.templateId) {
    case "new-feature":
      return generateNewFeatureText(template.data);
    case "new-integration":
      return generateNewIntegrationText(template.data);
    case "tips-roundup":
      return generateTipsRoundupText(template.data);
    case "product-update":
      return generateProductUpdateText(template.data);
    case "custom":
      return generateCustomText(template.data);
  }
}

/**
 * Generate a full, ready-to-send plain email from structured data.
 * Looks like a regular email someone typed — no branding, no buttons.
 */
export function newsletterEmail(opts: {
  name: string;
  subject: string;
  templateData: TemplateData;
  unsubscribeUrl: string;
}) {
  const hi = opts.name ? `Hey ${esc(opts.name)},` : "Hey,";
  const content = generateContentHtml(opts.templateData);
  const signoff = `<p style="margin:0 0 4px;font-size:15px;line-height:1.7;color:#1a1a1a">— Blessing</p>`;
  const safeUnsubscribeUrl = safeUrl(opts.unsubscribeUrl);

  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">${hi}</p>
    ${content}
    ${signoff}
  `;

  const footer = `
    <p style="margin:0;font-size:12px;line-height:1.6;color:#999">You're receiving this because you subscribed to Blessing updates.</p>
    <p style="margin:4px 0 0;font-size:12px;line-height:1.6"><a href="${safeUnsubscribeUrl}" style="color:#999;text-decoration:underline">Unsubscribe</a></p>
  `;

  return plainLayout(body, footer);
}
