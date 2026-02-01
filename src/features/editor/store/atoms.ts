import type { ReactFlowInstance } from "@xyflow/react";
import { atom } from "jotai";

export const editorAtom = atom<ReactFlowInstance | null>(null);

// Editor actions for global access (command palette, etc.)
export interface EditorActions {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const editorActionsAtom = atom<EditorActions | null>(null);

// Node selector open state
export const nodeSelectorOpenAtom = atom(false);