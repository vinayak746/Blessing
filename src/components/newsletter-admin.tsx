"use client";

import { useState, useMemo } from "react";
import {
  NEWSLETTER_TEMPLATES,
  generateContentHtml,
  type TemplateId,
  type TemplateData,
  type NewFeatureData,
  type NewIntegrationData,
  type TipsRoundupData,
  type TipItem,
  type ProductUpdateData,
  type UpdateItem,
  type CustomData,
} from "@/lib/email-templates";

// ─── Default data per template ───────────────────────────────────────

const defaults = {
  "new-feature": (): NewFeatureData => ({
    featureName: "",
    description: "",
    benefits: ["", "", ""],
    ctaUrl: "",
  }),
  "new-integration": (): NewIntegrationData => ({
    appName: "",
    description: "",
    automations: ["", "", ""],
  }),
  "tips-roundup": (): TipsRoundupData => ({
    intro: "Here are some quick wins to supercharge your automations:",
    tips: [
      { title: "", description: "" },
      { title: "", description: "" },
      { title: "", description: "" },
    ],
  }),
  "product-update": (): ProductUpdateData => ({
    intro: "Here's everything we shipped recently:",
    updates: [
      { title: "", description: "" },
      { title: "", description: "" },
      { title: "", description: "" },
    ],
    comingSoon: "",
  }),
  custom: (): CustomData => ({
    heading: "",
    body: "",
    ctaText: "",
    ctaUrl: "",
  }),
};

// ─── Shared input styles ─────────────────────────────────────────────

const inputClass =
  "w-full border border-border bg-card px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50";
const labelClass = "text-sm font-medium text-foreground mb-1.5 block";
const sublabelClass = "text-xs text-muted-foreground mb-1 block";

// ─── Component ───────────────────────────────────────────────────────

export default function NewsletterAdmin() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("new-feature");
  const [subject, setSubject] = useState(NEWSLETTER_TEMPLATES[0].defaultSubject);
  const [templateDataMap, setTemplateDataMap] = useState<Record<TemplateId, any>>({
    "new-feature": defaults["new-feature"](),
    "new-integration": defaults["new-integration"](),
    "tips-roundup": defaults["tips-roundup"](),
    "product-update": defaults["product-update"](),
    custom: defaults.custom(),
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ sent?: number; failed?: number } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const currentData = templateDataMap[selectedTemplate];

  function updateData(patch: Record<string, any>) {
    setTemplateDataMap((prev) => ({
      ...prev,
      [selectedTemplate]: { ...prev[selectedTemplate], ...patch },
    }));
  }

  function handleTemplateChange(id: TemplateId) {
    setSelectedTemplate(id);
    const tpl = NEWSLETTER_TEMPLATES.find((t) => t.id === id);
    // Only pre-fill subject when the field is still on the previous template's default
    const currentDefault = NEWSLETTER_TEMPLATES.find((t) => t.id === selectedTemplate)?.defaultSubject;
    if (tpl?.defaultSubject && (!subject || subject === currentDefault)) {
      setSubject(tpl.defaultSubject);
    }
  }

  // Build template data for the generator
  const templatePayload: TemplateData = useMemo(() => {
    return { templateId: selectedTemplate, data: currentData } as TemplateData;
  }, [selectedTemplate, currentData]);

  // Generate preview HTML
  const previewHtml = useMemo(() => {
    try {
      return generateContentHtml(templatePayload);
    } catch {
      return "";
    }
  }, [templatePayload]);

  // Check if form has enough content to send
  const canSend = useMemo(() => {
    if (!subject.trim()) return false;
    switch (selectedTemplate) {
      case "new-feature":
        return !!(currentData as NewFeatureData).featureName.trim();
      case "new-integration":
        return !!(currentData as NewIntegrationData).appName.trim();
      case "tips-roundup":
        return (currentData as TipsRoundupData).tips.some((t: TipItem) => t.title.trim());
      case "product-update":
        return (currentData as ProductUpdateData).updates.some((u: UpdateItem) => u.title.trim());
      case "custom":
        return !!(currentData as CustomData).body.trim();
    }
  }, [selectedTemplate, currentData, subject]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    setStatus("loading");
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          templateId: selectedTemplate,
          data: currentData,
        }),
      });
      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned ${res.status} with no response body`);
      }
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setStatus("success");
      setResult(data);
    } catch (err: any) {
      setStatus("error");
      setError(err.message);
    }
  }

  function handleReset() {
    setSubject(NEWSLETTER_TEMPLATES.find((t) => t.id === selectedTemplate)?.defaultSubject || "");
    setTemplateDataMap((prev) => ({
      ...prev,
      [selectedTemplate]: defaults[selectedTemplate](),
    }));
    setStatus("idle");
    setResult(null);
    setError("");
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">📰 Newsletter Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick a template, fill in the fields, preview, and send.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* ─── Left: Compose ─── */}
        <div className="space-y-5">
          {/* Template picker */}
          <div>
            <label id="template-label" className={labelClass}>Template</label>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="template-label">
              {NEWSLETTER_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTemplateChange(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    selectedTemplate === t.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject-input" className={labelClass}>Subject Line</label>
            <input
              id="subject-input"
              type="text"
              required
              placeholder="e.g. New in Blessing: AI Nodes"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Dynamic fields per template */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedTemplate === "new-feature" && (
              <NewFeatureForm
                data={currentData as NewFeatureData}
                onChange={updateData}
              />
            )}
            {selectedTemplate === "new-integration" && (
              <NewIntegrationForm
                data={currentData as NewIntegrationData}
                onChange={updateData}
              />
            )}
            {selectedTemplate === "tips-roundup" && (
              <TipsRoundupForm
                data={currentData as TipsRoundupData}
                onChange={updateData}
              />
            )}
            {selectedTemplate === "product-update" && (
              <ProductUpdateForm
                data={currentData as ProductUpdateData}
                onChange={updateData}
              />
            )}
            {selectedTemplate === "custom" && (
              <CustomForm
                data={currentData as CustomData}
                onChange={updateData}
              />
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={status === "loading" || !canSend}
                className="flex-1 bg-foreground text-background px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Sending…" : "Send to All Subscribers"}
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-accent transition-colors lg:hidden"
              >
                {showPreview ? "Edit" : "Preview"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-accent transition-colors"
              >
                Reset
              </button>
            </div>
          </form>

          {/* Status */}
          {status === "success" && result && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                ✅ Sent to {result.sent} subscriber{result.sent !== 1 ? "s" : ""}
                {result.failed ? ` (${result.failed} failed)` : ""}
              </p>
            </div>
          )}
          {status === "error" && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                ❌ {error}
              </p>
            </div>
          )}
        </div>

        {/* ─── Right: Live Preview ─── */}
        <div className={`${showPreview ? "block" : "hidden"} lg:block`}>
          <label className={labelClass}>Live Preview</label>
          <div className="border border-border rounded-xl overflow-hidden bg-white sticky top-6">
            {previewHtml ? (
              <div>
                {/* Fake email chrome */}
                <div className="bg-card border-b border-border px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Subject:</strong>{" "}
                    {subject || "(empty)"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <strong className="text-foreground">To:</strong>{" "}
                    subscriber@example.com
                  </p>
                </div>
                {/* Plain email body */}
                <div className="px-6 py-8 overflow-auto max-h-[600px]">
                  <p className="text-[15px] leading-[1.7] text-[#1a1a1a] mb-4">Hey Subscriber,</p>
                  <div
                    className="text-[15px] leading-[1.7] text-[#1a1a1a] [&_p]:mb-4 [&_strong]:font-semibold [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                  <p className="text-[15px] leading-[1.7] text-[#1a1a1a] mt-4">— Blessing</p>

                  {/* Footer */}
                  <div className="border-t border-[#e5e5e5] mt-8 pt-6">
                    <p className="text-xs text-[#999]">
                      You&apos;re receiving this because you subscribed to Blessing updates.
                    </p>
                    <p className="text-xs text-[#999] underline mt-1 cursor-default">
                      Unsubscribe
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                Fill in the fields to see a preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template-specific forms ─────────────────────────────────────────

function NewFeatureForm({
  data,
  onChange,
}: {
  data: NewFeatureData;
  onChange: (p: Partial<NewFeatureData>) => void;
}) {
  return (
    <div className="space-y-3 border border-border rounded-xl p-4 bg-card/50">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">🚀 New Feature Details</p>

      <div>
        <label className={sublabelClass}>Feature Name *</label>
        <input
          type="text"
          placeholder="e.g. AI Nodes"
          value={data.featureName}
          onChange={(e) => onChange({ featureName: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label className={sublabelClass}>Description</label>
        <textarea
          placeholder="What is this feature and why should users care?"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className={`${inputClass} min-h-[80px] resize-y`}
        />
      </div>

      <div>
        <label className={sublabelClass}>Key Benefits</label>
        {data.benefits.map((b: string, i: number) => (
          <input
            key={`benefit-${i}`}
            type="text"
            placeholder={`Benefit ${i + 1}`}
            aria-label={`Benefit ${i + 1}`}
            value={b}
            onChange={(e) => {
              const next = [...data.benefits];
              next[i] = e.target.value;
              onChange({ benefits: next });
            }}
            className={`${inputClass} mb-2`}
          />
        ))}
        {data.benefits.length < 5 && (
          <button
            type="button"
            onClick={() => onChange({ benefits: [...data.benefits, ""] })}
            className="text-xs text-primary hover:underline"
          >
            + Add another benefit
          </button>
        )}
      </div>

      <div>
        <label className={sublabelClass}>CTA Link (optional)</label>
        <input
          type="url"
          placeholder="https://blessing.app/workflows"
          value={data.ctaUrl || ""}
          onChange={(e) => onChange({ ctaUrl: e.target.value })}
          className={inputClass}
        />
      </div>
    </div>
  );
}

function NewIntegrationForm({
  data,
  onChange,
}: {
  data: NewIntegrationData;
  onChange: (p: Partial<NewIntegrationData>) => void;
}) {
  return (
    <div className="space-y-3 border border-border rounded-xl p-4 bg-card/50">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">🔌 Integration Details</p>

      <div>
        <label className={sublabelClass}>App / Service Name *</label>
        <input
          type="text"
          placeholder="e.g. Slack, Notion, Google Sheets"
          value={data.appName}
          onChange={(e) => onChange({ appName: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label className={sublabelClass}>Description</label>
        <textarea
          placeholder="You can now connect [App] to your Blessing workflows..."
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className={`${inputClass} min-h-[80px] resize-y`}
        />
      </div>

      <div>
        <label className={sublabelClass}>What Users Can Automate</label>
        {data.automations.map((a: string, i: number) => (
          <input
            key={`automation-${i}`}
            type="text"
            placeholder={`Automation example ${i + 1}`}
            aria-label={`Automation example ${i + 1}`}
            value={a}
            onChange={(e) => {
              const next = [...data.automations];
              next[i] = e.target.value;
              onChange({ automations: next });
            }}
            className={`${inputClass} mb-2`}
          />
        ))}
        {data.automations.length < 5 && (
          <button
            type="button"
            onClick={() => onChange({ automations: [...data.automations, ""] })}
            className="text-xs text-primary hover:underline"
          >
            + Add another example
          </button>
        )}
      </div>
    </div>
  );
}

function TipsRoundupForm({
  data,
  onChange,
}: {
  data: TipsRoundupData;
  onChange: (p: Partial<TipsRoundupData>) => void;
}) {
  function updateTip(i: number, patch: Partial<TipItem>) {
    const next = data.tips.map((t, idx) => (idx === i ? { ...t, ...patch } : t));
    onChange({ tips: next });
  }

  return (
    <div className="space-y-3 border border-border rounded-xl p-4 bg-card/50">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">💡 Tips</p>

      <div>
        <label className={sublabelClass}>Intro Text</label>
        <input
          type="text"
          value={data.intro}
          onChange={(e) => onChange({ intro: e.target.value })}
          className={inputClass}
        />
      </div>

      {data.tips.map((tip, i) => (
        <div key={`tip-${i}`} className="bg-background rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Tip {i + 1}</p>
          <input
            type="text"
            placeholder="Tip title"
            value={tip.title}
            onChange={(e) => updateTip(i, { title: e.target.value })}
            className={inputClass}
          />
          <textarea
            placeholder="Brief explanation (1–2 sentences)"
            value={tip.description}
            onChange={(e) => updateTip(i, { description: e.target.value })}
            className={`${inputClass} min-h-[60px] resize-y`}
          />
        </div>
      ))}
      {data.tips.length < 5 && (
        <button
          type="button"
          onClick={() =>
            onChange({ tips: [...data.tips, { title: "", description: "" }] })
          }
          className="text-xs text-primary hover:underline"
        >
          + Add another tip
        </button>
      )}
    </div>
  );
}

function ProductUpdateForm({
  data,
  onChange,
}: {
  data: ProductUpdateData;
  onChange: (p: Partial<ProductUpdateData>) => void;
}) {
  function updateItem(i: number, patch: Partial<UpdateItem>) {
    const next = data.updates.map((u, idx) =>
      idx === i ? { ...u, ...patch } : u
    );
    onChange({ updates: next });
  }

  return (
    <div className="space-y-3 border border-border rounded-xl p-4 bg-card/50">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">📦 Updates</p>

      <div>
        <label className={sublabelClass}>Intro Text</label>
        <input
          type="text"
          value={data.intro}
          onChange={(e) => onChange({ intro: e.target.value })}
          className={inputClass}
        />
      </div>

      {data.updates.map((u, i) => (
        <div key={`update-${i}`} className="bg-background rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Update {i + 1}</p>
          <input
            type="text"
            placeholder="What shipped?"
            value={u.title}
            onChange={(e) => updateItem(i, { title: e.target.value })}
            className={inputClass}
          />
          <textarea
            placeholder="Brief description"
            value={u.description}
            onChange={(e) => updateItem(i, { description: e.target.value })}
            className={`${inputClass} min-h-[60px] resize-y`}
          />
        </div>
      ))}
      {data.updates.length < 6 && (
        <button
          type="button"
          onClick={() =>
            onChange({
              updates: [...data.updates, { title: "", description: "" }],
            })
          }
          className="text-xs text-primary hover:underline"
        >
          + Add another update
        </button>
      )}

      <div>
        <label className={sublabelClass}>🔜 Coming Soon (optional)</label>
        <textarea
          placeholder="Tease what's next..."
          value={data.comingSoon}
          onChange={(e) => onChange({ comingSoon: e.target.value })}
          className={`${inputClass} min-h-[60px] resize-y`}
        />
      </div>
    </div>
  );
}

function CustomForm({
  data,
  onChange,
}: {
  data: CustomData;
  onChange: (p: Partial<CustomData>) => void;
}) {
  return (
    <div className="space-y-3 border border-border rounded-xl p-4 bg-card/50">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">✍️ Custom Email</p>

      <div>
        <label className={sublabelClass}>Heading (optional)</label>
        <input
          type="text"
          placeholder="e.g. A Quick Note from Us"
          value={data.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label className={sublabelClass}>Body *</label>
        <textarea
          placeholder="Write your message here. Use blank lines to separate paragraphs."
          value={data.body}
          onChange={(e) => onChange({ body: e.target.value })}
          className={`${inputClass} min-h-[160px] resize-y`}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Separate paragraphs with a blank line. No HTML needed.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={sublabelClass}>Button Text (optional)</label>
          <input
            type="text"
            placeholder="e.g. Learn More"
            value={data.ctaText || ""}
            onChange={(e) => onChange({ ctaText: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={sublabelClass}>Button Link</label>
          <input
            type="url"
            placeholder="https://..."
            value={data.ctaUrl || ""}
            onChange={(e) => onChange({ ctaUrl: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
