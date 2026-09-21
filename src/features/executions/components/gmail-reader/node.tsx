"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { GmailReaderDialog, type GmailReaderFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchGmailReaderRealtimeToken } from "./actions";
import { GMAIL_READER_CHANNEL_NAME } from "@/inngest/channels/gmail-reader";

type GmailReaderNodeData = {
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

type GmailReaderNodeType = Node<GmailReaderNodeData>;

const buildDescription = (data?: GmailReaderNodeData) => {
  if (!data?.credentialId) return "Not configured";

  const parts: string[] = [data.mailbox?.trim() || "INBOX"];
  if (data.subjectFilter?.trim()) {
    parts.push(`subject: "${data.subjectFilter.trim()}"`);
  }
  if (data.fromFilter?.trim()) {
    parts.push(`from: "${data.fromFilter.trim()}"`);
  }
  if (data.unreadOnly !== false) parts.push("unread");
  if (data.sinceDays) parts.push(`${data.sinceDays}d`);

  return parts.join(" • ");
};

export const GmailReaderNode = memo((props: NodeProps<GmailReaderNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: GMAIL_READER_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchGmailReaderRealtimeToken,
  });

  const handleOpenSettings = () => {
    setDialogOpen(true);
  };

  const handleSubmit = (values: GmailReaderFormValues) => {
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

  return (
    <>
      <GmailReaderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/logos/gmail.svg"
        name="Gmail Reader"
        status={nodeStatus}
        description={buildDescription(nodeData)}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

GmailReaderNode.displayName = "GmailReaderNode";