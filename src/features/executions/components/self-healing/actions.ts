"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { selfHealingChannel } from "@/inngest/channels/self-healing";

export type SelfHealingToken = Realtime.Token<
  typeof selfHealingChannel,
  ["status"]
>;

export async function fetchSelfHealingRealtimeToken(): Promise<SelfHealingToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: selfHealingChannel(),
    topics: ["status"],
  });
  return token;
}
