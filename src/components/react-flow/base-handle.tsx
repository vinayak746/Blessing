import type { ComponentProps } from "react";
import { Handle, type HandleProps } from "@xyflow/react";

import { cn } from "@/lib/utils";

export type BaseHandleProps = HandleProps;

export function BaseHandle({
  className,
  children,
  ...props
}: ComponentProps<typeof Handle>) {
  return (
    <Handle
      {...props}
      className={cn(
        "h-[11px] w-[11px] rounded-full border border-border bg-card transition dark:border-border dark:bg-card",
        className,
      )}
    >
      {children}
    </Handle>
  );
}
