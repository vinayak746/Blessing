import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import { gmailReaderChannel } from "@/inngest/channels/gmail-reader";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import Imap from "imap";
import { simpleParser, type ParsedMail, type Attachment } from "mailparser";

type GmailReaderData = {
  variableName?: string;
  credentialId?: string;
  mailbox?: string;
  subjectFilter?: string;
  fromFilter?: string;
  sinceDays?: number;
  unreadOnly?: boolean;
  markAsRead?: boolean;
  requireAttachments?: boolean;
  includeHtml?: boolean;
  maxEmails?: number;
};

type ParsedEmail = {
  uid: number;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  date: string;
  bodyText: string;
  bodyHtml: string;
  attachments: ParsedAttachment[];
};

type ParsedAttachment = {
  filename: string;
  contentType: string;
  size: number;
  textContent: string;
};

/** Header-only preview used for filtering before we download full bodies. */
type EmailHeader = {
  uid: number;
  subject: string;
  from: string;
  fromName: string;
  dateMs: number;
};

/** Hard caps so a single fat email can't blow up the workflow context / AI prompt. */
const MAX_BODY_TEXT_CHARS = 20_000;
const MAX_BODY_HTML_CHARS = 20_000;
const MAX_ATTACHMENT_TEXT_CHARS = 50_000;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

function truncate(value: string, limit: number): string {
  if (!value) return "";
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}\n\n[...truncated ${value.length - limit} characters]`;
}

let pdfWorkerResolved = false;

/**
 * pdf-parse v2 runs pdfjs in a worker. When Next bundles the package into
 * `.next/server/chunks`, the sibling `pdf.worker.mjs` file is not emitted and
 * pdfjs fails with "Setting up fake worker failed".
 *
 * The real fix is `serverExternalPackages` in next.config.ts (see below), but
 * we also point pdf-parse at the worker file on disk as a belt-and-braces
 * fallback so a stale build doesn't silently break attachment parsing.
 */
async function ensurePdfWorker(mod: any): Promise<void> {
  if (pdfWorkerResolved) return;
  pdfWorkerResolved = true;

  try {
    const PDFParse = mod.PDFParse ?? mod.default?.PDFParse;
    if (typeof PDFParse?.setWorker !== "function") return;

    const { existsSync } = await import("node:fs");
    const path = await import("node:path");
    const { pathToFileURL } = await import("node:url");

    const candidates = [
      "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs",
      "node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs",
      "node_modules/pdf-parse/dist/worker/pdf.worker.mjs",
    ].map((rel) => path.join(process.cwd(), rel));

    const workerPath = candidates.find((candidate) => existsSync(candidate));
    if (workerPath) {
      PDFParse.setWorker(pathToFileURL(workerPath).href);
    }
  } catch {
    // Leave pdf-parse on its default worker resolution.
  }
}

/**
 * Extract text from a PDF buffer.
 * Supports both pdf-parse v1 (default export is a function) and
 * v2 (named `PDFParse` class export).
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const mod: any = await import("pdf-parse");

    // pdf-parse v2
    const PDFParse = mod.PDFParse ?? mod.default?.PDFParse;
    if (typeof PDFParse === "function") {
      await ensurePdfWorker(mod);

      const parser = new PDFParse({
        data: new Uint8Array(buffer),
        // Keep pdfjs quiet; it logs font warnings for almost every resume.
        verbosity: 0,
      });
      try {
        const result = await parser.getText();
        return result?.text ?? "";
      } finally {
        await parser.destroy?.();
      }
    }

    // pdf-parse v1
    const pdfParse = typeof mod === "function" ? mod : mod.default;
    if (typeof pdfParse === "function") {
      const data = await pdfParse(buffer);
      return data?.text ?? "";
    }

    return "[Unable to extract PDF text: unsupported pdf-parse version]";
  } catch (error) {
    return `[Unable to extract PDF text: ${(error as Error).message}]`;
  }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    return `[Unable to extract DOCX text: ${(error as Error).message}]`;
  }
}

async function extractAttachmentText(attachment: Attachment): Promise<string> {
  const contentType = attachment.contentType?.toLowerCase() || "";
  const filename = attachment.filename?.toLowerCase() || "";

  if (!attachment.content || attachment.content.length > MAX_ATTACHMENT_BYTES) {
    return `[Attachment skipped: ${attachment.filename || "unknown"} is too large]`;
  }

  let text: string;

  if (contentType === "application/pdf" || filename.endsWith(".pdf")) {
    text = await extractPdfText(attachment.content);
  } else if (
    contentType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filename.endsWith(".docx")
  ) {
    text = await extractDocxText(attachment.content);
  } else if (contentType.startsWith("text/")) {
    text = attachment.content.toString("utf-8");
  } else {
    return `[Binary attachment: ${attachment.filename || "unknown"}, ${contentType}]`;
  }

  return truncate(text, MAX_ATTACHMENT_TEXT_CHARS);
}

async function parseEmail(
  uid: number,
  rawBase64: string,
  includeHtml: boolean
): Promise<ParsedEmail> {
  const parsed: ParsedMail = await simpleParser(
    Buffer.from(rawBase64, "base64")
  );

  const attachments: ParsedAttachment[] = [];
  for (const att of parsed.attachments ?? []) {
    attachments.push({
      filename: att.filename || "unknown",
      contentType: att.contentType || "application/octet-stream",
      size: att.size,
      textContent: await extractAttachmentText(att),
    });
  }

  const fromAddress = parsed.from?.value?.[0]?.address || "";
  const fromName = parsed.from?.value?.[0]?.name || fromAddress;
  const toAddress = parsed.to
    ? Array.isArray(parsed.to)
      ? parsed.to[0]?.value?.[0]?.address || ""
      : parsed.to.value?.[0]?.address || ""
    : "";

  return {
    uid,
    from: fromAddress,
    fromName,
    to: toAddress,
    subject: parsed.subject || "(no subject)",
    date: parsed.date?.toISOString() || new Date().toISOString(),
    bodyText: truncate(parsed.text || "", MAX_BODY_TEXT_CHARS),
    // HTML is enormous for most transactional mail (Indeed, LinkedIn, ...).
    // It is opt-in so it doesn't destroy downstream AI prompts.
    bodyHtml: includeHtml
      ? truncate(
        typeof parsed.html === "string" ? parsed.html : "",
        MAX_BODY_HTML_CHARS
      )
      : "",
    attachments,
  };
}

/** Decode a raw RFC822 header block into the small preview we filter on. */
async function parseHeaderBlock(
  uid: number,
  rawHeaders: string
): Promise<EmailHeader> {
  const parsed = await simpleParser(Buffer.from(rawHeaders, "utf-8"));
  const fromAddress = parsed.from?.value?.[0]?.address || "";
  return {
    uid,
    // simpleParser handles MIME word decoding (=?UTF-8?B?...?=) for us,
    // which a raw IMAP SEARCH cannot do reliably.
    subject: parsed.subject || "",
    from: fromAddress,
    fromName: parsed.from?.value?.[0]?.name || fromAddress,
    dateMs: parsed.date ? parsed.date.getTime() : 0,
  };
}

function connect(email: string, appPassword: string): Promise<Imap> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: email,
      password: appPassword,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { servername: "imap.gmail.com" },
      authTimeout: 15_000,
      connTimeout: 20_000,
    });

    let settled = false;

    imap.once("ready", () => {
      if (settled) return;
      settled = true;
      resolve(imap);
    });

    imap.once("error", (err: Error) => {
      if (settled) return;
      settled = true;
      reject(
        new NonRetriableError(
          `Gmail: Connection failed: ${err.message}. Check the email address and app password on the credential.`
        )
      );
    });

    imap.connect();
  });
}

function openBox(
  imap: Imap,
  mailbox: string,
  readOnly: boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    imap.openBox(mailbox, readOnly, (err) => {
      if (err) {
        reject(
          new NonRetriableError(
            `Gmail: Failed to open mailbox "${mailbox}": ${err.message}`
          )
        );
        return;
      }
      resolve();
    });
  });
}

function search(imap: Imap, criteria: unknown[]): Promise<number[]> {
  return new Promise((resolve, reject) => {
    // node-imap's `search` issues UID SEARCH, so these are UIDs.
    imap.search(criteria as never, (err, uids) => {
      if (err) {
        reject(new NonRetriableError(`Gmail: Search failed: ${err.message}`));
        return;
      }
      resolve(uids ?? []);
    });
  });
}

/**
 * Fetch `bodies` for the given UIDs.
 *
 * Chunks are collected on the *stream's* `end` event, and the promise only
 * resolves once every message has finished streaming. The previous version
 * resolved on the fetch `end` event while body streams were still draining,
 * which produced truncated / dropped messages.
 */
function fetchBodies(
  imap: Imap,
  uids: number[],
  bodies: string,
  markSeen: boolean
): Promise<Map<number, string>> {
  return new Promise((resolve, reject) => {
    const out = new Map<number, string>();

    if (uids.length === 0) {
      resolve(out);
      return;
    }

    const f = imap.fetch(uids, { bodies, struct: false, markSeen });

    let pending = 0;
    let fetchEnded = false;
    let failed = false;

    const maybeDone = () => {
      if (!failed && fetchEnded && pending === 0) resolve(out);
    };

    f.on("message", (msg, seqno) => {
      pending += 1;
      let uid = seqno;
      const chunks: Buffer[] = [];

      msg.on("attributes", (attrs) => {
        if (attrs?.uid) uid = attrs.uid;
      });

      msg.on("body", (stream) => {
        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      });

      msg.once("end", () => {
        // `end` on the message fires once all of its body streams are done.
        out.set(uid, Buffer.concat(chunks).toString("base64"));
        pending -= 1;
        maybeDone();
      });
    });

    f.once("error", (err: Error) => {
      failed = true;
      reject(new NonRetriableError(`Gmail: Fetch failed: ${err.message}`));
    });

    f.once("end", () => {
      fetchEnded = true;
      maybeDone();
    });
  });
}

type FetchResult = {
  messages: { uid: number; raw: string }[];
  totalMatched: number;
  totalScanned: number;
};

/**
 * Two-pass read:
 *   1. Narrow server-side with criteria Gmail handles reliably (UNSEEN, SINCE).
 *   2. Pull headers only, filter subject / sender / attachments locally,
 *      sort newest-first, then download the full bodies for the winners.
 *
 * Gmail's IMAP SEARCH is backed by its own search index rather than a literal
 * header substring match, so `SEARCH SUBJECT "resume"` both over-matches
 * (hits the body) and mangles encoded subjects. Filtering on decoded headers
 * locally is the only way to make "subject contains X" actually mean that.
 */
async function fetchEmails(
  email: string,
  appPassword: string,
  options: {
    mailbox: string;
    subjectFilter?: string;
    fromFilter?: string;
    sinceDays?: number;
    unreadOnly: boolean;
    markAsRead: boolean;
    requireAttachments: boolean;
    maxEmails: number;
  }
): Promise<FetchResult> {
  const imap = await connect(email, appPassword);

  try {
    await openBox(imap, options.mailbox, !options.markAsRead);

    const criteria: unknown[] = [];
    if (options.unreadOnly) criteria.push("UNSEEN");
    if (options.sinceDays && options.sinceDays > 0) {
      const since = new Date();
      since.setDate(since.getDate() - options.sinceDays);
      criteria.push(["SINCE", since]);
    }
    if (criteria.length === 0) criteria.push("ALL");

    const candidateUids = await search(imap, criteria);
    if (candidateUids.length === 0) {
      return { messages: [], totalMatched: 0, totalScanned: 0 };
    }

    // Scan newest-first and stop once we have enough matches, so a mailbox with
    // thousands of old unread messages doesn't turn into a full-mailbox download.
    const ordered = [...candidateUids].sort((a, b) => b - a);
    const scanLimit = Math.min(
      ordered.length,
      Math.max(options.maxEmails * 20, 200)
    );
    const toScan = ordered.slice(0, scanLimit);

    const headerRaw = await fetchBodies(
      imap,
      toScan,
      "HEADER.FIELDS (FROM TO SUBJECT DATE)",
      false // never mark seen during the scan pass
    );

    const headers: EmailHeader[] = [];
    for (const [uid, raw] of headerRaw) {
      headers.push(
        await parseHeaderBlock(uid, Buffer.from(raw, "base64").toString("utf-8"))
      );
    }

    const subjectNeedle = options.subjectFilter?.trim().toLowerCase();
    const fromNeedle = options.fromFilter?.trim().toLowerCase();

    const matched = headers
      .filter((h) => {
        if (subjectNeedle && !h.subject.toLowerCase().includes(subjectNeedle)) {
          return false;
        }
        if (fromNeedle) {
          const haystack = `${h.from} ${h.fromName}`.toLowerCase();
          if (!haystack.includes(fromNeedle)) return false;
        }
        return true;
      })
      .sort((a, b) => b.dateMs - a.dateMs || b.uid - a.uid);

    const selected = matched.slice(0, options.maxEmails);

    const fullRaw = await fetchBodies(
      imap,
      selected.map((h) => h.uid),
      "",
      options.markAsRead
    );

    const messages = selected
      .map((h) => ({ uid: h.uid, raw: fullRaw.get(h.uid) }))
      .filter((m): m is { uid: number; raw: string } => Boolean(m.raw));

    return {
      messages,
      totalMatched: matched.length,
      totalScanned: toScan.length,
    };
  } finally {
    try {
      imap.end();
    } catch {
      // connection already closed
    }
  }
}

export const gmailReaderExecutor: NodeExecutor<GmailReaderData> = async ({
  data,
  nodeId,
  userId,
  context,
  step,
  publish,
}) => {
  await publish(gmailReaderChannel().status({ nodeId, status: "loading" }));

  if (!data.variableName) {
    await publish(gmailReaderChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Gmail Reader: Variable name is missing");
  }

  if (!data.credentialId) {
    await publish(gmailReaderChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Gmail Reader: Credential ID is missing");
  }

  const credential = await step.run("gmail-get-credential", () =>
    prisma.credential.findUnique({
      where: { id: data.credentialId, userId },
    })
  );

  if (!credential) {
    await publish(gmailReaderChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Gmail Reader: Credential not found");
  }

  try {
    const decryptedValue = decrypt(credential.value);

    // Gmail credential is stored as "email:appPassword"
    const separatorIndex = decryptedValue.indexOf(":");
    if (separatorIndex === -1) {
      throw new NonRetriableError(
        "Gmail Reader: Invalid credential format. Expected 'email:appPassword'."
      );
    }
    const email = decryptedValue.substring(0, separatorIndex);
    // App passwords are often pasted with the spaces Google shows them in.
    const appPassword = decryptedValue
      .substring(separatorIndex + 1)
      .replace(/\s+/g, "");

    const maxEmails = Math.min(Math.max(data.maxEmails ?? 10, 1), 50);
    const sinceDays =
      data.sinceDays === undefined ? 7 : Math.max(0, data.sinceDays);
    const includeHtml = data.includeHtml === true;
    const requireAttachments = data.requireAttachments === true;

    const { messages, totalMatched, totalScanned } = await step.run(
      "gmail-fetch-emails",
      () =>
        fetchEmails(email, appPassword, {
          mailbox: data.mailbox?.trim() || "INBOX",
          subjectFilter: data.subjectFilter,
          fromFilter: data.fromFilter,
          sinceDays,
          unreadOnly: data.unreadOnly !== false, // default true
          markAsRead: data.markAsRead !== false, // default true — see note below
          requireAttachments,
          maxEmails,
        })
    );

    const emails = await step.run("gmail-parse-emails", async () => {
      const parsed: ParsedEmail[] = [];
      for (const message of messages) {
        parsed.push(await parseEmail(message.uid, message.raw, includeHtml));
      }
      // `requireAttachments` can only be evaluated after MIME parsing.
      return requireAttachments
        ? parsed.filter((e) => e.attachments.length > 0)
        : parsed;
    });

    await publish(gmailReaderChannel().status({ nodeId, status: "success" }));

    return {
      ...context,
      [data.variableName]: {
        emails,
        totalFound: totalMatched,
        totalFetched: emails.length,
        totalScanned,
        filters: {
          mailbox: data.mailbox?.trim() || "INBOX",
          subjectFilter: data.subjectFilter?.trim() || null,
          fromFilter: data.fromFilter?.trim() || null,
          sinceDays: sinceDays || null,
          unreadOnly: data.unreadOnly !== false,
        },
      },
    };
  } catch (error) {
    await publish(gmailReaderChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};