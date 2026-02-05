"use client";

import { PlusIcon } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { NodeSelector } from "@/components/node-selector";
import { useAtom } from "jotai";
import { nodeSelectorOpenAtom } from "../store/atoms";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";


export const AddNodeButton = memo(() => {
  const [selectorOpen, setSelectorOpen] = useAtom(nodeSelectorOpenAtom);
  // Simple mobile detection
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  if (isMobile) {
    return (
      <NodeSelector open={selectorOpen} onOpenChange={setSelectorOpen}>
        <Button
          size="icon"
          variant="outline"
          className="bg-background"
          aria-label="Add node (Shift+A)"
        >
          <PlusIcon className="size-4" />
        </Button>
      </NodeSelector>
    );
  }
  return (
    <Tooltip>
      <NodeSelector open={selectorOpen} onOpenChange={setSelectorOpen}>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="bg-background"
            aria-label="Add node (Shift+A)"
          >
            <PlusIcon className="size-4" />
          </Button>
        </TooltipTrigger>
      </NodeSelector>
      <TooltipContent side="bottom">
        <span>Add node</span>
        <kbd className="ml-1.5 px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Shift+A</kbd>
      </TooltipContent>
    </Tooltip>
  );
});

AddNodeButton.displayName = "AddNodeButton";