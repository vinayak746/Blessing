"use client";

import { type NodeProps, Position, useReactFlow } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { Fragment, memo, type ReactNode } from "react";
import { BaseNode, BaseNodeContent } from "@/components/react-flow/base-node";
import { BaseHandle } from "@/components/react-flow/base-handle";
import { WorkflowNode } from "@/components/workflow-node";
import {
  type NodeStatus,
  NodeStatusIndicator,
} from "@/components/react-flow/node-status-indicator";
import { needsDarkInvert } from "@/lib/utils";

interface BaseExecutionNodeProps extends NodeProps {
  icon: LucideIcon | string;
  name: string;
  description?: string;
  children?: ReactNode;
  status?: NodeStatus;
  /**
   * Named output handles, e.g. True / False for a conditional node. Omit for
   * the normal single output. The `id` is what gets saved on the connection.
   */
  outputs?: { id: string; label: string }[];
  onSettings?: () => void;
  onDoubleClick?: () => void;
}

export const BaseExecutionNode = memo(
  ({
    id,
    icon: Icon,
    name,
    description,
    children,
    status = "initial",
    outputs,
    onSettings,
    onDoubleClick,
  }: BaseExecutionNodeProps) => {
    const { setNodes, setEdges } = useReactFlow();
    // TODO: add delete method
    const handleDelete = () => {
      setNodes((currentNodes) => {
        const updatedNodes = currentNodes.filter((node) => node.id !== id);
        return updatedNodes;
      });
      setEdges((currentEdges) => {
        const updatedEdges = currentEdges.filter(
          (edge) => edge.source !== id && edge.target !== id,
        );
        return updatedEdges;
      });
    };

    return (
      <WorkflowNode
        name={name}
        description={description}
        onDelete={handleDelete}
        onSettings={onSettings}
      >
        <NodeStatusIndicator status={status} variant="border">
          <BaseNode status={status} onDoubleClick={onDoubleClick}>
            {/* Nodes with several outputs (IF / Else) get a taller body so
                their handles and labels have room and don't crowd each other. */}
            <BaseNodeContent
              className={
                outputs && outputs.length > 1
                  ? "min-h-[4.5rem] justify-center"
                  : undefined
              }
            >
              {typeof Icon === "string" ? (
                <Image
                  src={Icon}
                  alt={name}
                  width={16}
                  height={16}
                  className={needsDarkInvert(Icon) ? "dark:invert" : ""}
                />
              ) : (
                <Icon className="size-4 text-muted-foreground" />
              )}
              {children}
              <BaseHandle
                id="target-1"
                type="target"
                position={Position.Left}
              />
              {outputs && outputs.length > 0 ? (
                outputs.map((output, index) => {
                  const top = `${((index + 1) * 100) / (outputs.length + 1)}%`;
                  return (
                    <Fragment key={output.id}>
                      <BaseHandle
                        id={output.id}
                        type="source"
                        position={Position.Right}
                        style={{ top }}
                      />
                      <span
                        className="pointer-events-none absolute left-full z-10 ml-3 -translate-y-1/2 rounded bg-background/90 px-1 py-px text-[10px] font-semibold leading-none text-muted-foreground"
                        style={{ top }}
                      >
                        {output.label}
                      </span>
                    </Fragment>
                  );
                })
              ) : (
                <BaseHandle
                  id="source-1"
                  type="source"
                  position={Position.Right}
                />
              )}
            </BaseNodeContent>
          </BaseNode>
        </NodeStatusIndicator>
      </WorkflowNode>
    );
  },
);
BaseExecutionNode.displayName = "BaseExecutionNode";
