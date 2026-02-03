"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HelpCircle,
  Lightbulb,
  ArrowRight,
  MousePointer,
  Link2,
  Play,
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Local storage key
const GUIDE_SHOWN_KEY = "blessing-workflow-guide-shown";
const TIPS_DISMISSED_KEY = "blessing-tips-dismissed";

interface TipStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  example?: string;
}

const guideSteps: TipStep[] = [
  {
    title: "Welcome to the Workflow Editor!",
    description:
      "A workflow automates tasks by connecting different actions together. Think of it like a recipe - you define the steps, and the system follows them automatically.",
    icon: <Sparkles className="size-6 text-primary" />,
  },
  {
    title: "Step 1: Add a Trigger",
    description:
      "Every workflow needs a trigger - this is what starts your workflow. You can trigger manually (for testing), or automatically when a Google Form is submitted or a Stripe payment happens.",
    icon: <MousePointer className="size-6 text-blue-500" />,
    example: "Click the + button (top right) or press Shift+A to add a node",
  },
  {
    title: "Step 2: Add Actions",
    description:
      "Actions are what your workflow does. Send a Discord message, use AI to process text, make an HTTP request, or send a Slack notification.",
    icon: <Lightbulb className="size-6 text-yellow-500" />,
    example: "Try adding an OpenAI or Discord node after your trigger",
  },
  {
    title: "Step 3: Connect Nodes",
    description:
      "Drag from the output handle (circle on the right) of one node to the input handle (circle on the left) of another. This creates a connection and lets data flow between them.",
    icon: <Link2 className="size-6 text-green-500" />,
    example: "Data flows from left to right, like reading a book",
  },
  {
    title: "Step 4: Configure & Run",
    description:
      "Click the settings icon on each node to configure it. Once everything is connected, click 'Execute Workflow' to run it!",
    icon: <Play className="size-6 text-purple-500" />,
    example: "Check the validation indicator to make sure everything is set up correctly",
  },
  {
    title: "Tips for Mobile Users",
    description:
      "On mobile: Double-tap a connection line to delete it. Drag with one finger to pan around the canvas. Use the + button at the top right to add new nodes.",
    icon: <MousePointer className="size-6 text-orange-500" />,
    example: "Use the zoom controls at the bottom left to adjust your view",
  },
];

// Quick contextual tips shown in the editor
const contextualTips = [
  {
    id: "trigger",
    text: "💡 Tip: Start with a trigger! It determines when your workflow runs.",
    condition: (hasNodes: boolean, hasTrigger: boolean) => !hasNodes,
  },
  {
    id: "connect",
    text: "💡 Tip: Connect nodes by dragging from the right handle to the left handle of another node.",
    condition: (hasNodes: boolean, hasTrigger: boolean, hasConnections: boolean) =>
      hasNodes && !hasConnections,
  },
  {
    id: "action",
    text: "💡 Tip: Add action nodes to make your workflow do something useful!",
    condition: (hasNodes: boolean, hasTrigger: boolean, hasConnections: boolean, hasActions: boolean) =>
      hasTrigger && !hasActions,
  },
];

interface BeginnerGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BeginnerGuideDialog({ open, onOpenChange }: BeginnerGuideDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem(GUIDE_SHOWN_KEY, "true");
      onOpenChange(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(GUIDE_SHOWN_KEY, "true");
    onOpenChange(false);
  };

  const step = guideSteps[currentStep];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {step.icon}
            <DialogTitle>{step.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        {step.example && (
          <div className="bg-muted/50 rounded-lg p-4 border">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <ArrowRight className="size-4 text-primary" />
              {step.example}
            </p>
          </div>
        )}

        {/* Step indicators */}
        <div className="flex justify-center gap-1.5 py-2">
          {guideSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "size-2 rounded-full transition-all",
                index === currentStep
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="ghost" onClick={handleSkip}>
            Skip guide
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="size-4 mr-1" />
                Back
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep === guideSteps.length - 1 ? (
                "Get Started"
              ) : (
                <>
                  Next
                  <ChevronRight className="size-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Help button that shows the guide
export function HelpButton() {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowGuide(true)}
            className="size-8"
          >
            <HelpCircle className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Need help? View the guide</TooltipContent>
      </Tooltip>

      <BeginnerGuideDialog open={showGuide} onOpenChange={setShowGuide} />
    </>
  );
}

// Hook to check if user is new
export function useIsNewUser() {
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem(GUIDE_SHOWN_KEY);
    setIsNew(!hasSeenGuide);
  }, []);

  return isNew;
}

// Contextual tip banner that shows in the editor
interface ContextualTipProps {
  hasNodes: boolean;
  hasTrigger: boolean;
  hasConnections: boolean;
  hasActions: boolean;
}

export function ContextualTip({
  hasNodes,
  hasTrigger,
  hasConnections,
  hasActions,
}: ContextualTipProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem(TIPS_DISMISSED_KEY);
    if (wasDismissed) setDismissed(true);
  }, []);

  if (dismissed) return null;

  // Find the first matching tip
  const activeTip = contextualTips.find((tip) =>
    tip.condition(hasNodes, hasTrigger, hasConnections, hasActions)
  );

  if (!activeTip) return null;

  const handleDismiss = () => {
    localStorage.setItem(TIPS_DISMISSED_KEY, "true");
    setDismissed(true);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20 text-sm">
      <span>{activeTip.text}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-5 hover:bg-primary/20"
        onClick={handleDismiss}
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}

// Quick tips panel for the side
export function QuickTipsPanel() {
  const tips = [
    { icon: "⌨️", text: "Press Shift+A to quickly add nodes" },
    { icon: "💾", text: "Ctrl+S to save, but we auto-save too!" },
    { icon: "↩️", text: "Ctrl+Z to undo, Ctrl+Y to redo" },
    { icon: "🔍", text: "Press F to fit all nodes in view" },
    { icon: "📋", text: "Ctrl+C/V to copy and paste nodes" },
  ];

  return (
    <div className="p-4 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Lightbulb className="size-4 text-yellow-500" />
        Quick Tips
      </h3>
      <ul className="space-y-2">
        {tips.map((tip, i) => (
          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
            <span>{tip.icon}</span>
            <span>{tip.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
