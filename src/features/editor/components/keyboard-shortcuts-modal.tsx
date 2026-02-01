"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { atom } from "jotai";

// Atom for modal state
export const keyboardShortcutsModalAtom = atom(false);

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "General",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open command palette" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
    ],
  },
  {
    title: "File",
    shortcuts: [
      { keys: ["⌘", "S"], description: "Save workflow" },
    ],
  },
  {
    title: "Edit",
    shortcuts: [
      { keys: ["⌘", "Z"], description: "Undo" },
      { keys: ["⌘", "⇧", "Z"], description: "Redo" },
      { keys: ["⌘", "Y"], description: "Redo (alternative)" },
      { keys: ["⌘", "C"], description: "Copy selected nodes" },
      { keys: ["⌘", "X"], description: "Cut selected nodes" },
      { keys: ["⌘", "V"], description: "Paste nodes" },
      { keys: ["⌘", "D"], description: "Duplicate selected nodes" },
    ],
  },
  {
    title: "Nodes",
    shortcuts: [
      { keys: ["⇧", "A"], description: "Add new node" },
      { keys: ["Delete"], description: "Delete selected nodes" },
      { keys: ["Backspace"], description: "Delete selected nodes" },
    ],
  },
  {
    title: "Canvas",
    shortcuts: [
      { keys: ["F"], description: "Fit view" },
      { keys: ["⌘", "0"], description: "Fit view (alternative)" },
      { keys: ["Scroll"], description: "Pan canvas" },
      { keys: ["⌘", "Scroll"], description: "Zoom in/out" },
      { keys: ["Click", "Drag"], description: "Select multiple nodes" },
    ],
  },
];

export const KeyboardShortcutsModal = () => {
  const [open, setOpen] = useAtom(keyboardShortcutsModalAtom);

  // Listen for "?" key to open the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]') ||
        target.closest('[role="textbox"]') ||
        target.tagName === "SELECT"
      ) {
        return;
      }

      // Also check if inside a dialog/modal that might have inputs
      if (target.closest('[role="dialog"]') && !target.closest('[data-shortcuts-allowed]')) {
        return;
      }

      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick reference for all available keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                {group.title}
              </h4>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <kbd
                          key={keyIdx}
                          className="inline-flex h-6 min-w-6 items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">?</kbd> anytime to show this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
