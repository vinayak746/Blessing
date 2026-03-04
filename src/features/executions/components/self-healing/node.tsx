"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { ShieldAlertIcon } from "lucide-react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { SelfHealingDialog, type SelfHealingFormValues, PROVIDER_LABELS } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchSelfHealingRealtimeToken } from "./actions";
import { SELF_HEALING_CHANNEL_NAME } from "@/inngest/channels/self-healing";

type SelfHealingNodeData = {
  variableName?: string;
  credentialId?: string;
  aiProvider?: "OPENAI" | "ANTHROPIC" | "GEMINI";
  maxAttempts?: number;
  allowModifyBody?: boolean;
  allowModifyEndpoint?: boolean;
  allowModifyPrompt?: boolean;
  allowModifyHeaders?: boolean;
  healingInstructions?: string;
};

type SelfHealingNodeType = Node<SelfHealingNodeData>;

export const SelfHealingNode = memo(
  (props: NodeProps<SelfHealingNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
      nodeId: props.id,
      channel: SELF_HEALING_CHANNEL_NAME,
      topic: "status",
      refreshToken: fetchSelfHealingRealtimeToken,
    });

    const handleOpenSettings = () => {
      setDialogOpen(true);
    };

    const handleSubmit = (values: SelfHealingFormValues) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === props.id) {
            return {
              ...node,
              data: {
                ...node.data,
                ...values,
              },
            };
          }
          return node;
        })
      );
    };

    const nodeData = props.data;

    const description = nodeData?.aiProvider
      ? `${PROVIDER_LABELS[nodeData.aiProvider] || nodeData.aiProvider} · ${nodeData.maxAttempts || 3} attempts`
      : "Not configured";

    return (
      <>
        <SelfHealingDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
          defaultValues={nodeData}
        />
        <BaseExecutionNode
          {...props}
          id={props.id}
          icon={ShieldAlertIcon}
          name="Self-Healing"
          status={nodeStatus}
          description={description}
          onSettings={handleOpenSettings}
          onDoubleClick={handleOpenSettings}
        />
      </>
    );
  }
);

SelfHealingNode.displayName = "SelfHealingNode";
