import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import { decode } from "html-entities";
import { whatsappChannel } from "@/inngest/channels/whatsapp";
import ky from "ky";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);
  return safeString;
});

type WhatsAppData = {
  variableName?: string;
  credentialId?: string;
  recipientPhone?: string;
  content?: string;
};

type MetaWhatsAppResponse = {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
};

export const whatsappExecutor: NodeExecutor<WhatsAppData> = async ({
  data,
  nodeId,
  userId,
  context,
  step,
  publish,
}) => {
  await publish(
    whatsappChannel().status({
      nodeId,
      status: "loading",
    })
  );

  // Validate required fields
  if (!data.variableName) {
    await publish(
      whatsappChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("WhatsApp node: Variable name is required");
  }

  if (!data.credentialId) {
    await publish(
      whatsappChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("WhatsApp node: Credential is required");
  }

  if (!data.recipientPhone) {
    await publish(
      whatsappChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("WhatsApp node: Recipient phone number is required");
  }

  if (!data.content) {
    await publish(
      whatsappChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("WhatsApp node: Message content is required");
  }

  // Get credential from database
  const credential = await step.run("get-whatsapp-credential", async () => {
    const cred = await prisma.credential.findUnique({
      where: {
        id: data.credentialId,
        userId,
      },
    });
    return cred;
  });

  if (!credential) {
    await publish(
      whatsappChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("WhatsApp node: Credential not found");
  }

  // Decrypt and parse credential value (format: "phoneNumberId:accessToken")
  let decryptedValue: string;
  try {
    decryptedValue = decrypt(credential.value);
  } catch (err) {
    await publish(
      whatsappChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("WhatsApp node: Failed to decrypt credential");
  }

  const [phoneNumberId, accessToken] = decryptedValue.split(":");

  if (!phoneNumberId || !accessToken) {
    await publish(
      whatsappChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError(
      "WhatsApp node: Invalid credential format. Please recreate your WhatsApp credential."
    );
  }

  // Compile templates with context
  const rawContent = Handlebars.compile(data.content)(context);
  const content = decode(rawContent);
  const recipientPhone = decode(
    Handlebars.compile(data.recipientPhone)(context)
  );

  try {
    const result = await step.run("whatsapp-send-message", async () => {
      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

      const requestBody = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientPhone,
        type: "text",
        text: {
          preview_url: false,
          body: content,
        },
      };

      try {
        const response = await ky
          .post(url, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            json: requestBody,
          })
          .json<MetaWhatsAppResponse>();

        return {
          ...context,
          [data.variableName!]: {
            messageId: response.messages?.[0]?.id || null,
            recipientPhone: recipientPhone,
            messageContent: content,
            status: "sent",
          },
        };
      } catch (apiError: any) {
        throw apiError;
      }
    });

    await publish(
      whatsappChannel().status({
        nodeId,
        status: "success",
      })
    );

    return result;
  } catch (error) {
    await publish(
      whatsappChannel().status({
        nodeId,
        status: "error",
      })
    );

    if (error instanceof NonRetriableError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new NonRetriableError(
        `WhatsApp node: Failed to send message - ${error.message}`
      );
    }
    throw error;
  }
};