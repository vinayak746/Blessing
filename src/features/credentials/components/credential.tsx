"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  useCreateCredential,
  useUpdateCredential,
  useSuspenseCredential,
} from "../hooks/use-credentials";
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { useForm } from "react-hook-form";
import { CredentialType } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";

// Use z.nativeEnum for Prisma enums (NOT z.enum)
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(CredentialType),
  value: z.string().min(1, "API Key is required"),
  phoneNumberId: z.string().optional(),
}).refine((data) => {
  if (data.type === CredentialType.WHATSAPP) {
    return !!data.phoneNumberId && data.phoneNumberId.length > 0;
  }
  return true;
}, {
  message: "Phone Number ID is required for WhatsApp",
  path: ["phoneNumberId"],
});

type FormValues = z.infer<typeof formSchema>;

const credentialTypeOptions = [
  {
    value: CredentialType.OPENAI,
    label: "OpenAI",
    logo: "/logos/openai.svg",
  },
  {
    value: CredentialType.GEMINI,
    label: "Gemini",
    logo: "/logos/gemini.svg",
  },
  {
    value: CredentialType.ANTHROPIC,
    label: "Anthropic",
    logo: "/logos/anthropic.svg",
  },
  {
    value: CredentialType.WHATSAPP,
    label: "WhatsApp",
    logo: "/logos/whatsapp.svg",
  },
];

interface CredentialFormProps {
  initialData?: {
    id?: string;
    name?: string;
    type?: string;
    value?: string;
  };
}

export const CredentialForm = ({ initialData }: CredentialFormProps) => {
  const router = useRouter();
  const createCredential = useCreateCredential();
  const updateCredential = useUpdateCredential();
  const { handleError, modal } = useUpgradeModal();

  const isEdit = !!initialData?.id;

  // Parse WhatsApp credential if editing
  let initialPhoneNumberId = "";
  let initialValue = initialData?.value || "";
  
  if (initialData?.type === CredentialType.WHATSAPP && initialData?.value?.includes(":")) {
    const [phoneId, token] = initialData.value.split(":");
    initialPhoneNumberId = phoneId;
    initialValue = token;
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          name: initialData.name || "",
          type: (initialData.type as CredentialType) || CredentialType.OPENAI,
          value: initialValue,
          phoneNumberId: initialPhoneNumberId,
        }
      : {
          name: "",
          type: CredentialType.OPENAI,
          value: "",
          phoneNumberId: "",
        },
  });

  const watchType = form.watch("type");
  const isWhatsApp = watchType === CredentialType.WHATSAPP;

  const onSubmit = async (values: FormValues) => {
    // For WhatsApp, combine phoneNumberId and access token
    let finalValue = values.value;
    if (values.type === CredentialType.WHATSAPP && values.phoneNumberId) {
      finalValue = `${values.phoneNumberId}:${values.value}`;
    }

    const submitData = {
      name: values.name,
      type: values.type,
      value: finalValue,
    };

    if (isEdit && initialData?.id) {
      await updateCredential.mutateAsync({
        id: initialData.id,
        ...submitData,
      });
    } else {
      await createCredential.mutateAsync(submitData, {
        onSuccess: (data) => {
          router.push(`/credentials/${data.id}`);
        },
        onError: (error) => {
          handleError(error);
        },
      });
    }
  };

  return (
    <>
      {modal}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Credential" : "New Credential"}</CardTitle>
          <CardDescription>
            {isEdit
              ? "Update your API key or credential details"
              : "Add a new API key or credential to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My API Key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {credentialTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Image
                                src={option.logo}
                                alt={option.label}
                                width={20}
                                height={20}
                              />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* WhatsApp Setup Instructions */}
              {isWhatsApp && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <div className="text-sm font-medium">
                    How to get WhatsApp Business API credentials
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>
                      Go to{" "}
                      <a
                        href="https://developers.facebook.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline inline-flex items-center gap-1"
                      >
                        Meta for Developers
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
                    </li>
                    <li>Create a new app → Select "Business" type</li>
                    <li>Add "WhatsApp" product to your app</li>
                    <li>Go to WhatsApp → API Setup</li>
                    <li>Copy <strong>Phone Number ID</strong> from "From" section</li>
                    <li>Click <strong>Generate</strong> for temporary token (24hrs) or create System User for permanent token</li>
                    <li>Add test numbers in "To" section for sandbox mode</li>
                  </ol>
                  <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                    ⚠️ In sandbox mode, you can only message numbers you've added as test recipients.
                  </div>
                </div>
              )}

              {/* WhatsApp Phone Number ID Field */}
              {isWhatsApp && (
                <FormField
                  control={form.control}
                  name="phoneNumberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number ID</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789012345" {...field} />
                      </FormControl>
                      <FormDescription>
                        Your WhatsApp Business Phone Number ID (found in API Setup)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isWhatsApp ? "Access Token" : "API Key"}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={isWhatsApp ? "EAAxxxxxxx..." : "sk-..."} 
                        {...field} 
                      />
                    </FormControl>
                    {isWhatsApp && (
                      <FormDescription>
                        Generate this in Meta Developer Portal → WhatsApp → API Setup
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={
                    createCredential.isPending || updateCredential.isPending
                  }
                >
                  {isEdit ? "Update" : "Create"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/credentials" prefetch>
                    Cancel
                  </Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};

export const CredentialView = ({ credentialId }: { credentialId: string }) => {
  const { data: credential } = useSuspenseCredential(credentialId);

  return <CredentialForm initialData={credential} />;
};