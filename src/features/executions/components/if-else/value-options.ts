import type { Edge, Node } from "@xyflow/react";

/**
 * Builds the "What do you want to check?" list for the IF / Else dialog, so
 * people can pick from plain-language choices instead of typing {{templates}}.
 *
 * It walks backwards from the IF node, collects every earlier step that
 * produces data, and offers that step's real fields (taken from what each
 * node's executor actually writes into the workflow data).
 */

export type ValueOption = {
  /** The template stored on the condition, e.g. {{ping.httpResponse.status}}. */
  value: string;
  /** Plain-language name shown to the user, e.g. "Status code". */
  label: string;
  /** Example of a typical value, used as the placeholder for the comparison. */
  example: string;
};

export type ValueGroup = {
  nodeId: string;
  /** e.g. "HTTP Request · ping" */
  title: string;
  options: ValueOption[];
};

export type UpstreamValues = {
  groups: ValueGroup[];
  /** Earlier steps that produce data but have no variable name yet, so they can't be offered. */
  unnamed: string[];
};

const NODE_TITLES: Record<string, string> = {
  HTTP_REQUEST: "HTTP Request",
  GEMINI: "Gemini",
  OPENAI: "OpenAI",
  ANTHROPIC: "Claude",
  GMAIL_READER: "Gmail Reader",
  DISCORD: "Discord",
  SLACK: "Slack",
  WHATSAPP: "WhatsApp",
  IF_ELSE: "Decision",
  GOOGLE_FORM_TRIGGER: "Google Form",
  STRIPE_TRIGGER: "Stripe",
};

type FieldSpec = { path: string; label: string; example: string };

/** Fields each node type exposes. `path` is relative to the node's variable. */
const FIELDS: Record<string, FieldSpec[]> = {
  HTTP_REQUEST: [
    { path: "httpResponse.status", label: "Status code", example: "200" },
    { path: "httpResponse.statusText", label: "Status text", example: "OK" },
    {
      path: "httpResponse.data",
      label: "Response content",
      example: "success",
    },
  ],
  GEMINI: [{ path: "text", label: "AI answer", example: "approved" }],
  OPENAI: [{ path: "text", label: "AI answer", example: "approved" }],
  ANTHROPIC: [{ path: "text", label: "AI answer", example: "approved" }],
  GMAIL_READER: [
    { path: "totalFetched", label: "Number of emails found", example: "0" },
    {
      path: "emails.0.subject",
      label: "First email: subject",
      example: "Invoice",
    },
    {
      path: "emails.0.from",
      label: "First email: sender address",
      example: "name@company.com",
    },
    {
      path: "emails.0.bodyText",
      label: "First email: message text",
      example: "urgent",
    },
    {
      path: "emails.0.attachments.0.textContent",
      label: "First email: text inside its first attachment",
      example: "Next.js",
    },
  ],
  DISCORD: [
    {
      path: "messageContent",
      label: "Message that was sent",
      example: "hello",
    },
  ],
  SLACK: [
    {
      path: "messageContent",
      label: "Message that was sent",
      example: "hello",
    },
  ],
  WHATSAPP: [
    {
      path: "messageContent",
      label: "Message that was sent",
      example: "hello",
    },
  ],
  IF_ELSE: [
    {
      path: "result",
      label: "Outcome of that decision (true or false)",
      example: "true",
    },
  ],
};

/** Triggers write to fixed names (not a user-chosen variable). */
const TRIGGER_FIELDS: Record<
  string,
  { variable: string; fields: FieldSpec[] }
> = {
  GOOGLE_FORM_TRIGGER: {
    variable: "googleForm",
    fields: [
      {
        path: "respondentEmail",
        label: "Respondent's email",
        example: "name@company.com",
      },
      { path: "formTitle", label: "Form title", example: "Job application" },
      { path: "timestamp", label: "Time submitted", example: "" },
    ],
  },
  STRIPE_TRIGGER: {
    variable: "stripe",
    fields: [
      {
        path: "eventType",
        label: "Event type",
        example: "payment_intent.succeeded",
      },
      { path: "eventId", label: "Event ID", example: "evt_123" },
      { path: "livemode", label: "Live mode (true or false)", example: "true" },
    ],
  },
};

const NO_DATA = new Set(["MANUAL_TRIGGER", "INITIAL", "SELF_HEALING"]);

const toOption = (variable: string, field: FieldSpec): ValueOption => ({
  value: `{{${variable}.${field.path}}}`,
  label: field.label,
  example: field.example,
});

const variableOf = (node: Node): string => {
  const raw = (node.data as { variableName?: unknown } | undefined)
    ?.variableName;
  return typeof raw === "string" ? raw.trim() : "";
};

export const getUpstreamValues = (
  nodes: Node[],
  edges: Edge[],
  nodeId: string,
): UpstreamValues => {
  const byId = new Map(nodes.map((node) => [node.id, node]));

  // Self-healing nodes are wired to the step they protect but pass no data.
  const dataEdges = edges.filter(
    (edge) => byId.get(edge.source)?.type !== "SELF_HEALING",
  );

  // Walk backwards, nearest step first.
  const order: string[] = [];
  const seen = new Set<string>([nodeId]);
  let frontier = [nodeId];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const current of frontier) {
      for (const edge of dataEdges) {
        if (edge.target !== current || seen.has(edge.source)) continue;
        seen.add(edge.source);
        order.push(edge.source);
        next.push(edge.source);
      }
    }
    frontier = next;
  }

  const groups: ValueGroup[] = [];
  const unnamed: string[] = [];

  for (const id of order) {
    const node = byId.get(id);
    if (!node || !node.type || NO_DATA.has(node.type)) continue;
    const title = NODE_TITLES[node.type] ?? node.type;

    const trigger = TRIGGER_FIELDS[node.type];
    if (trigger) {
      groups.push({
        nodeId: id,
        title,
        options: trigger.fields.map((field) =>
          toOption(trigger.variable, field),
        ),
      });
      continue;
    }

    const fields = FIELDS[node.type];
    if (!fields) continue;

    const variable = variableOf(node);
    if (!variable) {
      unnamed.push(title);
      continue;
    }
    groups.push({
      nodeId: id,
      title: `${title} · ${variable}`,
      options: fields.map((field) => toOption(variable, field)),
    });
  }

  return { groups, unnamed };
};

/** Finds the option for a stored template, if it came from the picker. */
export const findOption = (
  groups: ValueGroup[],
  value: string,
): ValueOption | undefined => {
  for (const group of groups) {
    const match = group.options.find((option) => option.value === value);
    if (match) return match;
  }
  return undefined;
};
