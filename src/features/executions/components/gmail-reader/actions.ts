"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { gmailReaderChannel } from "@/inngest/channels/gmail-reader";
import { requireAuth } from "@/lib/auth-utils";

export type GmailReaderToken = Realtime.Token<
  typeof gmailReaderChannel,
  ["status"]
>;

export async function fetchGmailReaderRealtimeToken(): Promise<GmailReaderToken> {
  await requireAuth();
  const token = await getSubscriptionToken(inngest, {
    channel: gmailReaderChannel(),
    topics: ["status"],
  });
  return token;
}
