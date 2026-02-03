"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  History,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ExecutionHistoryPanelProps {
  workflowId: string;
}

const statusConfig = {
  SUCCESS: {
    icon: CheckCircle2,
    label: "Success",
    className: "text-emerald-500",
    bgClassName: "bg-emerald-500/10",
  },
  FAILED: {
    icon: XCircle,
    label: "Failed",
    className: "text-red-500",
    bgClassName: "bg-red-500/10",
  },
  RUNNING: {
    icon: Loader2,
    label: "Running",
    className: "text-blue-500 animate-spin",
    bgClassName: "bg-blue-500/10",
  },
  PENDING: {
    icon: Clock,
    label: "Pending",
    className: "text-amber-500",
    bgClassName: "bg-amber-500/10",
  },
} as const;

function formatDuration(startedAt: Date, completedAt: Date | null): string {
  if (!completedAt) return "—";
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export function ExecutionHistoryPanel({ workflowId }: ExecutionHistoryPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const trpc = useTRPC();
  
  const { data: executions, isLoading } = useQuery(
    trpc.executions.getByWorkflow.queryOptions(
      { workflowId, limit: 5 },
      { refetchInterval: 5000 } // Poll every 5s for live updates
    )
  );

  if (isCollapsed) {
    return (
      <div className="absolute bottom-4 right-4 z-10 max-md:bottom-16 max-md:right-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="bg-background/95 backdrop-blur-sm shadow-lg border-border/50"
        >
          <History className="size-4 md:mr-2" />
          <span className="hidden md:inline">History</span>
          <ChevronRight className="size-3 ml-1 hidden md:block" />
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 z-10 w-72 max-md:w-[calc(100vw-1rem)] max-md:bottom-16 max-md:right-2 max-md:left-2 bg-background/95 backdrop-blur-sm rounded-lg border border-border/50 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <History className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Recent Runs</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => setIsCollapsed(true)}
        >
          <ChevronDown className="size-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !executions?.length ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-2">
              <History className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No runs yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Executions will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {executions.map((execution) => {
              const status = statusConfig[execution.status as keyof typeof statusConfig] || statusConfig.PENDING;
              const StatusIcon = status.icon;
              
              return (
                <Link
                  key={execution.id}
                  href={`/executions/${execution.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors group"
                >
                  {/* Status Icon */}
                  <div className={cn("size-7 rounded-full flex items-center justify-center", status.bgClassName)}>
                    <StatusIcon className={cn("size-4", status.className)} />
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-medium", status.className)}>
                        {status.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.startedAt, execution.completedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
                    </p>
                  </div>
                  
                  {/* Arrow */}
                  <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {executions && executions.length > 0 && (
        <div className="px-3 py-2 border-t border-border/50 bg-muted/30">
          <Link 
            href="/executions" 
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all executions →
          </Link>
        </div>
      )}
    </div>
  );
}
