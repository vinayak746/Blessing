"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import { CredentialType } from "@prisma/client";
import { ShieldAlertIcon } from "lucide-react";

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, { message: "Variable name is required" })
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message:
        "Must start with a letter or underscore, and contain only letters, numbers, and underscores",
    }),
  credentialId: z.string().min(1, "AI credential is required for healing"),
  aiProvider: z.enum(["OPENAI", "ANTHROPIC", "GEMINI"], {
    message: "Select which AI to use for healing analysis",
  }),
  maxAttempts: z.number().min(1).max(5),
  allowModifyBody: z.boolean(),
  allowModifyEndpoint: z.boolean(),
  allowModifyPrompt: z.boolean(),
  allowModifyHeaders: z.boolean(),
  healingInstructions: z.string().optional(),
});

export type SelfHealingFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SelfHealingFormValues) => void;
  defaultValues?: Partial<SelfHealingFormValues>;
}

const providerToCredentialType: Record<string, CredentialType> = {
  OPENAI: CredentialType.OPENAI,
  ANTHROPIC: CredentialType.ANTHROPIC,
  GEMINI: CredentialType.GEMINI,
};

const providerLogos: Record<string, string> = {
  OPENAI: "/logos/openai.svg",
  ANTHROPIC: "/logos/anthropic.svg",
  GEMINI: "/logos/gemini.svg",
};

export const PROVIDER_LABELS: Record<string, string> = {
  OPENAI: "GPT-4o mini",
  ANTHROPIC: "Claude 3.5",
  GEMINI: "Gemini 2.0",
};

function normalizeSelfHealingDefaults(
  vals: Partial<SelfHealingFormValues>
): SelfHealingFormValues {
  return {
    variableName: vals.variableName || "",
    credentialId: vals.credentialId || "",
    aiProvider: vals.aiProvider || "OPENAI",
    maxAttempts: vals.maxAttempts || 3,
    allowModifyBody: vals.allowModifyBody ?? true,
    allowModifyEndpoint: vals.allowModifyEndpoint ?? false,
    allowModifyPrompt: vals.allowModifyPrompt ?? true,
    allowModifyHeaders: vals.allowModifyHeaders ?? false,
    healingInstructions: vals.healingInstructions || "",
  };
}

export const SelfHealingDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const form = useForm<SelfHealingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: normalizeSelfHealingDefaults(defaultValues),
  });

  useEffect(() => {
    if (open) {
      const normalized = normalizeSelfHealingDefaults(defaultValues);
      form.reset(normalized);
      // Sync the ref so the provider-change guard below doesn't
      // see the reset as a "change" and clear the credential.
      prevProvider.current = normalized.aiProvider;
    }
  }, [open, defaultValues, form]);

  const watchProvider = form.watch("aiProvider");
  const credentialType = providerToCredentialType[watchProvider] || CredentialType.OPENAI;

  const { data: credentials, isLoading: isLoadingCredentials } =
    useCredentialsByType(credentialType);

  // Reset credential only when provider actually changes, not on mount
  const prevProvider = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevProvider.current !== undefined && prevProvider.current !== watchProvider) {
      form.setValue("credentialId", "");
    }
    prevProvider.current = watchProvider;
  }, [watchProvider, form]);

  const watchVariableName = form.watch("variableName") || "healer";

  const handleSubmit = (values: SelfHealingFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlertIcon className="size-5 text-amber-500" />
            Self-Healing Configuration
          </DialogTitle>
          <DialogDescription>
            This node wraps the next connected node. When it fails, AI
            analyzes the error and attempts to fix the configuration
            automatically.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 sm:space-y-5 mt-4"
          >
            {/* Variable Name */}
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="healer" {...field} />
                  </FormControl>
                  <FormDescription>
                    Access healing results via:{" "}
                    {`{{${watchVariableName}.selfHealing.healed}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* AI Provider */}
            <FormField
              control={form.control}
              name="aiProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Provider</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select AI provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(["OPENAI", "ANTHROPIC", "GEMINI"] as const).map(
                        (provider) => (
                          <SelectItem key={provider} value={provider}>
                            <div className="flex items-center gap-2">
                              <Image
                                src={providerLogos[provider]}
                                alt={provider}
                                width={18}
                                height={18}
                              />
                              {PROVIDER_LABELS[provider]}
                            </div>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Which AI model should analyze errors and suggest fixes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* AI Credential */}
            <FormField
              control={form.control}
              name="credentialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Credential</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingCredentials || !credentials?.length}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={
                          isLoadingCredentials
                            ? "Loading..."
                            : !credentials?.length
                              ? "No credentials found — add one first"
                              : "Select a credential"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {credentials?.map((credential) => (
                        <SelectItem key={credential.id} value={credential.id}>
                          <div className="flex items-center gap-2">
                            <Image
                              src={providerLogos[watchProvider]}
                              alt={watchProvider}
                              width={18}
                              height={18}
                            />
                            {credential.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Max Attempts */}
            <FormField
              control={form.control}
              name="maxAttempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Healing Attempts</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(Number(val))}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} attempt{n > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How many times to retry with AI-suggested fixes before
                    giving up
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Permission Toggles */}
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                Healing Permissions
              </p>
              <p className="text-xs text-muted-foreground">
                Control what the AI is allowed to modify. Credentials are{" "}
                <strong>never</strong> accessible.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <FormField
                control={form.control}
                name="allowModifyBody"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-2">
                    <div>
                      <FormLabel className="text-sm">Request Body</FormLabel>
                      <FormDescription className="text-xs">
                        Allow AI to modify request payloads
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allowModifyEndpoint"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-2">
                    <div>
                      <FormLabel className="text-sm">Endpoint URL</FormLabel>
                      <FormDescription className="text-xs">
                        Allow AI to modify target URLs
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allowModifyPrompt"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-2">
                    <div>
                      <FormLabel className="text-sm">AI Prompts</FormLabel>
                      <FormDescription className="text-xs">
                        Allow AI to modify system/user prompts
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allowModifyHeaders"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-2">
                    <div>
                      <FormLabel className="text-sm">Headers</FormLabel>
                      <FormDescription className="text-xs">
                        Allow AI to modify request headers
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Custom Instructions */}
            <FormField
              control={form.control}
              name="healingInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Healing Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., If the API returns 429, wait and retry. If JSON is malformed, try wrapping the body in an array."
                      className="min-h-[80px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Extra context for the AI about how to fix errors specific
                    to your use case
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-4">
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
