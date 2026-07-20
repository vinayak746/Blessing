"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { geminiChannel } from "@/inngest/channels/gemini";
import { requireAuth } from "@/lib/auth-utils";

export type GeminiToken =Realtime.Token<
    typeof geminiChannel,
    ["status"]
    >;

export async function fetchGeminiRealtimeToken(): Promise<GeminiToken> {
    await requireAuth();
    const token = await getSubscriptionToken(inngest, {
        channel: geminiChannel(),
        topics: ["status"],
       
    });
    return token;
}