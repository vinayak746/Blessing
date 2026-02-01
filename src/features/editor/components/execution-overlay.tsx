"use client";

import { useEffect, useState } from "react";
import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeExecutionStatus {
  nodeId: string;
  status: "pending" | "running" | "success" | "error";
}

interface ExecutionOverlayProps {
  isExecuting: boolean;
  nodeStatuses: NodeExecutionStatus[];
}

export const ExecutionOverlay = ({
  isExecuting,
  nodeStatuses,
}: ExecutionOverlayProps) => {
  if (!isExecuting) return null;

  return (
    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border rounded-lg p-6 shadow-lg max-w-sm w-full">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Loader2Icon className="size-5 animate-spin text-primary" />
          Running Workflow
        </h3>
        
        <div className="space-y-2">
          {nodeStatuses.map((node) => (
            <div
              key={node.nodeId}
              className={cn(
                "flex items-center gap-2 text-sm p-2 rounded",
                node.status === "running" && "bg-blue-50 text-blue-700",
                node.status === "success" && "bg-green-50 text-green-700",
                node.status === "error" && "bg-red-50 text-red-700",
                node.status === "pending" && "text-muted-foreground"
              )}
            >
              {node.status === "pending" && (
                <div className="size-4 rounded-full border-2" />
              )}
              {node.status === "running" && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              {node.status === "success" && (
                <CheckCircle2Icon className="size-4" />
              )}
              {node.status === "error" && (
                <XCircleIcon className="size-4" />
              )}
              <span>{node.nodeId}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};