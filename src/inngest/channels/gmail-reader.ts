import { channel, topic } from "@inngest/realtime";

export const GMAIL_READER_CHANNEL_NAME = "gmail-reader-execution";

export const gmailReaderChannel = channel(GMAIL_READER_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>()
);
