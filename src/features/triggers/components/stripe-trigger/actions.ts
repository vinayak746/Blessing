"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { stripeTriggerChannel } from "@/inngest/channels/stripe-trigger";
import { requireAuth } from "@/lib/auth-utils";

export type StripeTriggerToken =Realtime.Token<
    typeof stripeTriggerChannel,
    ["status"]
    >;

export async function fetchStripeTriggerRealtimeToken(): Promise<StripeTriggerToken> {
    await requireAuth();
    const token = await getSubscriptionToken(inngest, {
        channel: stripeTriggerChannel(),
        topics: ["status"],
       
    });
    return token;
}