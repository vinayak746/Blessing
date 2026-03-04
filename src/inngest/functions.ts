import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import prisma from "@/lib/db";
import { topologicalSort } from "./utils";
import { ExecutionStatus, NodeType } from "@prisma/client";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { httpRequestChannel } from "./channels/http-request";
import { manualTriggerChannel } from "./channels/manual-trigger";
import { googleFormTriggerChannel } from "./channels/google-form-trigger";
import { stripeTriggerChannel } from "./channels/stripe-trigger";
import { geminiChannel } from "./channels/gemini";
import { openAiChannel } from "./channels/openai";
import { anthropicChannel } from "./channels/anthropic";
import { discordChannel } from "./channels/discord";
import { slackChannel } from "./channels/slack";
import { whatsappChannel } from "./channels/whatsapp";
import { selfHealingChannel } from "./channels/self-healing";
import { attemptHealing, type HealerConfig } from "./healing";

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    retries: process.env.NODE_ENV === "production" ? 3 : 0,
    onFailure: async ({ event, step }) => {
      await prisma.execution.update({
        where: { inngestEventId: event.data.event.id },
        data: {
          status: ExecutionStatus.FAILED,
          error: event.data.error.message,
          errorStack: event.data.error.stack,
        },
      });
    },
  },
  {
    event: "workflows/execute.workflow",
    channels: [
      httpRequestChannel(),
      manualTriggerChannel(),
      googleFormTriggerChannel(),
      stripeTriggerChannel(),
      geminiChannel(),
      openAiChannel(),
      anthropicChannel(),
      discordChannel(),
      slackChannel(),
      whatsappChannel(),
      selfHealingChannel(),
    ],
  },
  async ({ event, step, publish }) => {
    const inngestEventId = event.id;
    const workflowId = event.data.workflowId;

    if (!inngestEventId || !workflowId) {
      throw new NonRetriableError("Event ID or Workflow ID is missing");
    }

    await step.run("create-execution", async () => {
      return prisma.execution.create({
        data: {
          workflowId,
          inngestEventId,
        },
      });
    });

    const sortedNodes = await step.run("prepare-workflow", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: { nodes: true, connections: true },
      });

      return topologicalSort(workflow.nodes, workflow.connections);
    });
    const userId = await step.run("find-user-id", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        select: { userId: true },
      });
      return workflow.userId;
    });
    // Initialize the context with any Initial data from the trigger

    let context = event.data.initialData || {};

    // Build a map: targetNodeId → self-healing node config
    // This tells us which nodes have a self-healing parent protecting them.
    const healingMap = await step.run("build-healing-map", async () => {
      const selfHealingNodes = sortedNodes.filter(
        (n) => n.type === NodeType.SELF_HEALING
      );
      if (selfHealingNodes.length === 0) return {} as Record<string, { healerNodeId: string; healerConfig: HealerConfig }>;

      const healerIds = selfHealingNodes.map((n) => n.id);
      const connections = await prisma.connection.findMany({
        where: { fromNodeId: { in: healerIds } },
        select: { fromNodeId: true, toNodeId: true },
      });

      const configById = Object.fromEntries(
        selfHealingNodes.map((n) => [n.id, (n.data || {}) as HealerConfig])
      );

      const map: Record<string, { healerNodeId: string; healerConfig: HealerConfig }> = {};

      for (const conn of connections) {
        if (map[conn.toNodeId]) {
          throw new NonRetriableError(
            `Node ${conn.toNodeId} is protected by multiple self-healing nodes (${map[conn.toNodeId].healerNodeId} and ${conn.fromNodeId}). Each node may only have one self-healing parent.`
          );
        }
        map[conn.toNodeId] = {
          healerNodeId: conn.fromNodeId,
          healerConfig: configById[conn.fromNodeId],
        };
      }

      return map;
    });

    // Execute each node in topological order
    for (const node of sortedNodes) {
      // Self-healing nodes don't execute themselves — they only provide config
      // Their healing logic runs when their target node fails (below)
      if (node.type === NodeType.SELF_HEALING) {
        // Just publish success so the UI shows it's active
        await publish(
          selfHealingChannel().status({ nodeId: node.id, status: "success" })
        );
        continue;
      }

      const executor = getExecutor(node.type as NodeType);
      const healer = healingMap[node.id];

      if (!healer) {
        // No self-healing parent — run normally
        context = await executor({
          data: node.data as Record<string, unknown>,
          nodeId: node.id,
          userId,
          context,
          step,
          publish,
        });
        continue;
      }

      // --- This node is protected by a self-healing node ---
      // Try running the target. On failure, invoke the healing loop.
      let targetError: string | null = null;

      try {
        context = await executor({
          data: node.data as Record<string, unknown>,
          nodeId: node.id,
          userId,
          context,
          step,
          publish,
        });
      } catch (error) {
        targetError =
          error instanceof Error ? error.message : String(error);
      }

      if (targetError === null) {
        // Target succeeded on first try — nothing to heal
        continue;
      }

      // Target failed — engage the self-healing loop
      await publish(
        selfHealingChannel().status({
          nodeId: healer.healerNodeId,
          status: "healing",
        })
      );

      let result: Awaited<ReturnType<typeof attemptHealing>>;
      try {
        result = await attemptHealing({
          healerConfig: healer.healerConfig,
          targetNodeData: node.data as Record<string, unknown>,
          targetNodeId: node.id,
          targetExecutor: executor,
          initialError: targetError,
          userId,
          context,
          step,
          publish,
        });
      } catch (healingCrash) {
        await publish(
          selfHealingChannel().status({
            nodeId: healer.healerNodeId,
            status: "error",
          })
        );
        throw healingCrash;
      }

      if (result.healed) {
        context = result.context;
        // Merge healing metadata into context under the healer's variable name
        const varName = healer.healerConfig.variableName;
        if (varName) {
          const sanitizedLog = result.log.map(({ attempt, confidence, changes }) => ({
            attempt,
            confidence,
            hadChanges: Object.keys(changes).length > 0,
          }));
          const existing = typeof context[varName] === "object" && context[varName] !== null
            ? context[varName] as Record<string, unknown>
            : {};
          context[varName] = {
            ...existing,
            selfHealing: {
              healed: true,
              attempts: result.attempts,
              log: sanitizedLog,
            },
          };
        }
        await publish(
          selfHealingChannel().status({
            nodeId: healer.healerNodeId,
            status: "success",
          })
        );
      } else {
        // Healing failed — add metadata and publish error
        const varName = healer.healerConfig.variableName;
        if (varName) {
          const sanitizedLog = result.log.map(({ attempt, confidence, changes }) => ({
            attempt,
            confidence,
            hadChanges: Object.keys(changes).length > 0,
          }));
          const existing = typeof context[varName] === "object" && context[varName] !== null
            ? context[varName] as Record<string, unknown>
            : {};
          context[varName] = {
            ...existing,
            selfHealing: {
              healed: false,
              attempts: result.attempts,
              maxAttempts: result.maxAttempts,
              log: sanitizedLog,
            },
          };
        }
        await publish(
          selfHealingChannel().status({
            nodeId: healer.healerNodeId,
            status: "error",
          })
        );
        // Persist failure metadata before throwing so it's durable
        await step.run("persist-healing-failure", async () => {
          return prisma.execution.updateMany({
            where: { inngestEventId, workflowId },
            data: { output: context },
          });
        });
        // Healing failed — throw so the execution is marked FAILED
        throw new NonRetriableError(
          `Self-Healing failed after ${result.attempts}/${result.maxAttempts} attempts. ` +
          `Last error: ${result.log[result.log.length - 1]?.error || "Unknown error"}`
        );
      }
    }
    await step.run("update-execution", async () => {
      return prisma.execution.updateMany({
        where: {
          inngestEventId,
          workflowId,
        },
        data: {
          status: ExecutionStatus.SUCCESS,
          completedAt: new Date(),
          output: context,
        },
      });
    });
    return {
      workflowId,
      result: context,
    };
  }
);
