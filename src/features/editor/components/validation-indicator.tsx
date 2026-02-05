"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  Info,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValidationIssue } from "../hooks/use-workflow-validation";

interface ValidationIndicatorProps {
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  infos?: ValidationIssue[];
  isValid: boolean;
  compact?: boolean; // For mobile view
}

export function ValidationIndicator({
  issues,
  errors,
  warnings,
  infos = [],
  isValid,
  compact = false,
}: ValidationIndicatorProps) {
  // If only info messages (like "start by adding a trigger"), show a friendly state
  if (issues.length === 0 || (errors.length === 0 && warnings.length === 0 && infos.length > 0)) {
    if (infos.length > 0) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-auto gap-1.5 text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20",
                compact ? "px-1.5 py-1" : "px-2.5 py-1.5"
              )}
            >
              <Info className={compact ? "size-4" : "size-3.5"} />
              {!compact && <span>Getting Started</span>}
              {!compact && <ChevronDown className="size-3" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[calc(100vw-2rem)] sm:w-80 p-0">
            <div className="px-3 py-2 border-b bg-muted/30">
              <p className="text-sm font-medium">Getting Started</p>
            </div>
            <div className="p-3">
              {infos.map((info, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="size-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{info.message}</p>
                      {info.hint && (
                        <p className="text-xs flex items-start gap-1.5 mt-2 px-2 py-1.5 rounded-md bg-muted/60 text-muted-foreground border border-border">
                          <Lightbulb className="size-3 mt-0.5 shrink-0 text-primary" />
                          <span>{info.hint}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <div className={cn(
        "flex items-center gap-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium",
        compact ? "px-1.5 py-1" : "px-2.5 py-1.5"
      )}>
        <CheckCircle2 className={compact ? "size-4" : "size-3.5"} />
        {!compact && <span>Ready to run</span>}
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-auto gap-1.5 text-xs font-medium",
            compact ? "px-1.5 py-1" : "px-2.5 py-1.5",
            errors.length > 0
              ? "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
          )}
        >
          {errors.length > 0 ? (
            <XCircle className={compact ? "size-4" : "size-3.5"} />
          ) : (
            <AlertTriangle className={compact ? "size-4" : "size-3.5"} />
          )}
          {compact ? (
            // Compact: just show number
            <span>{errors.length > 0 ? errors.length : warnings.length}</span>
          ) : (
            // Full: show descriptive text
            <>
              <span>
                {errors.length > 0
                  ? `${errors.length} issue${errors.length > 1 ? "s" : ""} to fix`
                  : `${warnings.length} suggestion${warnings.length > 1 ? "s" : ""}`}
              </span>
              <ChevronDown className="size-3" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[calc(100vw-2rem)] sm:w-96 p-0">
        <div className="px-3 py-2 border-b bg-muted/30">
          <p className="text-sm font-medium">
            {errors.length > 0 ? "Issues to Fix" : "Suggestions"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {errors.length > 0 
              ? "Fix these issues before running your workflow"
              : "Optional improvements for your workflow"
            }
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {errors.length > 0 && (
            <div className="p-2">
              <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                <XCircle className="size-3" />
                Must Fix ({errors.length})
              </p>
              {errors.map((error, i) => (
                <div
                  key={i}
                  className="px-2 py-2 rounded-md hover:bg-muted/50 mb-1"
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
          )}
          {warnings.length > 0 && (
            <div className="p-2">
              <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                <AlertTriangle className="size-3" />
                Suggestions ({warnings.length})
              </p>
              {warnings.map((warning, i) => (
                <div
                  key={i}
                  className="px-2 py-2 rounded-md hover:bg-muted/50 mb-1"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="size-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm text-foreground">{warning.message}</p>
                      {warning.hint && (
                        <p className="text-xs flex items-start gap-1.5 mt-1 px-2 py-1.5 rounded-md bg-muted/60 text-muted-foreground border border-border">
                          <Lightbulb className="size-3 mt-0.5 shrink-0 text-primary" />
                          <span>{warning.hint}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
