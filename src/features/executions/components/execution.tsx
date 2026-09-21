"use client";

import { ExecutionStatus } from "@prisma/client";
import {
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
  ClockIcon,
  CopyIcon,
  CheckIcon,
  ChevronDownIcon,
  AlertTriangleIcon,
  PaperclipIcon,
  FileTextIcon,
  LayersIcon,
  TimerIcon,
  CalendarIcon,
  ActivityIcon,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import Image from "next/image";
import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Markdown } from "@/components/ui/markdown";
import { cn, needsDarkInvert } from "@/lib/utils";
import { useSuspenseExecution } from "../hooks/use-executions";

/* -------------------------------------------------------------------------- */
/*                                  Status                                     */
/* -------------------------------------------------------------------------- */

const STATUS_TONE: Record<
  string,
  { icon: ReactNode; ring: string; chip: string; label: string }
> = {
  [ExecutionStatus.SUCCESS]: {
    icon: <CheckCircle2Icon className="size-5" />,
    ring: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    label: "Success",
  },
  [ExecutionStatus.FAILED]: {
    icon: <XCircleIcon className="size-5" />,
    ring: "bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20",
    chip: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    label: "Failed",
  },
  [ExecutionStatus.RUNNING]: {
    icon: <Loader2Icon className="size-5 animate-spin" />,
    ring: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20",
    chip: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    label: "Running",
  },
};

const FALLBACK_TONE = {
  icon: <ClockIcon className="size-5" />,
  ring: "bg-muted text-muted-foreground ring-1 ring-border",
  chip: "bg-muted text-muted-foreground border-border",
  label: "Pending",
};

const toneFor = (status: ExecutionStatus) =>
  STATUS_TONE[status] ?? FALLBACK_TONE;

/* -------------------------------------------------------------------------- */
/*                              Output helpers                                 */
/* -------------------------------------------------------------------------- */

type OutputEntry = { key: string; value: unknown };

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toEntries = (output: unknown): OutputEntry[] =>
  isPlainObject(output)
    ? Object.entries(output).map(([key, value]) => ({ key, value }))
    : [];

/** Node logos, matched loosely against the user's variable name. */
const LOGO_MAP: [string, string][] = [
  ["gmail", "/logos/gmail.svg"],
  ["gemini", "/logos/gemini.svg"],
  ["openai", "/logos/openai.svg"],
  ["anthropic", "/logos/anthropic.svg"],
  ["claude", "/logos/anthropic.svg"],
  ["slack", "/logos/slack.svg"],
  ["discord", "/logos/discord.svg"],
  ["whatsapp", "/logos/whatsapp.svg"],
  ["github", "/logos/github.svg"],
  ["stripe", "/logos/stripe.svg"],
  ["googleform", "/logos/googleform.svg"],
];

const resolveLogo = (key: string): string | null => {
  const normalised = key.toLowerCase().replace(/[^a-z]/g, "");
  for (const [name, src] of LOGO_MAP) {
    // `gmailData` matches gmail; `dis` matches discord.
    if (normalised.includes(name)) return src;
    if (normalised.length >= 3 && name.startsWith(normalised)) return src;
  }
  return null;
};

const describeType = (value: unknown): string => {
  if (value === null || value === undefined) return "empty";
  if (Array.isArray(value))
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "string")
    return `${value.length.toLocaleString()} chars`;
  if (isPlainObject(value)) {
    const count = Object.keys(value).length;
    return `${count} field${count === 1 ? "" : "s"}`;
  }
  return typeof value;
};

const TEXT_KEYS = [
  "text",
  "message",
  "messageContent",
  "content",
  "response",
  "result",
  "body",
  "output",
];

const extractText = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (!isPlainObject(value)) return null;
  for (const key of TEXT_KEYS) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return null;
};

const scalarFields = (value: unknown): [string, string][] => {
  if (!isPlainObject(value)) return [];
  return Object.entries(value)
    .filter(
      ([key, v]) =>
        !TEXT_KEYS.includes(key) &&
        (typeof v === "string" ||
          typeof v === "number" ||
          typeof v === "boolean") &&
        String(v).length <= 60,
    )
    .slice(0, 8)
    .map(([key, v]) => [key, String(v)]);
};

const collectionFields = (value: unknown): [string, unknown[]][] => {
  if (Array.isArray(value)) return [["items", value]];
  if (!isPlainObject(value)) return [];
  return Object.entries(value).filter(
    (entry): entry is [string, unknown[]] =>
      Array.isArray(entry[1]) && entry[1].length > 0,
  );
};

const pickString = (
  item: Record<string, unknown>,
  keys: string[],
): string | null => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return null;
};

/* -------------------------------------------------------------------------- */
/*                                 Primitives                                  */
/* -------------------------------------------------------------------------- */

const CopyButton = ({
  text,
  label,
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onCopy = useCallback(() => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        /* clipboard unavailable — fail quietly */
      });
  }, [text]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onCopy}
      className={cn(
        "h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {copied ? (
        <CheckIcon className="size-3.5 text-emerald-600" />
      ) : (
        <CopyIcon className="size-3.5" />
      )}
      {label ? (
        <span className="hidden sm:inline">{copied ? "Copied" : label}</span>
      ) : null}
    </Button>
  );
};

const NodeAvatar = ({ name }: { name: string }) => {
  const logo = resolveLogo(name);

  if (logo) {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background">
        <Image
          src={logo}
          alt=""
          width={16}
          height={16}
          className={cn("size-4", needsDarkInvert(logo) && "dark:invert")}
        />
      </span>
    );
  }

  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted text-[11px] font-semibold uppercase text-muted-foreground">
      {name.slice(0, 2)}
    </span>
  );
};

const StatTile = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) => (
  <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
    <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
      {icon}
      <span className="text-[11px] font-medium uppercase tracking-wide">
        {label}
      </span>
    </div>
    <p className="truncate text-sm font-medium" title={value}>
      {value}
    </p>
  </div>
);

/** Long AI answers collapse to a readable height with a fade + toggle. */
const ExpandableMarkdown = ({ content }: { content: string }) => {
  const [expanded, setExpanded] = useState(false);
  const long = content.length > 700;

  return (
    <div className="space-y-2">
      <div className="relative">
        <div
          className={cn(
            "transition-all",
            long && !expanded && "max-h-64 overflow-hidden",
          )}
        >
          <Markdown content={content} />
        </div>
        {long && !expanded ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
        ) : null}
      </div>
      {long ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <ChevronDownIcon
            className={cn(
              "size-3.5 transition-transform",
              expanded && "rotate-180",
            )}
          />
          {expanded ? "Show less" : "Show full response"}
        </Button>
      ) : null}
    </div>
  );
};

/** Renders an array of records (emails, rows, results) as a readable list. */
const CollectionList = ({
  name,
  items,
}: {
  name: string;
  items: unknown[];
}) => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, 4);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <LayersIcon className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          {name}
        </span>
        <Badge
          variant="secondary"
          className="h-5 px-1.5 text-[10px] font-medium tabular-nums"
        >
          {items.length}
        </Badge>
      </div>

      <div className="divide-y overflow-hidden rounded-lg border">
        {visible.map((item, index) => {
          if (!isPlainObject(item)) {
            return (
              <div
                key={index}
                className="px-3 py-2 text-xs text-muted-foreground"
              >
                {typeof item === "string" ? item : JSON.stringify(item)}
              </div>
            );
          }

          const primary =
            pickString(item, ["subject", "title", "name", "filename", "id"]) ??
            "(untitled)";
          const secondary = pickString(item, [
            "fromName",
            "from",
            "email",
            "author",
            "url",
          ]);
          const stamp = pickString(item, ["date", "createdAt", "timestamp"]);
          const preview = pickString(item, [
            "bodyText",
            "snippet",
            "description",
          ]);
          const attachments = Array.isArray(item.attachments)
            ? (item.attachments as Record<string, unknown>[])
            : [];

          return (
            <div
              key={index}
              className="space-y-1.5 px-3 py-2.5 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={primary}>
                    {primary}
                  </p>
                  {secondary ? (
                    <p
                      className="truncate text-xs text-muted-foreground"
                      title={secondary}
                    >
                      {secondary}
                    </p>
                  ) : null}
                </div>
                {stamp ? (
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                    {(() => {
                      const parsed = new Date(stamp);
                      return Number.isNaN(parsed.getTime())
                        ? stamp
                        : format(parsed, "d MMM, HH:mm");
                    })()}
                  </span>
                ) : null}
              </div>

              {preview?.trim() ? (
                <p className="line-clamp-2 text-xs text-muted-foreground/80">
                  {preview.trim()}
                </p>
              ) : null}

              {attachments.length ? (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {attachments.map((attachment, i) => {
                    const text =
                      typeof attachment.textContent === "string"
                        ? attachment.textContent
                        : "";
                    const failed =
                      text.startsWith("[Unable") ||
                      text.startsWith("[Attachment skipped") ||
                      text.startsWith("[Binary attachment");

                    return (
                      <Badge
                        key={i}
                        variant="outline"
                        className={cn(
                          "max-w-full gap-1 font-normal",
                          failed &&
                            "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                        )}
                        title={failed ? text : undefined}
                      >
                        {failed ? (
                          <AlertTriangleIcon className="size-3 shrink-0" />
                        ) : (
                          <PaperclipIcon className="size-3 shrink-0" />
                        )}
                        <span className="truncate text-[11px]">
                          {String(attachment.filename ?? "attachment")}
                        </span>
                        {!failed && text ? (
                          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                            {text.length.toLocaleString()} chars
                          </span>
                        ) : null}
                      </Badge>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {items.length > 4 ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll ? "Show fewer" : `Show all ${items.length}`}
        </Button>
      ) : null}
    </div>
  );
};

const SummaryCard = ({ entry }: { entry: OutputEntry }) => {
  const text = extractText(entry.value);
  const scalars = scalarFields(entry.value);
  const collections = collectionFields(entry.value);
  const json = useMemo(
    () => JSON.stringify(entry.value, null, 2),
    [entry.value],
  );

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2.5 border-b bg-muted/30 px-3 py-2">
        <NodeAvatar name={entry.key} />
        <span className="truncate text-sm font-medium">{entry.key}</span>
        <Badge
          variant="outline"
          className="h-5 shrink-0 px-1.5 text-[10px] font-normal"
        >
          {describeType(entry.value)}
        </Badge>
        <CopyButton text={json} className="ml-auto shrink-0" />
      </div>

      <div className="space-y-4 p-3 sm:p-4">
        {text ? <ExpandableMarkdown content={text} /> : null}

        {collections.map(([name, items]) => (
          <CollectionList key={name} name={name} items={items} />
        ))}

        {scalars.length ? (
          <div className="flex flex-wrap gap-1.5">
            {scalars.map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-[11px]"
              >
                <span className="text-muted-foreground">{key}</span>
                <span className="font-medium tabular-nums">{value}</span>
              </span>
            ))}
          </div>
        ) : null}

        {!text && !scalars.length && !collections.length ? (
          <p className="text-xs italic text-muted-foreground">
            No readable value for this node.
          </p>
        ) : null}
      </div>
    </div>
  );
};

/* ------------------------------ JSON viewer ------------------------------- */

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Regex JSON colouriser. Input is escaped first, so this is injection-safe. */
const highlightJson = (json: string) =>
  escapeHtml(json).replace(
    /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|\b(true|false)\b|\b(null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match, key, str, bool, nul, num) => {
      if (key)
        return `<span class="text-sky-700 dark:text-sky-300">${key}</span>`;
      if (str)
        return `<span class="text-emerald-700 dark:text-emerald-400">${str}</span>`;
      if (bool)
        return `<span class="text-purple-600 dark:text-purple-400">${bool}</span>`;
      if (nul) return `<span class="text-muted-foreground">${nul}</span>`;
      if (num)
        return `<span class="text-amber-600 dark:text-amber-400">${num}</span>`;
      return match;
    },
  );

const JsonBlock = ({
  json,
  className,
}: {
  json: string;
  className?: string;
}) => (
  <pre
    className={cn(
      "overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed",
      className,
    )}
  >
    {/* biome-ignore lint/security/noDangerouslySetInnerHtml: content is HTML-escaped above */}
    <code dangerouslySetInnerHTML={{ __html: highlightJson(json) }} />
  </pre>
);

const NodeRow = ({ entry }: { entry: OutputEntry }) => {
  const [open, setOpen] = useState(false);
  const json = useMemo(
    () => JSON.stringify(entry.value, null, 2),
    [entry.value],
  );

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="overflow-hidden rounded-xl border bg-card"
    >
      <div className="flex items-center gap-2.5 px-3 py-2">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          >
            <NodeAvatar name={entry.key} />
            <span className="truncate text-sm font-medium">{entry.key}</span>
            <Badge
              variant="outline"
              className="h-5 shrink-0 px-1.5 text-[10px] font-normal"
            >
              {describeType(entry.value)}
            </Badge>
            <ChevronDownIcon
              className={cn(
                "ml-1 size-3.5 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CopyButton text={json} className="shrink-0" />
      </div>
      <CollapsibleContent>
        <div className="border-t p-3">
          <JsonBlock
            json={json}
            className="max-h-96 border-0 bg-transparent p-0"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 Main view                                   */
/* -------------------------------------------------------------------------- */

export const ExecutionView = ({ executionId }: { executionId: string }) => {
  const { data: execution } = useSuspenseExecution(executionId);
  const [showStackTrace, setShowStackTrace] = useState(false);

  const tone = toneFor(execution.status);
  const entries = useMemo(
    () => toEntries(execution.output),
    [execution.output],
  );
  const json = useMemo(
    () => JSON.stringify(execution.output, null, 2),
    [execution.output],
  );

  const durationMs = execution.completedAt
    ? new Date(execution.completedAt).getTime() -
      new Date(execution.startedAt).getTime()
    : null;

  const durationLabel =
    durationMs === null
      ? "—"
      : durationMs < 1000
        ? `${durationMs} ms`
        : `${(durationMs / 1000).toFixed(1)} s`;

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-none">
      {/* ------------------------------- Header ------------------------------ */}
      <CardHeader className="gap-0 border-b bg-muted/20 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full",
              tone.ring,
            )}
          >
            {tone.icon}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2
                className="truncate text-base font-semibold tracking-tight sm:text-lg"
                title={execution.workflow.name}
              >
                {execution.workflow.name}
              </h2>
              <Badge
                variant="outline"
                className={cn(
                  "h-5 shrink-0 px-2 text-[11px] font-medium",
                  tone.chip,
                )}
              >
                {tone.label}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              Run <span className="font-mono">{executionId.slice(-8)}</span> ·{" "}
              {formatDistanceToNow(execution.startedAt, { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-4 sm:p-5">
        {/* ------------------------------ Stats ------------------------------ */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <StatTile
            icon={<ActivityIcon className="size-3.5" />}
            label="Status"
            value={tone.label}
          />
          <StatTile
            icon={<CalendarIcon className="size-3.5" />}
            label="Started"
            value={format(new Date(execution.startedAt), "d MMM, HH:mm:ss")}
          />
          <StatTile
            icon={<TimerIcon className="size-3.5" />}
            label="Duration"
            value={durationLabel}
          />
          <StatTile
            icon={<LayersIcon className="size-3.5" />}
            label="Node outputs"
            value={String(entries.length)}
          />
        </div>

        {/* ------------------------------ Error ------------------------------ */}
        {execution.error ? (
          <div className="space-y-3 rounded-xl border border-red-500/25 bg-red-500/5 p-3 sm:p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Execution failed
                </p>
                <p className="break-words font-mono text-xs text-red-800/90 dark:text-red-300/80">
                  {execution.error}
                </p>
              </div>
            </div>
            {execution.errorStack ? (
              <Collapsible
                open={showStackTrace}
                onOpenChange={setShowStackTrace}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-red-700 hover:bg-red-500/10 dark:text-red-400"
                  >
                    <ChevronDownIcon
                      className={cn(
                        "size-3.5 transition-transform",
                        showStackTrace && "rotate-180",
                      )}
                    />
                    Stack trace
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-red-500/20 bg-red-500/5 p-3 font-mono text-[11px] leading-relaxed text-red-800/90 dark:text-red-300/70">
                    {execution.errorStack}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            ) : null}
          </div>
        ) : null}

        {/* ------------------------------ Output ----------------------------- */}
        {execution.output != null ? (
          <Tabs defaultValue="summary" className="gap-3">
            <div className="flex items-center justify-between gap-2">
              <TabsList className="h-8 rounded-lg bg-muted p-0.5">
                <TabsTrigger
                  value="summary"
                  className="h-7 gap-1.5 rounded-md px-3 text-xs data-[state=active]:shadow-sm"
                >
                  <FileTextIcon className="size-3.5" />
                  Summary
                </TabsTrigger>
                <TabsTrigger
                  value="nodes"
                  className="h-7 gap-1.5 rounded-md px-3 text-xs data-[state=active]:shadow-sm"
                >
                  <LayersIcon className="size-3.5" />
                  Nodes
                  {entries.length ? (
                    <span className="rounded bg-foreground/10 px-1 text-[10px] tabular-nums">
                      {entries.length}
                    </span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger
                  value="json"
                  className="h-7 rounded-md px-3 font-mono text-xs data-[state=active]:shadow-sm"
                >
                  JSON
                </TabsTrigger>
              </TabsList>
              <CopyButton text={json} label="Copy JSON" />
            </div>

            <TabsContent value="summary" className="mt-0 space-y-3">
              {entries.length ? (
                entries.map((entry) => (
                  <SummaryCard key={entry.key} entry={entry} />
                ))
              ) : (
                <JsonBlock json={json} className="max-h-[32rem]" />
              )}
            </TabsContent>

            <TabsContent value="nodes" className="mt-0 space-y-2">
              {entries.length ? (
                entries.map((entry) => (
                  <NodeRow key={entry.key} entry={entry} />
                ))
              ) : (
                <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  This run produced no named node outputs.
                </p>
              )}
            </TabsContent>

            <TabsContent value="json" className="mt-0">
              <JsonBlock json={json} className="max-h-[32rem]" />
            </TabsContent>
          </Tabs>
        ) : null}
      </CardContent>
    </Card>
  );
};
