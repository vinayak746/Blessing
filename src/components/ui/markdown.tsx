"use client";

import { Fragment, memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A small, dependency-free Markdown renderer.
 *
 * AI nodes (Gemini / OpenAI / Anthropic) almost always answer in Markdown.
 * Printing that as raw text is what made execution output look unfinished —
 * headings showed as `###`, bold as `**...**`, tables as pipe soup.
 *
 * Supports: headings, bold/italic/strike, inline code, fenced code blocks,
 * bullet + ordered lists, blockquotes, horizontal rules, tables and links.
 * Deliberately not a full CommonMark implementation — it covers what LLMs emit.
 */

/* ----------------------------- inline parsing ----------------------------- */

const INLINE_PATTERN =
  /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*\n]+\*|_[^_\n]+_|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function renderInline(text: string, keyPrefix: string): ReactNode {
  if (!text) return null;

  const parts = text.split(INLINE_PATTERN).filter((part) => part !== "");

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith("***") && part.endsWith("***")) {
      return (
        <strong key={key} className="font-semibold italic">
          {part.slice(3, -3)}
        </strong>
      );
    }
    if (
      (part.startsWith("**") && part.endsWith("**")) ||
      (part.startsWith("__") && part.endsWith("__"))
    ) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("~~") && part.endsWith("~~")) {
      return (
        <span key={key} className="line-through opacity-70">
          {part.slice(2, -2)}
        </span>
      );
    }
    if (
      (part.startsWith("*") && part.endsWith("*")) ||
      (part.startsWith("_") && part.endsWith("_"))
    ) {
      return (
        <em key={key} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={key}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      return (
        <a
          key={key}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
        >
          {link[1]}
        </a>
      );
    }

    return <Fragment key={key}>{part}</Fragment>;
  });
}

/* ------------------------------ block parsing ----------------------------- */

const HEADING_CLASSES = [
  "text-base font-semibold tracking-tight",
  "text-sm font-semibold tracking-tight",
  "text-sm font-semibold",
  "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
];

const isTableDivider = (line: string) =>
  /^\s*\|?[\s:-]*-[\s:|-]*\|?\s*$/.test(line) && line.includes("-");

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

function parseBlocks(source: string): ReactNode[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  let key = 0;

  while (index < lines.length) {
    const line = lines[index];

    // Blank line
    if (!line.trim()) {
      index += 1;
      continue;
    }

    // Fenced code block
    const fence = /^\s*```(\w*)\s*$/.exec(line);
    if (fence) {
      const language = fence[1];
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        body.push(lines[index]);
        index += 1;
      }
      index += 1; // closing fence
      blocks.push(
        <div
          key={`code-${key++}`}
          className="overflow-hidden rounded-lg border bg-muted/60"
        >
          {language ? (
            <div className="border-b px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {language}
            </div>
          ) : null}
          <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed">
            {body.join("\n")}
          </pre>
        </div>,
      );
      continue;
    }

    // Horizontal rule
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      blocks.push(<hr key={`hr-${key++}`} className="border-border/70" />);
      index += 1;
      continue;
    }

    // Heading
    const heading = /^\s*(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = Math.min(heading[1].length, 4);
      blocks.push(
        <p
          key={`h-${key++}`}
          className={cn(
            HEADING_CLASSES[level - 1],
            "text-foreground",
            blocks.length ? "pt-1" : "",
          )}
        >
          {renderInline(heading[2], `h-${key}`)}
        </p>,
      );
      index += 1;
      continue;
    }

    // Table
    if (
      line.trim().startsWith("|") &&
      index + 1 < lines.length &&
      isTableDivider(lines[index + 1])
    ) {
      const header = splitRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(splitRow(lines[index]));
        index += 1;
      }
      blocks.push(
        <div
          key={`table-${key++}`}
          className="overflow-x-auto rounded-lg border"
        >
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-muted/60">
                {header.map((cell, i) => (
                  <th
                    key={i}
                    className="whitespace-nowrap px-3 py-2 text-left font-medium text-foreground"
                  >
                    {renderInline(cell, `th-${i}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-3 py-2 align-top text-muted-foreground"
                    >
                      {renderInline(cell, `td-${rowIndex}-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Blockquote
    if (/^\s*>\s?/.test(line)) {
      const body: string[] = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        body.push(lines[index].replace(/^\s*>\s?/, ""));
        index += 1;
      }
      blocks.push(
        <blockquote
          key={`quote-${key++}`}
          className="border-l-2 border-primary/40 pl-3 text-muted-foreground italic"
        >
          {renderInline(body.join(" "), `quote-${key}`)}
        </blockquote>,
      );
      continue;
    }

    // Lists (bullet or ordered, one level of nesting)
    const listItem = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (listItem) {
      const ordered = /\d/.test(listItem[2]);
      const items: { depth: number; content: string }[] = [];

      while (index < lines.length) {
        const match = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[index]);
        if (!match) break;
        items.push({
          depth: Math.min(Math.floor(match[1].length / 2), 2),
          content: match[3],
        });
        index += 1;
      }

      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag key={`list-${key++}`} className="space-y-1.5">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex gap-2 text-muted-foreground"
              style={{ paddingLeft: `${item.depth * 14}px` }}
            >
              <span
                className={cn(
                  "shrink-0 select-none",
                  ordered
                    ? "min-w-[1.1rem] font-medium text-foreground/70 tabular-nums"
                    : "mt-[0.45rem] size-1.5 rounded-full bg-primary/50",
                )}
              >
                {ordered ? `${i + 1}.` : ""}
              </span>
              <span className="min-w-0 flex-1">
                {renderInline(item.content, `li-${key}-${i}`)}
              </span>
            </li>
          ))}
        </ListTag>,
      );
      continue;
    }

    // Paragraph — gather until a blank line or a new block starts
    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^\s*(#{1,6}\s|```|>\s?|([-*+]|\d+[.)])\s)/.test(lines[index]) &&
      !/^\s*([-*_])\1{2,}\s*$/.test(lines[index]) &&
      !lines[index].trim().startsWith("|")
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }

    if (paragraph.length) {
      blocks.push(
        <p key={`p-${key++}`} className="text-muted-foreground">
          {renderInline(paragraph.join(" "), `p-${key}`)}
        </p>,
      );
    } else {
      index += 1;
    }
  }

  return blocks;
}

export const Markdown = memo(
  ({ content, className }: { content: string; className?: string }) => {
    if (!content?.trim()) return null;

    return (
      <div
        className={cn(
          "space-y-2.5 text-sm leading-relaxed break-words",
          className,
        )}
      >
        {parseBlocks(content)}
      </div>
    );
  },
);

Markdown.displayName = "Markdown";
