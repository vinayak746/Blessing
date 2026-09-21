import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import { decode } from "html-entities";
import { discordChannel } from "@/inngest/channels/discord";
import ky from "ky";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);

  return safeString;
});

type DiscordData = {
  variableName?: string;
  webhookUrl?: string;
  content?: string;
  username?: string;
};

export const discordExecutor: NodeExecutor<DiscordData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    discordChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.content) {
    await publish(
      discordChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Discord node: Content is missing");
  }

  const rawContent = Handlebars.compile(data.content)(context);
  const content = decode(rawContent).trim();
  const compiledUsername = data.username
    ? decode(Handlebars.compile(data.username)(context)).trim()
    : undefined;
  const username = compiledUsername && compiledUsername.length > 0 ? compiledUsername : undefined;

  try {
    const result = await step.run("discord-webhook", async () => {
      if (!data.webhookUrl) {
        await publish(
          discordChannel().status({
            nodeId,
            status: "error",
          })
        );
        throw new NonRetriableError("Discord node: Webhook URL is required");
      }

      const payload: Record<string, string> = {
        content: (content.length > 0 ? content : "(no content)").slice(0, 2000),
      };

      if (username) {
        payload.username = username.slice(0, 80);
      }

      try {
        await ky.post(data.webhookUrl!, {
          json: payload,
        });
      } catch (err: any) {
        let errDetails = err.message;
        if (err.response) {
          try {
            const body = await err.response.text();
            errDetails = `${err.message}: ${body}`;
          } catch {}
        }
        throw new NonRetriableError(`Discord webhook failed: ${errDetails}`);
      }

      if (!data.variableName) {
        await publish(
          discordChannel().status({
            nodeId,
            status: "error",
          })
        );
        throw new NonRetriableError("Discord node: Variable name is missing");
      }

      return {
        ...context,
        [data.variableName!]: {
          messageContent: content.slice(0, 2000),
        },
      };
    });

    await publish(
      discordChannel().status({
        nodeId,
        status: "success",
      })
    );

    return result;
  } catch (error) {
    await publish(
      discordChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw error;
  }
};
