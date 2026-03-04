"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  WorkflowIcon,
  KeyIcon,
  PlayIcon,
  PlusIcon,
  Undo2Icon,
  Redo2Icon,
  SaveIcon,
  KeyboardIcon,
} from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import { editorActionsAtom, nodeSelectorOpenAtom } from "@/features/editor/store/atoms";
import { keyboardShortcutsModalAtom } from "@/features/editor/components/keyboard-shortcuts-modal";

// Context for controlling the command palette from other components
interface CommandPaletteContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | null>(null);

export const useCommandPalette = () => {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error("useCommandPalette must be used within CommandPalette");
  }
  return context;
};

export const CommandPalette = ({ children }: { children?: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const editorActions = useAtomValue(editorActionsAtom);
  const setNodeSelectorOpen = useSetAtom(nodeSelectorOpenAtom);
  const setKeyboardShortcutsOpen = useSetAtom(keyboardShortcutsModalAtom);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Toggle command palette
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      {mounted && <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Navigation */}
          <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/workflows"))}>
            <WorkflowIcon className="mr-2 size-4" />
            Go to Workflows
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/credentials"))}>
            <KeyIcon className="mr-2 size-4" />
            Go to Credentials
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/executions"))}>
            <PlayIcon className="mr-2 size-4" />
            Go to Executions
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => router.push("/workflows/new"))}>
            <PlusIcon className="mr-2 size-4" />
            Create New Workflow
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/credentials/new"))}>
            <PlusIcon className="mr-2 size-4" />
            Add New Credential
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setKeyboardShortcutsOpen(true))}>
            <KeyboardIcon className="mr-2 size-4" />
            Keyboard Shortcuts
            <span className="ml-auto text-xs text-muted-foreground">?</span>
          </CommandItem>
        </CommandGroup>

        {/* Editor Actions (when in editor) */}
        {editorActions && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Editor">
              {editorActions.onSave && (
                <CommandItem onSelect={() => runCommand(editorActions.onSave!)}>
                  <SaveIcon className="mr-2 size-4" />
                  Save Workflow
                  <span className="ml-auto text-xs text-muted-foreground">⌘S</span>
                </CommandItem>
              )}
              {editorActions.onUndo && (
                <CommandItem
                  disabled={!editorActions.canUndo}
                  onSelect={() => runCommand(editorActions.onUndo!)}
                >
                  <Undo2Icon className="mr-2 size-4" />
                  Undo
                  <span className="ml-auto text-xs text-muted-foreground">⌘Z</span>
                </CommandItem>
              )}
              {editorActions.onRedo && (
                <CommandItem
                  disabled={!editorActions.canRedo}
                  onSelect={() => runCommand(editorActions.onRedo!)}
                >
                  <Redo2Icon className="mr-2 size-4" />
                  Redo
                  <span className="ml-auto text-xs text-muted-foreground">⌘⇧Z</span>
                </CommandItem>
              )}
              <CommandItem onSelect={() => runCommand(() => setNodeSelectorOpen(true))}>
                <PlusIcon className="mr-2 size-4" />
                Add Node
                <span className="ml-auto text-xs text-muted-foreground">⇧A</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
        </CommandList>
      </CommandDialog>}
    </CommandPaletteContext.Provider>
  );
};
