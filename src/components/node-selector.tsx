"use client";

import { createId } from "@paralleldrive/cuid2";
import { useReactFlow } from "@xyflow/react";
import { GlobeIcon, MousePointerIcon, SearchIcon, XIcon } from "lucide-react";
import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { needsDarkInvert } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { NodeType } from "@prisma/client";
import { Separator } from "./ui/separator";
import { ShieldAlertIcon } from "lucide-react";

export type NodeTypeOption = {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }> | string;
};

const triggerNodes: NodeTypeOption[] = [
  {
    type: NodeType.MANUAL_TRIGGER,
    label: "Trigger Manually",
    description:
      "Click a button to run your workflow. Perfect for testing!",
    icon: MousePointerIcon,
  },
  {
    type: NodeType.GOOGLE_FORM_TRIGGER,
    label: "Google Form",
    description:
      "Automatically runs when someone submits your Google Form.",
    icon: "/logos/googleform.svg",
  },
  {
    type: NodeType.STRIPE_TRIGGER,
    label: "Stripe Event",
    description:
      "Automatically runs when payments or subscriptions happen.",
    icon: "/logos/stripe.svg",
  },
];

const executionNodes: NodeTypeOption[] = [
  {
    type: NodeType.HTTP_REQUEST,
    label: "HTTP Request",
    description: "Call any web API or service to get or send data.",
    icon: GlobeIcon,
  },
  {
    type: NodeType.GEMINI,
    label: "Gemini",
    description: "Use Google's AI to analyze text, answer questions, and more.",
    icon: "/logos/gemini.svg",
  },
  {
    type: NodeType.OPENAI,
    label: "OpenAI",
    description: "Use ChatGPT to generate text, summaries, or creative content.",
    icon: "/logos/openai.svg",
  },
  {
    type: NodeType.ANTHROPIC,
    label: "Anthropic",
    description: "Use Claude AI for helpful, safe, and honest responses.",
    icon: "/logos/anthropic.svg",
  },
  {
    type: NodeType.DISCORD,
    label: "Discord",
    description: "Send messages or notifications to a Discord channel.",
    icon: "/logos/discord.svg",
  },
  {
    type: NodeType.SLACK,
    label: "Slack",
    description: "Send messages or notifications to a Slack channel.",
    icon: "/logos/slack.svg",
  },
  {
    type: NodeType.WHATSAPP,
    label: "WhatsApp",
    description: "Send WhatsApp messages to your contacts.",
    icon: "/logos/whatsapp.svg",
  },
];

const utilityNodes: NodeTypeOption[] = [
  {
    type: NodeType.SELF_HEALING,
    label: "Self-Healing",
    description: "AI-powered error recovery. Wraps the next node and auto-fixes failures.",
    icon: ShieldAlertIcon,
  },
];

interface NodeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function NodeSelector({
  open,
  onOpenChange,
  children,
}: NodeSelectorProps) {
  const { setNodes, getNodes, screenToFlowPosition } = useReactFlow();
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when sheet opens
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      // Small delay to ensure sheet is mounted
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Filter nodes based on search query
  const filteredTriggerNodes = useMemo(() => {
    if (!searchQuery.trim()) return triggerNodes;
    const query = searchQuery.toLowerCase();
    return triggerNodes.filter(
      (node) =>
        node.label.toLowerCase().includes(query) ||
        node.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const filteredExecutionNodes = useMemo(() => {
    if (!searchQuery.trim()) return executionNodes;
    const query = searchQuery.toLowerCase();
    return executionNodes.filter(
      (node) =>
        node.label.toLowerCase().includes(query) ||
        node.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const filteredUtilityNodes = useMemo(() => {
    if (!searchQuery.trim()) return utilityNodes;
    const query = searchQuery.toLowerCase();
    return utilityNodes.filter(
      (node) =>
        node.label.toLowerCase().includes(query) ||
        node.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const hasResults = filteredTriggerNodes.length > 0 || filteredExecutionNodes.length > 0 || filteredUtilityNodes.length > 0;

  const handleNodeSelect = useCallback(
    (selection: NodeTypeOption) => {
      // Check if trying to add a manual trigger when one already exists
      if (selection.type === NodeType.MANUAL_TRIGGER) {
        const nodes = getNodes();
        const hasManualTrigger = nodes.some(
          (node) => node.type === NodeType.MANUAL_TRIGGER,
        );
        if (hasManualTrigger) {
          toast.error("Only one Manual Trigger node is allowed per workflow.");
          return;
        }
      }
      setNodes((nodes) => {
        const hasInitialTrigger = nodes.some(
          (node) => node.type === NodeType.INITIAL,
        );
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const flowPosition = screenToFlowPosition({
          x: centerX + (Math.random() - 0.5) * 200,
          y: centerY + (Math.random() - 0.5) * 200,
        });
        const newNode = {
          id: createId(),
          data: {},
          position: flowPosition,
          type: selection.type,
        };
        if (hasInitialTrigger) {
          return [newNode];
        }
        return [...nodes, newNode];
      });
      onOpenChange(false);
    },
    [getNodes, onOpenChange, screenToFlowPosition, setNodes],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <div className="p-6 pb-0">
          <SheetHeader>
            <SheetTitle>Add a Node</SheetTitle>
            <SheetDescription className="text-sm">
              <strong>Triggers</strong> start your workflow. <strong>Actions</strong> do the work.
              <span className="hidden sm:inline"><br /></span>
              <span className="sm:text-xs block sm:inline mt-1 sm:mt-0">Connect them by dragging from right handle → left handle.</span>
            </SheetDescription>
          </SheetHeader>

          {/* Search Input */}
          <div className="relative mt-4">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-10 bg-muted/50 border-muted-foreground/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <XIcon className="size-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4">
          {!hasResults && (
            <div className="py-12 text-center">
              <SearchIcon className="size-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No nodes found for "{searchQuery}"</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
            </div>
          )}

          {filteredTriggerNodes.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                Triggers
              </p>
              <div className="space-y-1">
                {filteredTriggerNodes.map((nodeType) => {
                  const Icon = nodeType.icon;
                  return (
                    <div
                      key={nodeType.type}
                      role="button"
                      tabIndex={0}
                      className="group flex items-center gap-3 p-3 mx-1 rounded-lg cursor-pointer
                        hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-150"
                      onClick={() => handleNodeSelect(nodeType)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleNodeSelect(nodeType);
                        if (e.key === " ") { e.preventDefault(); handleNodeSelect(nodeType); }
                      }}
                    >
                      <div className="flex items-center justify-center size-10 rounded-lg bg-muted border border-border/50 group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                        {typeof Icon === "string" ? (
                          <img
                            src={Icon}
                            alt={nodeType.label}
                            className={`size-5 object-contain${needsDarkInvert(Icon) ? " dark:invert" : ""}`}
                          />
                        ) : (
                          <Icon className="size-5 text-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {nodeType.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {nodeType.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredExecutionNodes.length > 0 && (
            <div>
              {filteredTriggerNodes.length > 0 && <Separator className="my-4" />}
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                Actions
              </p>
              <div className="space-y-1">
                {filteredExecutionNodes.map((nodeType) => {
                  const Icon = nodeType.icon;
                  return (
                    <div
                      key={nodeType.type}
                      role="button"
                      tabIndex={0}
                      className="group flex items-center gap-3 p-3 mx-1 rounded-lg cursor-pointer
                        hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-150"
                      onClick={() => handleNodeSelect(nodeType)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleNodeSelect(nodeType);
                        if (e.key === " ") { e.preventDefault(); handleNodeSelect(nodeType); }
                      }}
                    >
                      <div className="flex items-center justify-center size-10 rounded-lg bg-muted border border-border/50 group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                        {typeof Icon === "string" ? (
                          <img
                            src={Icon}
                            alt={nodeType.label}
                            className={`size-5 object-contain${needsDarkInvert(Icon) ? " dark:invert" : ""}`}
                          />
                        ) : (
                          <Icon className="size-5 text-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {nodeType.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {nodeType.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredUtilityNodes.length > 0 && (
            <div>
              {(filteredTriggerNodes.length > 0 || filteredExecutionNodes.length > 0) && <Separator className="my-4" />}
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                Utility
              </p>
              <div className="space-y-1">
                {filteredUtilityNodes.map((nodeType) => {
                  const Icon = nodeType.icon;
                  return (
                    <div
                      key={nodeType.type}
                      role="button"
                      tabIndex={0}
                      className="group flex items-center gap-3 p-3 mx-1 rounded-lg cursor-pointer
                        hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-150"
                      onClick={() => handleNodeSelect(nodeType)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleNodeSelect(nodeType);
                        if (e.key === " ") { e.preventDefault(); handleNodeSelect(nodeType); }
                      }}
                    >
                      <div className="flex items-center justify-center size-10 rounded-lg bg-amber-500/10 border border-amber-500/30 group-hover:border-amber-500/60 group-hover:bg-amber-500/20 transition-colors">
                        {typeof Icon === "string" ? (
                          <img
                            src={Icon}
                            alt={nodeType.label}
                            className={`size-5 object-contain${needsDarkInvert(Icon) ? " dark:invert" : ""}`}
                          />
                        ) : (
                          <Icon className="size-5 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {nodeType.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {nodeType.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="p-4 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-mono">⇧A</kbd> to open this panel
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
