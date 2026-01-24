"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { WhatsAppDialog, WhatsAppFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchWhatsAppRealtimeToken } from "./actions";
import { WHATSAPP_CHANNEL_NAME } from "@/inngest/channels/whatsapp";

type WhatsAppNodeData = {
  variableName?: string;
  credentialId?: string;
  recipientPhone?: string;
  content?: string;
};

type WhatsAppNodeType = Node<WhatsAppNodeData>;

export const WhatsAppNode = memo((props: NodeProps<WhatsAppNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: WHATSAPP_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchWhatsAppRealtimeToken,
  });

  const handleOpenSettings = () => {
    setDialogOpen(true);
  };

  const handleSubmit = (values: WhatsAppFormValues) => {
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
  const description = nodeData?.content
    ? `Send: ${nodeData.content.slice(0, 50)}...`
    : "Not configured";

  return (
    <>
      <WhatsAppDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/logos/whatsapp.svg"
        name="WhatsApp"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

WhatsAppNode.displayName = "WhatsAppNode";