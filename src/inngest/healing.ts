import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { CredentialType } from "@prisma/client";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import type { NodeExecutor, WorkflowContext } from "@/features/executions/types";
import type { Realtime } from "@inngest/realtime";

// ---------------------------------------------------------------------------
// AI Provider config
// ---------------------------------------------------------------------------

const AI_PROVIDER_CONFIG = {
  OPENAI: {
    credentialType: CredentialType.OPENAI,
    createClient: (apiKey: string) => createOpenAI({ apiKey }),
    model: "gpt-4o-mini",
  },
  ANTHROPIC: {
    credentialType: CredentialType.ANTHROPIC,
    createClient: (apiKey: string) => createAnthropic({ apiKey }),
    model: "claude-3-5-sonnet-20241022",
  },
  GEMINI: {
    credentialType: CredentialType.GEMINI,
    createClient: (apiKey: string) => createGoogleGenerativeAI({ apiKey }),
    model: "gemini-flash-latest",
  },
} as const;

type AiProvider = keyof typeof AI_PROVIDER_CONFIG;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type HealerConfig = {
  variableName?: string;
  credentialId?: string;
  aiProvider?: string;
  maxAttempts?: number;
  allowModifyBody?: boolean;
  allowModifyEndpoint?: boolean;
  allowModifyPrompt?: boolean;
  allowModifyHeaders?: boolean;
  healingInstructions?: string;
};

export interface HealingLogEntry {
  attempt: number;
  error: string;
  changes: Record<string, unknown>;
  analysis: string;
  confidence: string;
}

export interface HealingResult {
  healed: boolean;
  context: WorkflowContext;
  attempts: number;
  maxAttempts: number;
  log: HealingLogEntry[];
}

// ---------------------------------------------------------------------------
// Step-name prefix proxy  (fixes Inngest step memoization on retries)
// ---------------------------------------------------------------------------
// Inngest memoizes step results by name within a single function run.
// If step.run("http-request") failed, calling it again returns the cached
// failure instead of re-executing.  By prefixing step names per healing
// attempt (e.g. "heal-1-http-request"), each retry gets a FRESH execution.
// ---------------------------------------------------------------------------

function createPrefixedStep(step: any, prefix: string): any {
  return {
    ...step,
    run: (name: string, fn: any) => step.run(`${prefix}${name}`, fn),
    sleep: (name: string, ...args: any[]) =>
      step.sleep(`${prefix}${name}`, ...args),
    ai: step.ai
      ? {
          ...step.ai,
          wrap: (name: string, ...args: any[]) =>
            step.ai.wrap(`${prefix}${name}`, ...args),
        }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Deep-redact sensitive values before sending node data to AI providers
// ---------------------------------------------------------------------------

const SENSITIVE_KEY_PATTERN =
  /credential|secret|token|password|authorization|apikey|api_key|auth|private/i;

const SENSITIVE_VALUE_PATTERN =
  /^(Bearer |Basic |sk-|ghp_|gho_|xox[bpas]-|eyJ)/;

const REDACTED = "[REDACTED]";

function redactSensitiveFields(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveFields(item));
  }

  if (typeof obj === "object") {
    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        record[key] = REDACTED;
      } else if (
        typeof record[key] === "string" &&
        SENSITIVE_VALUE_PATTERN.test(record[key] as string)
      ) {
        record[key] = REDACTED;
      } else {
        record[key] = redactSensitiveFields(record[key]);
      }
    }
    return record;
  }

  return obj;
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function buildSystemPrompt(config: HealerConfig): string {
  const allowed: string[] = [];
  if (config.allowModifyBody) allowed.push("body");
  if (config.allowModifyEndpoint) allowed.push("endpoint");
  if (config.allowModifyPrompt) allowed.push("systemPrompt", "userPrompt");
  if (config.allowModifyHeaders) allowed.push("headers");

  return `You are a workflow self-healing agent. A node in an automated workflow has failed.
Your job is to analyze the error and suggest modifications to the node's configuration to fix it.

CRITICAL SECURITY RULES:
- You may ONLY suggest changes to these fields: ${allowed.length > 0 ? allowed.join(", ") : "NONE (read-only analysis only)"}
- NEVER suggest changes to credentials, API keys, tokens, or authentication data
- NEVER include sensitive data in your analysis
- If you cannot fix the error with the allowed fields, say so clearly

You MUST respond with valid JSON in this exact format:
{
  "analysis": "Brief explanation of what went wrong",
  "canFix": true/false,
  "suggestedChanges": { "fieldName": "newValue" },
  "confidence": "high" | "medium" | "low",
  "explanation": "What the change does and why it should fix the issue"
}

If canFix is false, suggestedChanges should be an empty object {}.
Only include fields in suggestedChanges that you are ALLOWED to modify.
Do NOT wrap your response in markdown code fences.`;
}

function buildUserPrompt(
  error: string,
  nodeData: Record<string, unknown>,
  ctx: WorkflowContext,
  healingInstructions?: string,
  previousAttempts?: Array<{
    attempt: number;
    error: string;
    changes: Record<string, unknown>;
  }>
): string {
  // Deep-redact sensitive fields before sending to AI
  const safe = redactSensitiveFields(structuredClone(nodeData));

  let prompt = `The following workflow node failed with this error:

ERROR: ${error}

NODE CONFIGURATION:
${JSON.stringify(safe, null, 2)}

CURRENT WORKFLOW CONTEXT (available variables):
${JSON.stringify(Object.keys(ctx), null, 2)}`;

  if (previousAttempts && previousAttempts.length > 0) {
    prompt += `\n\nPREVIOUS HEALING ATTEMPTS THAT ALSO FAILED:
${JSON.stringify(previousAttempts, null, 2)}

Do NOT repeat the same changes. Try a different approach.`;
  }

  if (healingInstructions) {
    prompt += `\n\nADDITIONAL INSTRUCTIONS FROM USER:\n${healingInstructions}`;
  }

  return prompt;
}

// ---------------------------------------------------------------------------
// Security: only allow changes the user explicitly permitted
// ---------------------------------------------------------------------------

function filterAllowedChanges(
  suggested: Record<string, unknown>,
  config: HealerConfig
): Record<string, unknown> {
  const allowed = new Set<string>();
  if (config.allowModifyBody) allowed.add("body");
  if (config.allowModifyEndpoint) allowed.add("endpoint");
  if (config.allowModifyPrompt) {
    allowed.add("systemPrompt");
    allowed.add("userPrompt");
  }
  if (config.allowModifyHeaders) allowed.add("headers");

  const blocked = new Set([
    "credentialId",
    "credential",
    "apiKey",
    "token",
    "secret",
    "password",
    "variableName",
  ]);

  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(suggested)) {
    if (allowed.has(key) && !blocked.has(key)) {
      safe[key] = value;
    }
  }
  return safe;
}

// ---------------------------------------------------------------------------
// Core healing loop — called from the main execution loop in functions.ts
// ---------------------------------------------------------------------------

export async function attemptHealing({
  healerConfig,
  targetNodeData,
  targetNodeId,
  targetExecutor,
  initialError,
  userId,
  context,
  step,
  publish,
}: {
  healerConfig: HealerConfig;
  targetNodeData: Record<string, unknown>;
  targetNodeId: string;
  targetExecutor: NodeExecutor;
  initialError: string;
  userId: string;
  context: WorkflowContext;
  step: any;
  publish: Realtime.PublishFn;
}): Promise<HealingResult> {
  const maxAttempts = Math.min(Math.max(healerConfig.maxAttempts || 3, 1), 5);
  const provider = healerConfig.aiProvider as AiProvider | undefined;

  // --- Validate config ---
  if (
    !healerConfig.credentialId ||
    !provider ||
    !AI_PROVIDER_CONFIG[provider]
  ) {
    return {
      healed: false,
      context,
      attempts: 0,
      maxAttempts,
      log: [
        {
          attempt: 0,
          error:
            "Self-Healing not configured: missing AI provider or credential",
          changes: {},
          analysis: "Configuration error",
          confidence: "none",
        },
      ],
    };
  }

  // --- Fetch AI credential (in a step), then decrypt outside (matches
  //     the exact pattern the Gemini/Anthropic executors use) ---
  let decryptedKey: string;

  // Step 1: Fetch from DB — return ONLY the value string to minimize serialization
  const encryptedValue = await step.run(
    `get-healing-credential-${targetNodeId}`,
    () => {
      return prisma.credential
        .findUnique({
          where: { id: healerConfig.credentialId, userId },
          select: { value: true },
        })
        .then((cred) => {
          if (!cred) {
            throw new Error(
              `AI credential not found (id=${healerConfig.credentialId})`
            );
          }
          return cred.value;
        });
    }
  );

  // Step 2: Decrypt outside the step — exactly how Gemini/Anthropic executors do it
  try {
    decryptedKey = decrypt(encryptedValue);
  } catch (decryptError) {
    return {
      healed: false,
      context,
      attempts: 0,
      maxAttempts,
      log: [
        {
          attempt: 0,
          error: `Credential decryption failed: ${decryptError instanceof Error ? decryptError.message : String(decryptError)}. Value length: ${encryptedValue?.length ?? "null"}. Try deleting this credential and re-creating it.`,
          changes: {},
          analysis:
            "The AI credential exists but cannot be decrypted. This usually means the credential was created with a different encryption key. Delete it and create a new one.",
          confidence: "none",
        },
      ],
    };
  }

  const providerConfig = AI_PROVIDER_CONFIG[provider];
  const client = providerConfig.createClient(decryptedKey);

  const healingLog: HealingLogEntry[] = [];
  let currentNodeData = { ...targetNodeData };
  let currentError = initialError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // --- Ask AI for a fix ---
    const previousAttempts = healingLog.map((l) => ({
      attempt: l.attempt,
      error: l.error,
      changes: l.changes,
    }));

    let aiResponse: string;
    try {
      aiResponse = await step.run(
        `ai-healing-analysis-${targetNodeId}-${attempt}`,
        async () => {
          const { text } = await generateText({
            model: client(providerConfig.model) as any,
            system: buildSystemPrompt(healerConfig),
            prompt: buildUserPrompt(
              currentError,
              currentNodeData,
              context,
              healerConfig.healingInstructions,
              previousAttempts
            ),
            temperature: 0.1,
          });
          return text;
        }
      );
    } catch (aiError) {
      healingLog.push({
        attempt,
        error: currentError,
        changes: {},
        analysis: `AI analysis failed: ${aiError instanceof Error ? aiError.message : "unknown error"}`,
        confidence: "none",
      });
      continue;
    }

    // --- Parse AI response ---
    let suggestion: {
      analysis: string;
      canFix: boolean;
      suggestedChanges: Record<string, unknown>;
      confidence: string;
      explanation: string;
    };

    try {
      suggestion = JSON.parse(aiResponse);
    } catch {
      healingLog.push({
        attempt,
        error: currentError,
        changes: {},
        analysis:
          "AI returned invalid JSON — could not parse healing suggestion",
        confidence: "none",
      });
      continue;
    }

    if (!suggestion.canFix) {
      healingLog.push({
        attempt,
        error: currentError,
        changes: {},
        analysis:
          suggestion.analysis || "AI determined this error cannot be fixed",
        confidence: suggestion.confidence || "none",
      });
      break; // AI says it can't fix — stop trying
    }

    // --- Apply allowed changes only (security enforcement) ---
    const safeChanges = filterAllowedChanges(
      suggestion.suggestedChanges || {},
      healerConfig
    );

    healingLog.push({
      attempt,
      error: currentError,
      changes: safeChanges,
      analysis: suggestion.analysis || "No analysis provided",
      confidence: suggestion.confidence || "unknown",
    });

    if (Object.keys(safeChanges).length === 0) {
      continue; // AI suggested changes we aren't allowed to apply
    }

    currentNodeData = { ...currentNodeData, ...safeChanges };

    // Backoff between attempts (including first retry — this IS already a retry)
    if (attempt >= 1) {
      await step.sleep(`healing-backoff-${targetNodeId}-${attempt}`, `${attempt * 2}s`);
    }

    // --- Retry target with PREFIXED step names so Inngest doesn't return
    //     the cached failure from the original execution ---
    const prefixedStep = createPrefixedStep(step, `heal-${attempt}-${targetNodeId}-`);
    try {
      const result = await targetExecutor({
        data: currentNodeData,
        nodeId: targetNodeId,
        userId,
        context,
        step: prefixedStep,
        publish,
      });
      return {
        healed: true,
        context: result,
        attempts: attempt,
        maxAttempts,
        log: healingLog,
      };
    } catch (retryError) {
      currentError =
        retryError instanceof Error
          ? retryError.message
          : String(retryError);
    }
  }

  return {
    healed: false,
    context,
    attempts: healingLog.length,
    maxAttempts,
    log: healingLog,
  };
}
