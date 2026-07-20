"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { anthropicChannel } from "@/inngest/channels/anthropic";
import { requireAuth } from "@/lib/auth-utils";

export type AnthropicToken =Realtime.Token<
    typeof anthropicChannel,
    ["status"]
    >;

export async function fetchAnthropicRealtimeToken(): Promise<AnthropicToken> {
    await requireAuth();
    const token = await getSubscriptionToken(inngest, {
        channel: anthropicChannel(),
        topics: ["status"],
       
    });
    return token;
}