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
import { Switch } from "@/components/ui/switch";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import { CredentialType } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, { message: "Variable name is required" })
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message:
        "Variable name must start with a letter or underscore and contain letters, numbers, and underscores",
    }),
  credentialId: z.string().min(1, "Credential is required"),
  mailbox: z.string().optional(),
  subjectFilter: z.string().optional(),
  fromFilter: z.string().optional(),
  sinceDays: z.number().min(0).max(365).optional(),
  unreadOnly: z.boolean().optional(),
  markAsRead: z.boolean().optional(),
  requireAttachments: z.boolean().optional(),
  includeHtml: z.boolean().optional(),
  maxEmails: z.number().min(1).max(50).optional(),
});

export type GmailReaderFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GmailReaderFormValues) => void;
  defaultValues?: Partial<GmailReaderFormValues>;
}

export const GmailReaderDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const { data: credentials, isLoading: isLoadingCredentials } =
    useCredentialsByType(CredentialType.GMAIL);

  // Normalised, value-stable defaults. `defaultValues` is a fresh object on
  // every render of the parent node, so depending on it directly made the
  // effect below re-run and wipe whatever the user was typing.
  const initialValues = useMemo<GmailReaderFormValues>(
    () => ({
      variableName: defaultValues.variableName || "",
      credentialId: defaultValues.credentialId || "",
      mailbox: defaultValues.mailbox || "",
      subjectFilter: defaultValues.subjectFilter || "",
      fromFilter: defaultValues.fromFilter || "",
      sinceDays: defaultValues.sinceDays ?? 7,
      unreadOnly: defaultValues.unreadOnly !== false,
      markAsRead: defaultValues.markAsRead !== false,
      requireAttachments: defaultValues.requireAttachments === true,
      includeHtml: defaultValues.includeHtml === true,
      maxEmails: defaultValues.maxEmails || 10,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(defaultValues)]
  );

  const form = useForm<GmailReaderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (open) form.reset(initialValues);
    // Only re-seed the form when the dialog is (re)opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const watchVariableName = form.watch("variableName") || "gmailData";
  const unreadOnly = form.watch("unreadOnly");
  const markAsRead = form.watch("markAsRead");

  const handleSubmit = (values: GmailReaderFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gmail Reader Configuration</DialogTitle>
          <DialogDescription>
            Read emails from Gmail. Connect downstream nodes to process the
            email content.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 sm:space-y-6 mt-4"
          >
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="gmailData" {...field} />
                  </FormControl>
                  <FormDescription>
                    Reference results in other nodes:{" "}
                    {`{{json ${watchVariableName}.emails}}`}
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
                  <FormLabel>Gmail Credential</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
                              src="/logos/gmail.svg"
                              alt="Gmail"
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
                        No Gmail credentials found.{" "}
                        <Link
                          href="/credentials/new"
                          className="text-primary underline inline-flex items-center gap-1"
                        >
                          Create one
                          <ExternalLinkIcon className="h-3 w-3" />
                        </Link>
                      </span>
                    ) : (
                      "Select your Gmail credential (email + app password)"
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mailbox"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mailbox / Label (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="INBOX" {...field} />
                  </FormControl>
                  <FormDescription>
                    Gmail label to read from. Defaults to INBOX.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subjectFilter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Contains (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="resume" {...field} />
                  </FormControl>
                  <FormDescription>
                    Case-insensitive match against the decoded subject line.
                    Only emails whose subject contains this text are returned.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fromFilter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Contains (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="@company.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Match against the sender name or address.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sinceDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Look Back (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={365}
                        placeholder="7"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      0 = no date limit (not recommended).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxEmails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Emails</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        placeholder="10"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Newest matches first (1–50).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unreadOnly"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Unread Only</FormLabel>
                      <FormDescription className="text-xs">
                        Only fetch unread emails
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
                name="markAsRead"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Mark as Read</FormLabel>
                      <FormDescription className="text-xs">
                        Mark fetched emails as read
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
                name="requireAttachments"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">
                        Has Attachments
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Skip emails with no files
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
                name="includeHtml"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Include HTML</FormLabel>
                      <FormDescription className="text-xs">
                        Usually noise for AI nodes
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

            {unreadOnly && !markAsRead && (
              <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                &quot;Unread Only&quot; without &quot;Mark as Read&quot; means
                every run re-reads the same backlog of unread mail. Turn on Mark
                as Read so each email is processed exactly once.
              </p>
            )}

            {/* Available Variables Reference */}
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="font-medium text-sm">Available Variables</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  <code className="bg-background px-1 py-0.5 rounded">
                    {`{{json ${watchVariableName}.emails}}`}
                  </code>
                  {" — All emails as JSON (for AI prompts)"}
                </li>
                <li>
                  <code className="bg-background px-1 py-0.5 rounded">
                    {`{{${watchVariableName}.totalFound}}`}
                  </code>
                  {" — Emails matching every filter"}
                </li>
                <li>
                  <code className="bg-background px-1 py-0.5 rounded">
                    {`{{${watchVariableName}.totalFetched}}`}
                  </code>
                  {" — Number actually returned"}
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                Each email includes: <code className="text-xs">from</code>,{" "}
                <code className="text-xs">fromName</code>,{" "}
                <code className="text-xs">subject</code>,{" "}
                <code className="text-xs">date</code>,{" "}
                <code className="text-xs">bodyText</code>,{" "}
                <code className="text-xs">attachments[].textContent</code>
              </p>
            </div>

            <DialogFooter className="mt-4">
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};