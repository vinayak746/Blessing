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
import { FlaskConicalIcon, XCircle, Lightbulb, AlertTriangle } from "lucide-react";
import type { ValidationIssue } from "../hooks/use-workflow-validation";

interface ExecuteWorkflowButtonProps {
  workflowId: string;
  canExecute?: boolean;
  validationErrors?: ValidationIssue[];
}

export const ExecuteWorkflowButton = ({
  workflowId,
  canExecute = true,
  validationErrors = [],
}: ExecuteWorkflowButtonProps) => {
  const executeWorkflow = useExecuteWorkflow();
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const handleExecute = () => {
    if (!canExecute && validationErrors.length > 0) {
      setShowErrorDialog(true);
      return;
    }
    executeWorkflow.mutate({ id: workflowId });
  };

  return (
    <>
      <Button
        size="lg"
        onClick={handleExecute}
        disabled={executeWorkflow.isPending}
        variant={canExecute ? "default" : "destructive"}
        className="text-sm sm:text-base px-3 sm:px-4"
      >
        <FlaskConicalIcon className="size-4" />
        <span className="hidden sm:inline">
          {canExecute ? "Execute Workflow" : "Cannot Run - Fix Issues"}
        </span>
        <span className="sm:hidden">
          {canExecute ? "Run" : "Fix Issues"}
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
                      <p className="text-xs text-muted-foreground flex items-start gap-1">
                        <Lightbulb className="size-3 mt-0.5 shrink-0 text-amber-500" />
                        {error.hint}
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