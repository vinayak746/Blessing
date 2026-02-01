"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValidationIssue } from "../hooks/use-workflow-validation";

interface ValidationIndicatorProps {
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  isValid: boolean;
}

export function ValidationIndicator({
  issues,
  errors,
  warnings,
  isValid,
}: ValidationIndicatorProps) {
  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
        <CheckCircle2 className="size-3.5" />
        <span>Valid</span>
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
            "h-auto px-2.5 py-1.5 gap-1.5 text-xs font-medium",
            errors.length > 0
              ? "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
          )}
        >
          {errors.length > 0 ? (
            <XCircle className="size-3.5" />
          ) : (
            <AlertTriangle className="size-3.5" />
          )}
          <span>
            {errors.length > 0
              ? `${errors.length} error${errors.length > 1 ? "s" : ""}`
              : `${warnings.length} warning${warnings.length > 1 ? "s" : ""}`}
          </span>
          <ChevronDown className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="px-3 py-2 border-b bg-muted/30">
          <p className="text-sm font-medium">Workflow Issues</p>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {errors.length > 0 && (
            <div className="p-2">
              <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider px-2 py-1">
                Errors
              </p>
              {errors.map((error, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50"
                >
                  <XCircle className="size-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/80">{error.message}</p>
                </div>
              ))}
            </div>
          )}
          {warnings.length > 0 && (
            <div className="p-2">
              <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider px-2 py-1">
                Warnings
              </p>
              {warnings.map((warning, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50"
                >
                  <AlertTriangle className="size-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/80">{warning.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
