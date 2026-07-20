"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { discordChannel } from "@/inngest/channels/discord";
import { requireAuth } from "@/lib/auth-utils";

export type DiscordToken =Realtime.Token<
    typeof discordChannel,
    ["status"]
    >;

export async function fetchDiscordRealtimeToken(): Promise<DiscordToken> {
    await requireAuth();
    const token = await getSubscriptionToken(inngest, {
        channel: discordChannel(),
        topics: ["status"],
       
    });
    return token;
}