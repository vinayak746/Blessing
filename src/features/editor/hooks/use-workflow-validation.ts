"use client";

import { useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import { NodeType } from "@prisma/client";

export interface ValidationIssue {
  type: "error" | "warning";
  nodeId?: string;
  message: string;
}

// Trigger node types
const TRIGGER_TYPES: string[] = [
  NodeType.MANUAL_TRIGGER,
  NodeType.GOOGLE_FORM_TRIGGER,
  NodeType.STRIPE_TRIGGER,
];

export function useWorkflowValidation(nodes: Node[], edges: Edge[]) {
  const issues = useMemo(() => {
    const result: ValidationIssue[] = [];

    // Filter out initial placeholder nodes
    const realNodes = nodes.filter((node) => node.type !== NodeType.INITIAL);
    
    // If no real nodes, no validation needed
    if (realNodes.length === 0) {
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
        message: "Workflow needs a trigger to start",
      });
    }

    // Error: Multiple manual triggers
    const manualTriggers = realNodes.filter(
      (node) => node.type === NodeType.MANUAL_TRIGGER
    );
    if (manualTriggers.length > 1) {
      result.push({
        type: "error",
        message: "Only one Manual Trigger allowed",
      });
    }

    // Warning: Trigger exists but no actions connected
    if (triggerNodes.length > 0 && actionNodes.length === 0) {
      result.push({
        type: "warning",
        message: "Add actions to your workflow",
      });
    }

    // Check connections when we have both triggers and actions
    if (triggerNodes.length > 0 && actionNodes.length > 0) {
      const connectedNodeIds = new Set<string>();
      edges.forEach((edge) => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });

      // Warning: Trigger not connected to anything
      triggerNodes.forEach((trigger) => {
        const hasOutgoing = edges.some((e) => e.source === trigger.id);
        if (!hasOutgoing) {
          result.push({
            type: "warning",
            nodeId: trigger.id,
            message: "Trigger not connected",
          });
        }
      });

      // Warning: Action nodes not connected
      actionNodes.forEach((action) => {
        const hasIncoming = edges.some((e) => e.target === action.id);
        if (!hasIncoming) {
          result.push({
            type: "warning",
            nodeId: action.id,
            message: `${action.type} not connected`,
          });
        }
      });
    }

    return result;
  }, [nodes, edges]);

  const errors = useMemo(
    () => issues.filter((i) => i.type === "error"),
    [issues]
  );
  
  const warnings = useMemo(
    () => issues.filter((i) => i.type === "warning"),
    [issues]
  );

  const isValid = errors.length === 0;
  const hasWarnings = warnings.length > 0;

  return {
    issues,
    errors,
    warnings,
    isValid,
    hasWarnings,
  };
}
