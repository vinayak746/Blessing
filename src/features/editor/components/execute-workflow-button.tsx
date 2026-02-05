"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useExecuteWorkflow } from "@/features/workflows/hooks/use-workflows";
import { FlaskConicalIcon, XCircle, Lightbulb, AlertTriangle, Loader2Icon } from "lucide-react";
import type { ValidationIssue } from "../hooks/use-workflow-validation";

interface ExecuteWorkflowButtonProps {
  workflowId: string;
  canExecute?: boolean;
  validationErrors?: ValidationIssue[];
  onSaveBeforeExecute?: () => void;
  hasUnsavedChanges?: boolean;
}

export const ExecuteWorkflowButton = ({
  workflowId,
  canExecute = true,
  validationErrors = [],
  onSaveBeforeExecute,
  hasUnsavedChanges = false,
}: ExecuteWorkflowButtonProps) => {
  const executeWorkflow = useExecuteWorkflow();
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [isSavingBeforeExecute, setIsSavingBeforeExecute] = useState(false);

  const handleExecute = async () => {
    if (!canExecute && validationErrors.length > 0) {
      setShowErrorDialog(true);
      return;
    }
    
    // Save first if there are unsaved changes
    if (hasUnsavedChanges && onSaveBeforeExecute) {
      setIsSavingBeforeExecute(true);
      
      try {
        onSaveBeforeExecute();
        // Give a small delay for save to process
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        setIsSavingBeforeExecute(false);
        return;
      }
      setIsSavingBeforeExecute(false);
    }
    
    executeWorkflow.mutate({ id: workflowId });
  };

  const isLoading = executeWorkflow.isPending || isSavingBeforeExecute;

  return (
    <>
      <Button
        size="lg"
        onClick={handleExecute}
        disabled={isLoading}
        variant={canExecute ? "default" : "destructive"}
        className="text-sm sm:text-base px-3 sm:px-4"
      >
        {isLoading ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <FlaskConicalIcon className="size-4" />
        )}
        <span className="hidden sm:inline">
          {isSavingBeforeExecute 
            ? "Saving..." 
            : canExecute 
              ? "Execute Workflow" 
              : "Cannot Run - Fix Issues"}
        </span>
        <span className="sm:hidden">
          {isSavingBeforeExecute ? "Saving..." : canExecute ? "Run" : "Fix Issues"}
        </span>
      </Button>

      {/* Error Dialog explaining why workflow can't run */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="size-5" />
              <DialogTitle>Workflow Can&apos;t Run Yet</DialogTitle>
            </div>
            <DialogDescription>
              Your workflow has some issues that need to be fixed before it can run.
              Don&apos;t worry - here&apos;s what you need to do:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4">
            {validationErrors.map((error, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
              >
                <div className="flex items-start gap-2">
                  <XCircle className="size-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{error.message}</p>
                    {error.hint && (
                      <p className="text-xs flex items-start gap-1.5 mt-1 px-2 py-1.5 rounded-md bg-muted/60 text-muted-foreground border border-border">
                        <Lightbulb className="size-3 mt-0.5 shrink-0 text-primary" />
                        <span>{error.hint}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowErrorDialog(false)}>
              Got it, I&apos;ll fix these
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};