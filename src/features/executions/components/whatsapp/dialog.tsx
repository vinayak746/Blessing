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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLinkIcon } from "lucide-react";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import { CredentialType } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, { message: "Variable name is required" })
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message:
        "Variable name must start with a letter or underscore and contain letters, numbers, and underscores",
    }),
  credentialId: z.string().min(1, "Credential is required"),
  recipientPhone: z.string().min(1, "Recipient phone number is required"),
  content: z.string().min(1, "Message content is required"),
});

export type WhatsAppFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  defaultValues?: Partial<WhatsAppFormValues>;
}

export const WhatsAppDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const { data: credentials, isLoading: isLoadingCredentials } =
    useCredentialsByType(CredentialType.WHATSAPP);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName || "",
      credentialId: defaultValues.credentialId || "",
      recipientPhone: defaultValues.recipientPhone || "",
      content: defaultValues.content || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName || "",
        credentialId: defaultValues.credentialId || "",
        recipientPhone: defaultValues.recipientPhone || "",
        content: defaultValues.content || "",
      });
    }
  }, [open, defaultValues, form]);

  const watchVariableName = form.watch("variableName") || "myWhatsApp";

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>WhatsApp Configuration</DialogTitle>
          <DialogDescription>
            Send messages via WhatsApp Business API.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 mt-4"
          >
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="myWhatsApp" {...field} />
                  </FormControl>
                  <FormDescription>
                    Reference the result in other nodes:{" "}
                    {`{{${watchVariableName}.messageId}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

           <FormField
  control={form.control}
  name="credentialId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>WhatsApp Credential</FormLabel>
      <Select
        onValueChange={field.onChange}
        value={field.value}
      >
        <FormControl>
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                isLoadingCredentials
                  ? "Loading..."
                  : "Select a credential"
              }
            />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {credentials?.map((credential) => (
            <SelectItem key={credential.id} value={credential.id}>
              <div className="flex items-center gap-2">
                <Image
                  src="/logos/whatsapp.svg"
                  alt="WhatsApp"
                  width={16}
                  height={16}
                  className="rounded-sm"
                />
                {credential.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormDescription>
        {!credentials?.length && !isLoadingCredentials ? (
          <span>
            No WhatsApp credentials found.{" "}
            <Link
              href="/credentials/new"
              className="text-primary underline inline-flex items-center gap-1"
            >
              Create one
              <ExternalLinkIcon className="h-3 w-3" />
            </Link>
          </span>
        ) : (
          "Select your WhatsApp Business API credential"
        )}
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>

            <FormField
              control={form.control}
              name="recipientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="14155238886" {...field} />
                  </FormControl>
                  <FormDescription>
                    Phone number with country code (no + or spaces). Use
                    variables like {`{{triggerData.phone}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hello! Your order {{orderData.id}} has been confirmed. 🎉"
                      className="min-h-[100px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use {"{{"} variables {"}}"} for dynamic values or{" "}
                    {"{{"} json variable {"}}"} to stringify objects
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};