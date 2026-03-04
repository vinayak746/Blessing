import type { NodeExecutor, WorkflowContext } from "@/features/executions/types";
import { selfHealingChannel } from "@/inngest/channels/self-healing";

/**
 * Self-Healing executor — lightweight pass-through.
 *
 * The actual healing logic lives in `src/inngest/healing.ts` and is invoked
 * from the main execution loop in `src/inngest/functions.ts`.
 *
 * This executor exists only because the executor registry requires one for
 * every node type. In practice the main loop skips it (SELF_HEALING nodes
 * get `continue`'d) so this code almost never runs, but if it does it
 * publishes "success" and passes context through unchanged.
 */

type SelfHealingData = {
  variableName?: string;
  credentialId?: string;
  aiProvider?: "OPENAI" | "ANTHROPIC" | "GEMINI";
  maxAttempts?: number;
  allowModifyBody?: boolean;
  allowModifyEndpoint?: boolean;
  allowModifyPrompt?: boolean;
  allowModifyHeaders?: boolean;
  healingInstructions?: string;
};

export const selfHealingExecutor: NodeExecutor<SelfHealingData> = async ({
  data,
  nodeId,
  context,
  publish,
}) => {
  // The main loop already handles this node type, but just in case:
  await publish(
    selfHealingChannel().status({ nodeId, status: "success" })
  );

  return context;
};
