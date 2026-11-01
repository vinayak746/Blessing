"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { ifElseChannel } from "@/inngest/channels/if-else";
import { requireAuth } from "@/lib/auth-utils";

export type IfElseToken = Realtime.Token<typeof ifElseChannel, ["status"]>;

export async function fetchIfElseRealtimeToken(): Promise<IfElseToken> {
  await requireAuth();
  const token = await getSubscriptionToken(inngest, {
    channel: ifElseChannel(),
    topics: ["status"],
  });
  return token;
}
