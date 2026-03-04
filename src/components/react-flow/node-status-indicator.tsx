import { type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type NodeStatus = "loading" | "success" | "error" | "initial" | "healing";

export type NodeStatusVariant = "overlay" | "border";

export type NodeStatusIndicatorProps = {
  status?: NodeStatus;
  variant?: NodeStatusVariant;
  children: ReactNode;
  className?: string;
};

export const SpinnerLoadingIndicator = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <div className="relative">
      <StatusBorder className="border-blue-700/40">{children}</StatusBorder>

      <div className="bg-background/50 absolute inset-0 z-50 rounded-[9px] backdrop-blur-xs" />
      <div className="absolute inset-0 z-50">
        <span className="absolute top-[calc(50%-1.25rem)] left-[calc(50%-1.25rem)] inline-block h-10 w-10 animate-ping rounded-full bg-blue-700/20" />

        <LoaderCircle className="absolute top-[calc(50%-0.75rem)] left-[calc(50%-0.75rem)] size-6 animate-spin text-blue-700" />
      </div>
    </div>
  );
};

export const BorderLoadingIndicator = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <>
      <div className="absolute -top-[2px] -left-[2px] h-[calc(100%+4px)] w-[calc(100%+4px)]">
        <style>
          {`
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .spinner {
          animation: spin 2s linear infinite;
          position: absolute;
          left: 50%;
          top: 50%;
          width: 140%;
          aspect-ratio: 1;
          transform-origin: center;
        }
      `}
        </style>
        <div className={cn("absolute inset-0 overflow-hidden rounded-sm",
          className,
        )}>
          <div className="spinner rounded-full bg-[conic-gradient(from_0deg_at_50%_50%,rgba(42,67,233,0.5)_0deg,rgba(42,138,246,0)_360deg)]" />
        </div>
      </div>
      {children}
    </>
  );
};

const StatusBorder = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <>
      <div
        className={cn(
          "absolute -top-[2px] -left-[2px] h-[calc(100%+4px)] w-[calc(100%+4px)] rounded-md border-3",
          className,
        )}
      />
      {children}
    </>
  );
};

export const HealingBorderIndicator = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <>
      <div className="absolute -top-[2px] -left-[2px] h-[calc(100%+4px)] w-[calc(100%+4px)]">
        <style>
          {`
        @keyframes healing-spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes healing-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .healing-spinner {
          animation: healing-spin 3s linear infinite;
          position: absolute;
          left: 50%;
          top: 50%;
          width: 140%;
          aspect-ratio: 1;
          transform-origin: center;
        }
        .healing-pulse {
          animation: healing-pulse 1.5s ease-in-out infinite;
        }
        `}
        </style>
        <div className={cn("absolute inset-0 overflow-hidden rounded-sm healing-pulse", className)}>
          <div className="healing-spinner rounded-full bg-[conic-gradient(from_0deg_at_50%_50%,rgba(217,169,52,0.6)_0deg,rgba(245,158,11,0)_360deg)]" />
        </div>
      </div>
      {children}
    </>
  );
};

export const NodeStatusIndicator = ({
  status,
  variant = "border",
  children,
  className,
}: NodeStatusIndicatorProps) => {
  switch (status) {
    case "loading":
      switch (variant) {
        case "overlay":
          return <SpinnerLoadingIndicator>{children}</SpinnerLoadingIndicator>;
        case "border":
          return <BorderLoadingIndicator className={className}>{children}</BorderLoadingIndicator>;
        default:
          return <>{children}</>;
      }
    case "healing":
      return <HealingBorderIndicator className={className}>{children}</HealingBorderIndicator>;
    case "success":
      return (
        <StatusBorder className={cn("border-green-700/50",className)}>{children}</StatusBorder>
      );
    case "error":
      return <StatusBorder className={cn("border-red-700/50",className)}>{children}</StatusBorder>;
    default:
      return <>{children}</>;
  }
};
