"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FormInputIcon, 
  MessageSquareIcon, 
  CreditCardIcon,
  WebhookIcon,
  BrainIcon,
  MailIcon,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

const templates: Template[] = [
  {
    id: "form-to-slack",
    name: "Form Response to Slack",
    description: "Send Google Form responses to a Slack channel",
    icon: <FormInputIcon className="size-5" />,
    category: "Popular",
  },
  {
    id: "form-to-ai-summary",
    name: "AI Form Summarizer",
    description: "Summarize form responses with AI and send to Discord",
    icon: <BrainIcon className="size-5" />,
    category: "AI Workflows",
  },
  {
    id: "payment-notification",
    name: "Payment Notifications",
    description: "Get notified on Slack when you receive a Stripe payment",
    icon: <CreditCardIcon className="size-5" />,
    category: "Popular",
  },
  {
    id: "webhook-processor",
    name: "Webhook Data Processor",
    description: "Process incoming webhook data with AI",
    icon: <WebhookIcon className="size-5" />,
    category: "Advanced",
  },
];

interface WorkflowTemplatesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (templateId: string) => void;
}

export const WorkflowTemplates = ({
  open,
  onOpenChange,
  onSelectTemplate,
}: WorkflowTemplatesProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Start with a Template</DialogTitle>
          <DialogDescription>
            Choose a template to get started quickly, or start from scratch.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
              onClick={() => {
                onSelectTemplate(template.id);
                onOpenChange(false);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium">
                      {template.name}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1 line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={() => {
              onSelectTemplate("blank");
              onOpenChange(false);
            }}
          >
            Start from Scratch
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};