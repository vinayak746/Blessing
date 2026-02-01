"use client";

import { ErrorView } from "@/components/entity-components";
import { EditorSkeleton } from "@/components/skeletons";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  Background,
  Controls,
  MiniMap,
  Panel,
} from "@xyflow/react";
import { useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows";

import "@xyflow/react/dist/style.css";
import { nodeComponents } from "@/config/node-components";
import { AddNodeButton } from "./add-node-button";
import { useSetAtom } from "jotai";
import { editorAtom, editorActionsAtom, nodeSelectorOpenAtom } from "../store/atoms";
import { NodeType } from "@prisma/client";
import { ExecuteWorkflowButton } from "./execute-workflow-button";
import { useAutoSave } from "../hooks/use-auto-save";
import { AutoSaveIndicator } from "./auto-save-indicator";
import { useUndoRedo } from "../hooks/use-undo-redo";
import { KeyboardShortcutsModal } from "./keyboard-shortcuts-modal";
import { ExecutionHistoryPanel } from "./execution-history-panel";
import { useClipboard } from "../hooks/use-clipboard";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

export const EditorLoading = () => {
  return <EditorSkeleton />;
};

export const EditorError = () => {
  return <ErrorView message="Error loading editor" />;
};

// Inner component that uses useReactFlow
const EditorInner = ({ workflowId }: { workflowId: string }) => {
  const { data: workflow } = useSuspenseWorkflow(workflowId);
  const { fitView } = useReactFlow();

  const setEditor = useSetAtom(editorAtom);
  const setEditorActions = useSetAtom(editorActionsAtom);
  const setNodeSelectorOpen = useSetAtom(nodeSelectorOpenAtom);

  const [nodes, setNodes] = useState<Node[]>(workflow.nodes);
  const [edges, setEdges] = useState<Edge[]>(workflow.edges);

  // Auto-save hook with optimized settings
  const { status, save, hasUnsavedChanges, lastSavedAt } = useAutoSave({
    workflowId,
    nodes,
    edges,
    delay: 3000,         // 3 seconds for structural changes
    positionDelay: 10000, // 10 seconds for position-only changes
    enabled: true,
    maxRetries: 3,
  });

  const { undo, redo, takeSnapshot, canUndo, canRedo } = useUndoRedo(nodes, edges, setNodes, setEdges);
  
  // Clipboard hook
  const { copy, cut, paste, duplicate } = useClipboard(
    nodes,
    edges,
    setNodes,
    setEdges,
    takeSnapshot
  );

  // Keep refs to avoid stale closures in event handlers
  const saveRef = useRef(save);
  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  const copyRef = useRef(copy);
  const cutRef = useRef(cut);
  const pasteRef = useRef(paste);
  const duplicateRef = useRef(duplicate);
  const fitViewRef = useRef(fitView);
  
  saveRef.current = save;
  undoRef.current = undo;
  redoRef.current = redo;
  copyRef.current = copy;
  cutRef.current = cut;
  pasteRef.current = paste;
  duplicateRef.current = duplicate;
  fitViewRef.current = fitView;

  // Register editor actions globally for command palette
  useEffect(() => {
    setEditorActions({
      onSave: save,
      onUndo: undo,
      onRedo: redo,
      canUndo,
      canRedo,
    });
    return () => setEditorActions(null);
  }, [setEditorActions, save, undo, redo, canUndo, canRedo]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Take snapshot for significant changes (add, remove, but not position/select)
      const hasSignificantChange = changes.some(
        (change) => change.type === "add" || change.type === "remove"
      );
      if (hasSignificantChange) {
        takeSnapshot();
      }
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot));
    },
    [takeSnapshot]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Take snapshot for significant changes (add, remove)
      const hasSignificantChange = changes.some(
        (change) => change.type === "add" || change.type === "remove"
      );
      if (hasSignificantChange) {
        takeSnapshot();
      }
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot));
    },
    [takeSnapshot]
  );
  const onConnect = useCallback(
    (params: Connection) => {
      takeSnapshot();
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot));
    },
    [takeSnapshot]
  );

  const hasManualTrigger = useMemo(() => {
    return nodes.some((node) => node.type === NodeType.MANUAL_TRIGGER);
  }, [nodes]);

  // Handle fit view
  const handleFitView = useCallback(() => {
    fitViewRef.current({ padding: 0.2, duration: 300 });
  }, []);

  // Helper to check if target is an editable element
  const isEditableElement = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    
    return (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable ||
      target.closest('[contenteditable="true"]') !== null ||
      target.closest('[role="textbox"]') !== null ||
      target.tagName === "SELECT"
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore repeated key events (when key is held down)
      if (e.repeat) return;

      const target = e.target as HTMLElement;
      const isEditable = isEditableElement(target);
      
      // Save shortcut (Ctrl+S) - always allow
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        e.stopPropagation();
        saveRef.current();
        return;
      }
      
      // Skip other shortcuts if in editable element
      if (isEditable) return;
      
      // Copy shortcut (Ctrl+C)
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        // Don't prevent default if text is selected
        if (window.getSelection()?.toString()) return;
        e.preventDefault();
        e.stopPropagation();
        copyRef.current();
        return;
      }
      // Cut shortcut (Ctrl+X)
      if ((e.ctrlKey || e.metaKey) && e.key === "x") {
        if (window.getSelection()?.toString()) return;
        e.preventDefault();
        e.stopPropagation();
        cutRef.current();
        return;
      }
      // Paste shortcut (Ctrl+V)
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        e.stopPropagation();
        pasteRef.current();
        return;
      }
      // Duplicate shortcut (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        e.stopPropagation();
        duplicateRef.current();
        return;
      }
      // Undo shortcut (Ctrl+Z)
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          redoRef.current();
        } else {
          undoRef.current();
        }
        return;
      }
      // Redo shortcut (Ctrl+Y)
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        e.stopPropagation();
        redoRef.current();
        return;
      }
      // Fit view shortcut (Ctrl+0 or F)
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        e.stopPropagation();
        fitViewRef.current({ padding: 0.2, duration: 300 });
        return;
      }
      if (e.key === "f" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        fitViewRef.current({ padding: 0.2, duration: 300 });
        return;
      }
      // Add node shortcut (Shift+A)
      if (e.shiftKey && e.key === "A") {
        e.preventDefault();
        e.stopPropagation();
        setNodeSelectorOpen(true);
        return;
      }
    };

    // Use capture phase to intercept before ReactFlow
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [setNodeSelectorOpen]);

  return (
    <div className="size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeComponents}
        onInit={setEditor}
        fitView
        snapGrid={[10, 10]}
        snapToGrid
        panOnScroll
        panOnDrag={false}
        selectionOnDrag
      >
        <Background />
        <Controls />
        <MiniMap />

        {/* Auto-save indicator */}
        <Panel position="top-left" className="!top-3 !left-14">
          <AutoSaveIndicator
            status={status}
            lastSavedAt={lastSavedAt}
            onSave={save}
          />
        </Panel>

        <Panel position="top-right">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleFitView}
              className="size-8"
              title="Fit view (F)"
            >
              <Maximize2 className="size-4" />
            </Button>
            <AddNodeButton />
          </div>
        </Panel>

        {hasManualTrigger && (
          <Panel position="bottom-center">
            <ExecuteWorkflowButton workflowId={workflowId} />
          </Panel>
        )}
      </ReactFlow>

      {/* Execution History Panel */}
      <ExecutionHistoryPanel workflowId={workflowId} />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal />
    </div>
  );
};

export const Editor = ({ workflowId }: { workflowId: string }) => {
  return (
    <ReactFlowProvider>
      <EditorInner workflowId={workflowId} />
    </ReactFlowProvider>
  );
};