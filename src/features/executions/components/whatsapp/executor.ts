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
  console.log("🟢 WhatsApp Executor Started");
  console.log("📦 Node Data:", JSON.stringify(data, null, 2));

  await publish(
    whatsappChannel().status({
      nodeId,
      status: "loading",
    })
  );

  // Validate required fields
  if (!data.variableName) {
    console.log("❌ Variable name missing");
    await publish(
      whatsappChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("WhatsApp node: Variable name is required");
  }

  if (!data.credentialId) {
    console.log("❌ Credential ID missing");
    await publish(
      whatsappChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("WhatsApp node: Credential is required");
  }

  if (!data.recipientPhone) {
    console.log("❌ Recipient phone missing");
    await publish(
      whatsappChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("WhatsApp node: Recipient phone number is required");
  }

  if (!data.content) {
    console.log("❌ Content missing");
    await publish(
      whatsappChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("WhatsApp node: Message content is required");
  }

  console.log("✅ All required fields present");

  // Get credential from database
  const credential = await step.run("get-whatsapp-credential", async () => {
    console.log("🔍 Fetching credential:", data.credentialId);
    const cred = await prisma.credential.findUnique({
      where: {
        id: data.credentialId,
        userId,
      },
    });
    console.log("📄 Credential found:", !!cred);
    return cred;
  });

  if (!credential) {
    console.log("❌ Credential not found in database");
    await publish(
      whatsappChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("WhatsApp node: Credential not found");
  }

  // Decrypt and parse credential value (format: "phoneNumberId:accessToken")
  console.log("🔐 Decrypting credential...");
  let decryptedValue: string;
  try {
    decryptedValue = decrypt(credential.value);
    console.log("✅ Decryption successful");
  } catch (err) {
    console.log("❌ Decryption failed:", err);
    await publish(
      whatsappChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("WhatsApp node: Failed to decrypt credential");
  }

  const [phoneNumberId, accessToken] = decryptedValue.split(":");
  console.log("📱 Phone Number ID:", phoneNumberId ? "✅ Present" : "❌ Missing");
  console.log("🔑 Access Token:", accessToken ? "✅ Present" : "❌ Missing");

  if (!phoneNumberId || !accessToken) {
    console.log("❌ Invalid credential format");
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

  console.log("📤 Sending to:", recipientPhone);
  console.log("💬 Message:", content.substring(0, 50) + "...");

  try {
    const result = await step.run("whatsapp-send-message", async () => {
      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
      console.log("🌐 API URL:", url);

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
      console.log("📨 Request body:", JSON.stringify(requestBody, null, 2));

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

        console.log("✅ API Response:", JSON.stringify(response, null, 2));

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
        console.log("❌ API Error:", apiError.message);
        if (apiError.response) {
          const errorBody = await apiError.response.text();
          console.log("❌ API Error Body:", errorBody);
        }
        throw apiError;
      }
    });

    await publish(
      whatsappChannel().status({
        nodeId,
        status: "success",
      })
    );

    console.log("🎉 WhatsApp message sent successfully!");
    return result;
  } catch (error) {
    console.log("❌ Final error:", error);
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