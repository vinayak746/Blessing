"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";
import { requireAuth } from "@/lib/auth-utils";

export type GoogleFormTriggerToken =Realtime.Token<
    typeof googleFormTriggerChannel,
    ["status"]
    >;

export async function fetchGoogleFormTriggerRealtimeToken(): Promise<GoogleFormTriggerToken> {
    await requireAuth();
    const token = await getSubscriptionToken(inngest, {
        channel: googleFormTriggerChannel(),
        topics: ["status"],
       
    });
    return token;
}