import { channel, topic } from "@inngest/realtime";

export const SELF_HEALING_CHANNEL_NAME = "self-healing-execution";

export const selfHealingChannel = channel(SELF_HEALING_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error" | "healing";
  }>()
);
