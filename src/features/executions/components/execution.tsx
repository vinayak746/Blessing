"use client";
import { ExecutionStatus } from "@prisma/client";
import {
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
  ClockIcon,
  CopyIcon,
  CheckIcon,
} from "lucide-react";
import { FormatDistanceFn, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useSuspenseExecution } from "../hooks/use-executions";

// Helper function to format output with proper newlines
const formatOutput = (output: unknown): string => {
  const formatted = JSON.stringify(output, null, 2);
  // Replace escaped newlines within string values with actual newlines
  // This regex matches \n inside JSON string values
  return formatted.replace(/\\n/g, '\n');
};

const getStatusIcon = (status: ExecutionStatus) => {
  switch (status) {
    case ExecutionStatus.SUCCESS:
      return <CheckCircle2Icon className="size-5 text-green-600" />;
    case ExecutionStatus.FAILED:
      return <XCircleIcon className="size-5 text-red-600" />;
    case ExecutionStatus.RUNNING:
      return <Loader2Icon className="size-5 text-blue-600 animate-spin" />;
    default:
      return <ClockIcon className="size-5 text-muted-foreground" />;
  }
};
const formatStatus = (status: ExecutionStatus) => {
  return status.charAt(0) + status.slice(1).toLowerCase();
};

export const ExecutionView = ({ executionId }: { executionId: string }) => {
  const { data: execution } = useSuspenseExecution(executionId);
  const [showStackTrace, setShowStackTrace] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Clipboard API unavailable or permission denied — silently fail
    });
  }, []);

  const duration = execution.completedAt
    ? Math.round(
        (new Date(execution.completedAt).getTime() -
          new Date(execution.startedAt).getTime()) /
          1000
      )
    : null;

  return (
    <Card className="shadow-none">
      {/* ... rest of the component stays the same until line 151 ... */}
      <CardHeader>
        <div className="flex items-center gap-3">
          {getStatusIcon(execution.status)}
          <div>
            <CardTitle>{formatStatus(execution.status)}</CardTitle>
            <CardDescription>
              Execution for {execution.workflow.name}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Workflow
            </p>
            <Link
              prefetch
              className="text-sm hover:underline text-primary"
              href={`/workflows/${execution.workflowId}`}
            >
              {execution.workflow.name}
            </Link>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className="text-sm">{formatStatus(execution.status)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Started</p>
            <p className="text-sm">
              {formatDistanceToNow(execution.startedAt, { addSuffix: true })}
            </p>
          </div>
          {execution.completedAt ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Completed
              </p>
              <p className="text-sm">
                {formatDistanceToNow(execution.completedAt, {
                  addSuffix: true,
                })}
              </p>
            </div>
          ) : null}
          {duration !== null ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Duration
              </p>
              <p className="text-sm">{duration}s</p>
            </div>
          ) : null}

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Event ID
            </p>
            <p className="text-sm">{execution.inngestEventId}</p>
          </div>
        </div>
        {execution.error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-card rounded-lg border border-red-200 dark:border-destructive/30 space-y-3">
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-destructive mb-2">Error</p>
              <p className="text-sm text-red-800 dark:text-muted-foreground font-mono">
                {execution.error}
              </p>
            </div>
            {execution.errorStack && (
              <Collapsible
                open={showStackTrace}
                onOpenChange={setShowStackTrace}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-900 dark:text-primary hover:bg-red-100 dark:hover:bg-accent"
                  >
                    {showStackTrace ? "Hide stack trace" : "Show stack trace"}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="text-xs font-mono text-red-800 dark:text-muted-foreground/80 overflow-auto mt-2 p-3 bg-red-100 dark:bg-muted rounded-md border dark:border-border">
                    {execution.errorStack}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
        {execution.output != null && (() => {
          const formattedOutput = formatOutput(execution.output);
          return (
            <div className="mt-6 p-4 bg-muted rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Output</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopy(formattedOutput)}
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="size-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <CopyIcon className="size-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="text-xs font-mono overflow-auto whitespace-pre-wrap">
                  {formattedOutput}
                </pre>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
};