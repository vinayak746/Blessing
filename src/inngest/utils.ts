import { Connection, Node } from "@prisma/client";
import toposort from "toposort";
import { inngest } from "./client";
import { createId } from "@paralleldrive/cuid2";
import { BRANCH_KEY, type WorkflowContext } from "@/features/executions/types";

export const topologicalSort = (
  nodes: Node[],
  connections: Connection[],
): Node[] => {
  if (connections.length === 0) {
    return nodes;
  }

  // Create edges for toposort
  const edges: [string, string][] = connections.map((conn) => [
    conn.fromNodeId,
    conn.toNodeId,
  ]);

  // Add nodes with no connections as self-edges to ensure they're included
  const connectedNodeIds = new Set<string>();
  for (const conn of connections) {
    connectedNodeIds.add(conn.fromNodeId);
    connectedNodeIds.add(conn.toNodeId);
  }
  for (const node of nodes) {
    if (!connectedNodeIds.has(node.id)) {
      edges.push([node.id, node.id]);
    }
  }

  // Perform topological sort

  let sortedNodeIds: string[];
  try {
    sortedNodeIds = toposort(edges);
    // Remove duplicates from self edges
    sortedNodeIds = [...new Set(sortedNodeIds)];
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cyclic")) {
      throw new Error(
        "Your workflow contains a loop (cycle). Workflows must flow in one direction. " +
          "Please check your connections and remove any that create a circular path.",
      );
    }
    throw error;
  }

  // Map sorted IDs back to node objects
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return sortedNodeIds.map((id) => nodeMap.get(id)!).filter(Boolean);
};

/**
 * What a node reports having fired in a run:
 *  - `ALL_OUTPUTS`: every output handle. This is the default for every node
 *    that runs, whatever its handles are called (the editor's nodes use
 *    "source-1"; templates and older data use "main"). It is deliberately
 *    name-agnostic so handle naming can never cause a node to be skipped.
 *  - a list of handle ids: only those handles fired. Reserved for
 *    conditional nodes (IF / Switch) that pick a branch; none exist yet.
 * A node id absent from the record was skipped, not executed.
 */
export const ALL_OUTPUTS = "all" as const;
export type FiredOutputs = Record<string, string[] | typeof ALL_OUTPUTS>;

/**
 * Decides whether a node should execute, given what its upstream nodes
 * have fired so far in this run.
 *
 * A node with no (data) incoming connections is always reachable: it is a
 * trigger or an unconnected node. Both already run unconditionally today
 * (see the self-edge handling in `topologicalSort`) and this preserves that.
 *
 * Otherwise it is reachable if ANY incoming connection comes from an
 * upstream node that executed and whose fired outputs include the handle
 * that connection is attached to. "Any" (not "all") is deliberate: it lets
 * a node downstream of both branches of an IF run once either merges in.
 *
 * `configNodeIds` are nodes (self-healing) whose edges carry configuration,
 * not data. Their edges are ignored, otherwise a protected node would look
 * reachable even when its real upstream branch was skipped.
 *
 * Because ordinary nodes fire ALL_OUTPUTS, this returns true for every
 * workflow without a branching node, i.e. every workflow that exists today.
 */
export const isNodeReachable = (
  nodeId: string,
  // Only the fields we read. Connections come back from `step.run`
  // JSON-serialized (dates become strings), so a full Prisma `Connection`
  // can't be required here.
  connections: Pick<Connection, "fromNodeId" | "toNodeId" | "fromOutput">[],
  firedOutputs: FiredOutputs,
  configNodeIds: ReadonlySet<string> = new Set(),
): boolean => {
  const incoming = connections.filter(
    (conn) => conn.toNodeId === nodeId && !configNodeIds.has(conn.fromNodeId),
  );

  if (incoming.length === 0) return true;

  return incoming.some((conn) => {
    const fired = firedOutputs[conn.fromNodeId];
    if (fired === undefined) return false; // upstream was skipped
    return fired === ALL_OUTPUTS || fired.includes(conn.fromOutput);
  });
};

/**
 * Pulls the branch choice (if any) out of the context a node returned.
 * Returns the context with the reserved key removed, plus what the node
 * fired: the handle ids it chose, or ALL_OUTPUTS if it didn't choose.
 */
export const extractBranch = (
  result: WorkflowContext,
): { context: WorkflowContext; fired: string[] | typeof ALL_OUTPUTS } => {
  if (!(BRANCH_KEY in result)) return { context: result, fired: ALL_OUTPUTS };

  const { [BRANCH_KEY]: chosen, ...context } = result;
  const valid =
    Array.isArray(chosen) &&
    chosen.length > 0 &&
    chosen.every((id): id is string => typeof id === "string");

  return { context, fired: valid ? chosen : ALL_OUTPUTS };
};

export const sendWorkflowExecution = async (data: {
  workflowId: string;
  [key: string]: any;
}) => {
  return inngest.send({
    name: "workflows/execute.workflow",
    data,
    id: createId(),
  });
};
