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
  Zap,
  Smartphone,
  Keyboard,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Local storage key
const GUIDE_SHOWN_KEY = "blessing-workflow-guide-shown";
const TIPS_DISMISSED_KEY = "blessing-tips-dismissed";

interface TipStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  example?: string;
  badge?: string;
}

const guideSteps: TipStep[] = [
  {
    title: "Welcome to Workflows!",
    description:
      "Automate your tasks by connecting different actions together. Think of it like a recipe — you define the steps, and we execute them automatically.",
    icon: <Sparkles className="size-5" />,
    badge: "Let's get started",
  },
  {
    title: "Add a Trigger",
    description:
      "Every workflow needs a trigger — this is what starts your automation. Trigger manually for testing, or automatically when events happen.",
    icon: <Zap className="size-5" />,
    example: "Click the + button or press Shift+A to add your first trigger",
    badge: "Step 1",
  },
  {
    title: "Add Actions",
    description:
      "Actions are what your workflow does. Send messages to Discord or Slack, use AI to process text, make API calls, and more.",
    icon: <Lightbulb className="size-5" />,
    example: "Popular: OpenAI for AI responses, Discord for notifications",
    badge: "Step 2",
  },
  {
    title: "Connect the Dots",
    description:
      "Drag from the output handle (●) on the right side of one node to the input handle on the left side of another. Data flows through these connections.",
    icon: <Link2 className="size-5" />,
    example: "Data flows left → right, like reading a sentence",
    badge: "Step 3",
  },
  {
    title: "Configure & Execute",
    description:
      "Click the settings icon ⚙️ on each node to configure it. When the validation indicator shows ✓, you're ready to execute!",
    icon: <Play className="size-5" />,
    example: "Use 'Execute Workflow' button to run your automation",
    badge: "Step 4",
  },
  {
    title: "Mobile Tips",
    description:
      "On mobile: Double-tap a connection to delete it. Tap and drag nodes to move them. Use pinch gestures to zoom in/out.",
    icon: <Smartphone className="size-5" />,
    example: "Tip: Select a node to see its settings toolbar",
    badge: "Pro tip",
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
  const isLastStep = currentStep === guideSteps.length - 1;
  const isFirstStep = currentStep === 0;

  // Persist dismissal regardless of how the dialog is closed
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      localStorage.setItem(GUIDE_SHOWN_KEY, "true");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 border-b bg-muted/30">
          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>

          {/* Badge */}
          {step.badge && (
            <span className="inline-block px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full mb-3">
              {step.badge}
            </span>
          )}

          {/* Icon and title */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              {step.icon}
            </div>
            <DialogTitle className="text-lg font-semibold">
              {step.title}
            </DialogTitle>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <DialogDescription className="text-[15px] leading-relaxed text-foreground">
            {step.description}
          </DialogDescription>

          {step.example && (
            <div className="flex items-start gap-3 p-3.5 bg-muted/60 dark:bg-muted/40 rounded-xl border border-border">
              <div className="mt-0.5 p-1 rounded-md bg-primary/10">
                <ArrowRight className="size-3.5 text-primary" />
              </div>
              <p className="text-sm text-foreground/80 dark:text-foreground/90 leading-relaxed">
                {step.example}
              </p>
            </div>
          )}

          {/* Step indicators */}
          <div className="flex justify-center items-center gap-1.5 pt-2">
            {guideSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/25 w-1.5 hover:bg-muted-foreground/40"
                )}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className={cn(isFirstStep && "invisible")}
          >
            <ChevronLeft className="size-4 mr-1" />
            Back
          </Button>

          <span className="text-xs text-muted-foreground">
            {currentStep + 1} of {guideSteps.length}
          </span>

          <Button
            size="sm"
            onClick={handleNext}
            className="min-w-[100px]"
          >
            {isLastStep ? (
              <>
                <CheckCircle2 className="size-4 mr-1.5" />
                Got it!
              </>
            ) : (
              <>
                Next
                <ChevronRight className="size-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Help button that shows the guide
export function HelpButton() {
  const [showGuide, setShowGuide] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGuide(true)}
          className="h-8 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="size-4" />
          <span className="hidden sm:inline text-xs">Help</span>
        </Button>
        <BeginnerGuideDialog open={showGuide} onOpenChange={setShowGuide} />
      </>
    );
  }
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGuide(true)}
            className="h-8 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="size-4" />
            <span className="hidden sm:inline text-xs">Help</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>View the beginner's guide</TooltipContent>
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
    <div className="flex items-center gap-2.5 px-3 py-2 bg-muted/50 rounded-xl border text-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <Lightbulb className="size-4 text-primary shrink-0" />
      <span className="text-foreground/90 text-xs sm:text-sm">{activeTip.text.replace("💡 Tip: ", "")}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 ml-auto hover:bg-muted shrink-0"
        onClick={handleDismiss}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}

// Quick tips panel for the side
export function QuickTipsPanel() {
  const tips = [
    { icon: <Keyboard className="size-3.5" />, text: "Shift+A to add nodes" },
    { icon: <Keyboard className="size-3.5" />, text: "Ctrl+S to save" },
    { icon: <Keyboard className="size-3.5" />, text: "Ctrl+Z / Y for undo/redo" },
    { icon: <Keyboard className="size-3.5" />, text: "F to fit view" },
    { icon: <Keyboard className="size-3.5" />, text: "Ctrl+C / V to copy/paste" },
  ];

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Lightbulb className="size-3.5 text-primary" />
        </div>
        Keyboard Shortcuts
      </h3>
      <ul className="space-y-2.5">
        {tips.map((tip, i) => (
          <li key={i} className="text-sm text-muted-foreground flex items-center gap-2.5">
            <span className="p-1 rounded bg-muted">{tip.icon}</span>
            <span>{tip.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
