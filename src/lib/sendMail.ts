import { Client, PublishToApiResponse } from "@upstash/qstash";

const QSTASH_TOKEN = process.env.QSTASH_TOKEN!;
const MAILER_URL = process.env.MAILER_URL!;

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  appName?: string;
}

const qstash = new Client({
  token: QSTASH_TOKEN,
});

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  appName?: string;
}

export interface MailResponseType {
  success: boolean;
  messageId: string;
  retries: number;
}

export default async function sendMail({
  to,
  subject,
  html,
  appName,
}: SendMailOptions): Promise<string> {
  const res: PublishToApiResponse = (await qstash.publishJSON<MailOptions>({
    url: `${MAILER_URL}/api/v1/send`,
    failureCallback: `${MAILER_URL}/api/v1/send-dlq`,
    body: {
      to,
      subject,
      html,
      appName,
    },
  })) as PublishToApiResponse;
  return res.messageId;
}
