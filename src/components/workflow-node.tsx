"use client";

import { NodeToolbar } from "@xyflow/react";
import { SettingsIcon, TrashIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

interface WorkflowNodeProps {
  children: ReactNode;
  showToolbar?: boolean;
  onDelete?: () => void;
  onSettings?: () => void;
  name?: string;
  description?: string;
}

export const WorkflowNode = ({
  children,
  showToolbar = true,
  onDelete,
  onSettings,
  name,
  description,
}: WorkflowNodeProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this node?</AlertDialogTitle>
            <AlertDialogDescription>
              {name
                ? `This will remove "${name}" from your workflow.`
                : "This will remove this node from your workflow."}{" "}
              You can undo this action with Ctrl+Z.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showToolbar && (
        <NodeToolbar>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={onSettings}
                aria-label="Configure node settings"
              >
                <SettingsIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDeleteClick}
                aria-label="Delete node"
              >
                <TrashIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </NodeToolbar>
      )}
      {/* Wrap children and label in a container so label scales with zoom */}
      <div className="relative">
        {children}
        {name && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 text-center bg-background/95 backdrop-blur-sm rounded-md px-2.5 py-1.5 shadow-md border pointer-events-none">
            <p className="font-medium text-xs leading-tight max-w-[180px] truncate">{name}</p>
            {description && (
              <p className="text-[10px] text-muted-foreground max-w-[180px] truncate mt-0.5">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
};