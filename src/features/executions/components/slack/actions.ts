"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { slackChannel } from "@/inngest/channels/slack";
import { requireAuth } from "@/lib/auth-utils";

export type SlackToken =Realtime.Token<
    typeof slackChannel,
    ["status"]
    >;

export async function fetchSlackRealtimeToken(): Promise<SlackToken> {
    await requireAuth();
    const token = await getSubscriptionToken(inngest, {
        channel: slackChannel(),
        topics: ["status"],
       
    });
    return token;
}