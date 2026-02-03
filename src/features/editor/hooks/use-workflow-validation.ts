"use client";

import { useMemo, useRef } from "react";
import type { Node, Edge } from "@xyflow/react";
import { NodeType } from "@prisma/client";

export interface ValidationIssue {
  type: "error" | "warning" | "info";
  nodeId?: string;
  message: string;
  hint?: string; // Helpful hint for beginners
  learnMoreUrl?: string;
}

// Trigger node types
const TRIGGER_TYPES: string[] = [
  NodeType.MANUAL_TRIGGER,
  NodeType.GOOGLE_FORM_TRIGGER,
  NodeType.STRIPE_TRIGGER,
];

// Node type labels for friendly messages
const NODE_TYPE_LABELS: Record<string, string> = {
  [NodeType.MANUAL_TRIGGER]: "Manual Trigger",
  [NodeType.GOOGLE_FORM_TRIGGER]: "Google Form Trigger",
  [NodeType.STRIPE_TRIGGER]: "Stripe Trigger",
  [NodeType.HTTP_REQUEST]: "HTTP Request",
  [NodeType.GEMINI]: "Gemini AI",
  [NodeType.OPENAI]: "OpenAI",
  [NodeType.ANTHROPIC]: "Anthropic AI",
  [NodeType.DISCORD]: "Discord",
  [NodeType.SLACK]: "Slack",
  [NodeType.WHATSAPP]: "WhatsApp",
};

/**
 * Detects if there's a cycle (loop) in the workflow graph
 * A cycle means the workflow would run forever
 */
function detectCycle(edges: Edge[]): { hasCycle: boolean; cycleNodes: string[] } {
  const graph = new Map<string, string[]>();
  const allNodes = new Set<string>();
  
  // Build adjacency list
  edges.forEach((edge) => {
    allNodes.add(edge.source);
    allNodes.add(edge.target);
    if (!graph.has(edge.source)) {
      graph.set(edge.source, []);
    }
    graph.get(edge.source)!.push(edge.target);
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycleNodes: string[] = [];

  function dfs(node: string, path: string[]): boolean {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, [...path, neighbor])) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle - collect all nodes in the cycle
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          cycleNodes.push(...path.slice(cycleStart));
        } else {
          cycleNodes.push(neighbor, node);
        }
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  for (const node of allNodes) {
    if (!visited.has(node)) {
      if (dfs(node, [node])) {
        return { hasCycle: true, cycleNodes: [...new Set(cycleNodes)] };
      }
    }
  }

  return { hasCycle: false, cycleNodes: [] };
}

/**
 * Checks if a node has required configuration
 */
function getNodeLabel(nodeType: string): string {
  return NODE_TYPE_LABELS[nodeType] || nodeType.replace(/_/g, " ");
}

export function useWorkflowValidation(nodes: Node[], edges: Edge[]) {
  // Create a stable key based only on structural properties (not positions)
  // This prevents re-validation during node dragging
  const structuralKey = useMemo(() => {
    const nodeKey = nodes
      .map(n => `${n.id}:${n.type}`)
      .sort()
      .join(',');
    const edgeKey = edges
      .map(e => `${e.source}:${e.target}`)
      .sort()
      .join(',');
    return `${nodeKey}|${edgeKey}`;
  }, [nodes, edges]);

  // Cache nodes/edges for validation (only update when structure changes)
  const cachedNodesRef = useRef(nodes);
  const cachedEdgesRef = useRef(edges);
  const lastKeyRef = useRef(structuralKey);
  
  if (structuralKey !== lastKeyRef.current) {
    cachedNodesRef.current = nodes;
    cachedEdgesRef.current = edges;
    lastKeyRef.current = structuralKey;
  }

  const issues = useMemo(() => {
    const result: ValidationIssue[] = [];
    
    // Use cached nodes/edges for validation
    const validationNodes = cachedNodesRef.current;
    const validationEdges = cachedEdgesRef.current;

    // Filter out initial placeholder nodes
    const realNodes = validationNodes.filter((node) => node.type !== NodeType.INITIAL);
    
    // If no real nodes, show helpful info
    if (realNodes.length === 0) {
      result.push({
        type: "info",
        message: "Start by adding a trigger",
        hint: "Click the + button or press Shift+A to add your first node. A trigger determines when your workflow runs.",
      });
      return result;
    }

    // Check for triggers
    const triggerNodes = realNodes.filter((node) =>
      TRIGGER_TYPES.includes(node.type as string)
    );
    const actionNodes = realNodes.filter(
      (node) => !TRIGGER_TYPES.includes(node.type as string)
    );

    // Error: No trigger but has action nodes
    if (triggerNodes.length === 0 && actionNodes.length > 0) {
      result.push({
        type: "error",
        message: "Your workflow needs a trigger to start",
        hint: "A trigger tells your workflow WHEN to run. Add a Manual Trigger to test manually, or a Google Form/Stripe trigger to run automatically when events happen.",
      });
    }

    // Error: Multiple manual triggers
    const manualTriggers = realNodes.filter(
      (node) => node.type === NodeType.MANUAL_TRIGGER
    );
    if (manualTriggers.length > 1) {
      result.push({
        type: "error",
        message: "You can only have one Manual Trigger",
        hint: "A workflow can only start from one place. Delete the extra Manual Trigger node.",
      });
    }

    // CRITICAL: Check for loops/cycles
    if (edges.length > 0) {
      const { hasCycle, cycleNodes } = detectCycle(edges);
      if (hasCycle) {
        result.push({
          type: "error",
          message: "Loop detected! Your workflow would run forever",
          hint: "You've connected nodes in a circle. Workflows must flow in one direction (like water flowing downhill). Remove a connection to break the loop.",
          nodeId: cycleNodes[0],
        });
      }
    }

    // Check for self-loops (node connected to itself)
    const selfLoops = edges.filter((edge) => edge.source === edge.target);
    selfLoops.forEach((edge) => {
      const node = realNodes.find((n) => n.id === edge.source);
      result.push({
        type: "error",
        nodeId: edge.source,
        message: `${getNodeLabel(node?.type || "Node")} is connected to itself`,
        hint: "A node can't send data to itself. Remove this connection.",
      });
    });

    // Warning: Trigger exists but no actions connected
    if (triggerNodes.length > 0 && actionNodes.length === 0) {
      result.push({
        type: "warning",
        message: "Add actions to make your workflow do something",
        hint: "Your trigger is ready, but nothing happens when it fires. Add action nodes like Discord, Slack, or AI to process data when the trigger runs.",
      });
    }

    // Check connections when we have both triggers and actions
    if (triggerNodes.length > 0 && actionNodes.length > 0) {
      const connectedNodeIds = new Set<string>();
      validationEdges.forEach((edge) => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });

      // Warning: Trigger not connected to anything
      triggerNodes.forEach((trigger) => {
        const hasOutgoing = validationEdges.some((e) => e.source === trigger.id);
        if (!hasOutgoing) {
          result.push({
            type: "warning",
            nodeId: trigger.id,
            message: `${getNodeLabel(trigger.type as string)} isn't connected`,
            hint: "Drag from the output handle (right side) of this trigger to an action node to connect them.",
          });
        }
      });

      // Warning: Action nodes not connected
      actionNodes.forEach((action) => {
        const hasIncoming = validationEdges.some((e) => e.target === action.id);
        if (!hasIncoming) {
          result.push({
            type: "warning",
            nodeId: action.id,
            message: `${getNodeLabel(action.type as string)} isn't receiving any data`,
            hint: "This action won't run because nothing is connected to it. Connect it to a trigger or another action node.",
          });
        }
      });

      // Warning: Dead ends (actions with no outgoing that aren't at the end)
      // This is actually OK, just informational
    }

    // Check for orphan nodes (completely disconnected)
    const allConnectedNodes = new Set<string>();
    validationEdges.forEach((edge) => {
      allConnectedNodes.add(edge.source);
      allConnectedNodes.add(edge.target);
    });
    
    realNodes.forEach((node) => {
      if (!allConnectedNodes.has(node.id) && realNodes.length > 1) {
        // Only show this if there are multiple nodes
        const isTrigger = TRIGGER_TYPES.includes(node.type as string);
        if (!isTrigger) {
          result.push({
            type: "warning",
            nodeId: node.id,
            message: `${getNodeLabel(node.type as string)} is not connected to anything`,
            hint: "This node is floating alone and won't be part of your workflow. Connect it or delete it.",
          });
        }
      }
    });

    return result;
  }, [structuralKey]); // Only re-validate when structure changes, not positions

  const errors = useMemo(
    () => issues.filter((i) => i.type === "error"),
    [issues]
  );
  
  const warnings = useMemo(
    () => issues.filter((i) => i.type === "warning"),
    [issues]
  );

  const infos = useMemo(
    () => issues.filter((i) => i.type === "info"),
    [issues]
  );

  const isValid = errors.length === 0;
  const hasWarnings = warnings.length > 0;
  const canExecute = isValid && infos.length === 0;

  return {
    issues,
    errors,
    warnings,
    infos,
    isValid,
    hasWarnings,
    canExecute,
  };
}
