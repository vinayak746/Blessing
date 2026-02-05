"use client";

import {
  CheckCircle2Icon,
  CloudIcon,
  CloudOffIcon,
  AlertCircleIcon,
  Loader2Icon,
  CircleDotIcon,
  SaveIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import type { AutoSaveStatus } from "../hooks/use-auto-save";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
  onSave?: () => void;
  className?: string;
}

export const AutoSaveIndicator = ({
  status,
  lastSavedAt,
  onSave,
  className,
}: AutoSaveIndicatorProps) => {
  // Track visibility - show only when saving, just saved, error, or unsaved
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  
  useEffect(() => {
    if (status === "saved") {
      setShowSavedIndicator(true);
      const timer = setTimeout(() => {
        setShowSavedIndicator(false);
      }, 2500); // Hide after 2.5 seconds
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Only show for: saving, saved (briefly), error, unsaved, offline
  const shouldShow = status === "saving" || 
                     (status === "saved" && showSavedIndicator) || 
                     status === "error" || 
                     status === "unsaved" ||
                     status === "offline";

  const getStatusContent = () => {
    switch (status) {
      case "saving":
        return {
          icon: <Loader2Icon className="size-3.5 animate-spin" />,
          text: "Saving...",
          variant: "secondary" as const,
          bgColor: "bg-blue-500/10 border-blue-500/20",
          textColor: "text-blue-600 dark:text-blue-400",
        };
      case "saved":
        return {
          icon: <CheckCircle2Icon className="size-3.5" />,
          text: "Saved",
          variant: "secondary" as const,
          bgColor: "bg-green-500/10 border-green-500/20",
          textColor: "text-green-600 dark:text-green-400",
        };
      case "unsaved":
        return {
          icon: <CircleDotIcon className="size-3.5" />,
          text: "Unsaved changes",
          variant: "secondary" as const,
          bgColor: "bg-amber-500/10 border-amber-500/20",
          textColor: "text-amber-600 dark:text-amber-400",
        };
      case "error":
        return {
          icon: <AlertCircleIcon className="size-3.5" />,
          text: "Save failed",
          variant: "destructive" as const,
          bgColor: "bg-red-500/10 border-red-500/20",
          textColor: "text-red-600 dark:text-red-400",
        };
      case "offline":
        return {
          icon: <CloudOffIcon className="size-3.5" />,
          text: "Offline",
          variant: "secondary" as const,
          bgColor: "bg-gray-500/10 border-gray-500/20",
          textColor: "text-gray-600 dark:text-gray-400",
        };
      case "idle":
      default:
        return {
          icon: <CloudIcon className="size-3.5" />,
          text: lastSavedAt
            ? `Saved ${formatDistanceToNow(lastSavedAt, { addSuffix: true })}`
            : "All changes saved",
          variant: "outline" as const,
          bgColor: "bg-background/80",
          textColor: "text-muted-foreground",
        };
    }
  };

  const { icon, text, bgColor, textColor } = getStatusContent();
  const isClickable = status === "error" || status === "unsaved";

  // Don't render if we shouldn't show
  if (!shouldShow) {
    return null;
  }

  return (
    <button
      type="button"
      disabled={!isClickable}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-all duration-200 animate-in fade-in slide-in-from-left-2",
        bgColor,
        textColor,
        isClickable && "cursor-pointer hover:opacity-80 active:scale-95",
        !isClickable && "cursor-default",
        className
      )}
      onClick={isClickable ? onSave : undefined}
      title={isClickable ? "Click to save (Ctrl+S)" : `Status: ${text}`}
    >
      {icon}
      <span className="font-medium">{text}</span>
      {isClickable && (
        <kbd className="ml-1 hidden sm:inline-flex h-4 items-center rounded bg-muted px-1 font-mono text-[10px] text-muted-foreground">
          ⌘S
        </kbd>
      )}
    </button>
  );
};