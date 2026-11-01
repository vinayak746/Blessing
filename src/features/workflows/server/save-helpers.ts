import { NodeType } from "@prisma/client";

/**
 * Saving a workflow is one transaction of ~6 round trips to the database.
 * Prisma's defaults (wait 2s for a connection, 5s for the whole transaction)
 * are tight when the database is far away or just waking up (Neon pauses idle
 * databases), and a timeout there fails the whole save. These are roomier.
 */
export const SAVE_TRANSACTION_OPTIONS = {
  maxWait: 10_000,
  timeout: 30_000,
} as const;

const VALID_NODE_TYPES = new Set<string>(Object.values(NodeType));

/**
 * Returns the first node that can't be stored (no type, or a type the
 * database doesn't know), so the save can fail with a clear message instead
 * of an opaque database error that blocks every later save too.
 */
export const findInvalidNode = <T extends { type?: string | null }>(
  nodes: T[],
): T | undefined =>
  nodes.find((node) => !node.type || !VALID_NODE_TYPES.has(node.type));

export const INVALID_NODE_MESSAGE =
  "One of the steps in this workflow is broken (it has no valid type), so it can't be saved. Delete the step that looks blank, then add it again.";
