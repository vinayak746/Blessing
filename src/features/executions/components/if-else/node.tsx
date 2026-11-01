"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { GitBranchIcon } from "lucide-react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { IfElseDialog, type IfElseFormValues } from "./dialog";
import { getUpstreamValues, type UpstreamValues } from "./value-options";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchIfElseRealtimeToken } from "./actions";
import { IF_ELSE_CHANNEL_NAME } from "@/inngest/channels/if-else";
import { OPERATOR_LABELS, operatorNeedsValue } from "./evaluate";

// Older saved nodes can lack the newer per-condition fields.
type IfElseNodeData = Partial<Omit<IfElseFormValues, "conditions">> & {
  conditions?: Partial<IfElseFormValues["conditions"][number]>[];
};

type IfElseNodeType = Node<IfElseNodeData>;

// The ids ("true" / "false") are what connections are saved against and what
// the engine routes on; only the labels people see say Yes / No.
const OUTPUTS = [
  { id: "true", label: "Yes" },
  { id: "false", label: "No" },
];

const describe = (data?: IfElseNodeData): string => {
  const first = data?.conditions?.[0];
  if (!first?.left || !first.operator) return "Not configured";

  // Prefer the plain-language name ("Status code") over the raw {{template}}.
  const parts = [
    first.leftLabel || first.left,
    OPERATOR_LABELS[first.operator],
  ];
  if (operatorNeedsValue(first.operator) && first.right)
    parts.push(first.right);

  const text = parts.join(" ");
  const more = (data?.conditions?.length ?? 1) - 1;
  const clipped = text.length > 40 ? `${text.slice(0, 40)}…` : text;
  return more > 0 ? `${clipped} (+${more} more)` : clipped;
};

export const IfElseNode = memo((props: NodeProps<IfElseNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes, getNodes, getEdges } = useReactFlow();
  const [upstream, setUpstream] = useState<UpstreamValues>({
    groups: [],
    unnamed: [],
  });

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: IF_ELSE_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchIfElseRealtimeToken,
  });

  const handleOpenSettings = () => {
    // Work out what the earlier steps can offer at the moment of opening, so
    // the list always reflects the workflow as it is right now.
    setUpstream(getUpstreamValues(getNodes(), getEdges(), props.id));
    setDialogOpen(true);
  };

  const handleSubmit = (values: IfElseFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === props.id
          ? { ...node, data: { ...node.data, ...values } }
          : node,
      ),
    );
  };

  return (
    <>
      <IfElseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data}
        upstream={upstream}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={GitBranchIcon}
        name="IF / Else"
        status={nodeStatus}
        description={describe(props.data)}
        outputs={OUTPUTS}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

IfElseNode.displayName = "IfElseNode";
