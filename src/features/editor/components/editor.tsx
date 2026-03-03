"use client";

import { ErrorView } from "@/components/entity-components";
import { EditorSkeleton } from "@/components/skeletons";
import { useState, useCallback, useMemo, useEffect, useRef, useDeferredValue } from "react";
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
  PanOnScrollMode,
} from "@xyflow/react";
import { useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows";
import { createId } from "@paralleldrive/cuid2";

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
import { cn } from "@/lib/utils";
import { Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkflowValidation } from "../hooks/use-workflow-validation";
import { ValidationIndicator } from "./validation-indicator";
import { HelpButton, BeginnerGuideDialog, useIsNewUser } from "./beginner-guide";

export const EditorLoading = () => {
  return <EditorSkeleton />;
};

export const EditorError = () => {
  return <ErrorView message="Error loading editor" />;
};

// Inner component that uses useReactFlow
const EditorInner = ({ workflowId }: { workflowId: string }) => {
  const { data: workflow } = useSuspenseWorkflow(workflowId);
  const { fitView, zoomIn, zoomOut, getZoom, setViewport, getViewport } = useReactFlow();

  const setEditor = useSetAtom(editorAtom);
  const setEditorActions = useSetAtom(editorActionsAtom);
  const setNodeSelectorOpen = useSetAtom(nodeSelectorOpenAtom);

  const [nodes, setNodes] = useState<Node[]>(workflow.nodes);
  const [edges, setEdges] = useState<Edge[]>(workflow.edges);
  
  // Use deferred values for non-critical computations to reduce lag during dragging
  const deferredNodes = useDeferredValue(nodes);
  const deferredEdges = useDeferredValue(edges);
  
  // Beginner guide state
  const isNewUser = useIsNewUser();
  const [showGuide, setShowGuide] = useState(false);
  
  // Show guide for new users after a short delay
  useEffect(() => {
    if (isNewUser) {
      const timer = setTimeout(() => setShowGuide(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isNewUser]);

  // Workflow validation for beginner-friendly errors (uses deferred values to reduce drag lag)
  const { issues, errors, warnings, infos, isValid, canExecute } = useWorkflowValidation(deferredNodes, deferredEdges);

  // Auto-save hook with optimized settings (uses deferred values to reduce drag lag)
  const { status, save, hasUnsavedChanges, lastSavedAt } = useAutoSave({
    workflowId,
    nodes: deferredNodes,
    edges: deferredEdges,
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
      setNodes((nodesSnapshot) => {
        const newNodes = applyNodeChanges(changes, nodesSnapshot);
        
        // If all nodes are deleted, restore the initial placeholder node
        if (newNodes.length === 0) {
          return [{
            id: createId(),
            type: NodeType.INITIAL,
            position: { x: 0, y: 0 },
            data: {},
          }];
        }
        
        return newNodes;
      });
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

  // Handle edge click for mobile deletion (double-tap to delete)
  const [lastEdgeClick, setLastEdgeClick] = useState<{ id: string; time: number } | null>(null);
  
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    const now = Date.now();
    
    // Check for double-tap (within 300ms)
    if (lastEdgeClick && lastEdgeClick.id === edge.id && now - lastEdgeClick.time < 300) {
      // Double-tap detected - delete the edge
      takeSnapshot();
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      setLastEdgeClick(null);
      toast.success("Connection deleted", { 
        description: "Undo with Ctrl+Z",
        duration: 2000 
      });
    } else {
      // First tap - record it and show hint on mobile
      setLastEdgeClick({ id: edge.id, time: now });
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        toast.info("Tap again to delete", { duration: 1500 });
      }
    }
  }, [lastEdgeClick, takeSnapshot, setEdges]);

  // Handle fit view
  const handleFitView = useCallback(() => {
    fitViewRef.current({ padding: 0, duration: 300, maxZoom: 2 });
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
        fitViewRef.current({ padding: 0, duration: 300, maxZoom: 2 });
        return;
      }
      if (e.key === "f" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        fitViewRef.current({ padding: 0, duration: 300, maxZoom: 2 });
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

  // Detect mobile for touch-friendly settings
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Custom wheel zoom handler for increased sensitivity
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const zoomSensitivity = 0.008; // Increase this for faster zoom
      const delta = -event.deltaY * zoomSensitivity;
      const currentZoom = getZoom();
      const newZoom = Math.min(Math.max(currentZoom * (1 + delta), 0.1), 4);
      
      const viewport = getViewport();
      setViewport({ ...viewport, zoom: newZoom }, { duration: 0 });
    }
  }, [getZoom, getViewport, setViewport]);

  // Custom pinch zoom handler for mobile with increased sensitivity
  const lastPinchDistRef = useRef<number | null>(null);
  
  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      // Calculate distance between two touch points
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (lastPinchDistRef.current !== null) {
        const pinchSensitivity = 2.5; // Multiplier for pinch zoom speed
        const delta = (dist - lastPinchDistRef.current) * 0.005 * pinchSensitivity;
        const currentZoom = getZoom();
        const newZoom = Math.min(Math.max(currentZoom * (1 + delta), 0.1), 4);
        
        const viewport = getViewport();
        // Calculate center point between touches for zoom origin
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        
        setViewport({ 
          x: viewport.x - (centerX - viewport.x) * (newZoom / currentZoom - 1),
          y: viewport.y - (centerY - viewport.y) * (newZoom / currentZoom - 1),
          zoom: newZoom 
        }, { duration: 0 });
      }
      
      lastPinchDistRef.current = dist;
    }
  }, [getZoom, getViewport, setViewport]);
  
  const handleTouchEnd = useCallback(() => {
    lastPinchDistRef.current = null;
  }, []);

  return (
    <div 
      className="size-full" 
      onWheel={handleWheel}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeComponents}
        onInit={setEditor}
        fitView
        fitViewOptions={{ padding: 0, maxZoom: 2 }}
        snapGrid={[10, 10]}
        snapToGrid
        panOnScroll
        panOnDrag={isMobile ? true : false}
        selectionOnDrag={!isMobile}
        nodesDraggable={true}
        edgesReconnectable
        edgesFocusable
        deleteKeyCode={["Backspace", "Delete"]}
        // Mobile: two-finger pan via panOnScroll, one-finger for node drag
        zoomOnPinch={true}
        zoomOnScroll={true}
        zoomOnDoubleClick={true}
        panOnScrollMode={PanOnScrollMode.Free}
        // Zoom settings - increase sensitivity
        minZoom={0.1}
        maxZoom={4}
        // Performance optimizations
        elevateNodesOnSelect={false}
        elevateEdgesOnSelect={false}
      >
        <Background color="var(--dot-color)" />
        {/* Show smaller controls on mobile, hide default fitView button */}
        <Controls 
          className={cn("dark:!bg-[#1c1610] dark:!border-[#302618] dark:!rounded-lg", isMobile ? "!left-2 !bottom-2 scale-90" : "")} 
          showFitView={false}
        />
        {/* Hide MiniMap on mobile */}
        {!isMobile && (
          <MiniMap 
            className="!bottom-24 dark:!bg-[#1c1610] dark:!border dark:!border-[#302618] dark:!rounded-lg"
            maskColor="var(--minimap-mask, rgba(240, 240, 240, 0.6))"
            nodeColor="var(--minimap-node, #e2e2e2)"
            nodeStrokeColor="var(--minimap-node-stroke, #555)"
          />
        )}

        {/* Top-left: Save status (compact on mobile) */}
        <Panel position="top-left" className={isMobile ? "!top-2 !left-2 max-w-[45vw]" : "!top-3 !left-14"}>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <AutoSaveIndicator
              status={status}
              lastSavedAt={lastSavedAt}
              onSave={save}
            />
            <ValidationIndicator
              issues={issues}
              errors={errors}
              warnings={warnings}
              infos={infos}
              isValid={isValid}
              compact={isMobile}
            />
          </div>
        </Panel>

        {/* Top-right: Actions */}
        <Panel position="top-right" className={isMobile ? "!top-2 !right-2 max-w-[45vw]" : ""}>
          <div className="flex items-center gap-1 sm:gap-2">
            <HelpButton />
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

        {/* Execute button */}
        {hasManualTrigger && (
          <Panel position="bottom-center" className={isMobile ? "!bottom-20" : ""}>
            <ExecuteWorkflowButton 
              workflowId={workflowId} 
              canExecute={canExecute}
              validationErrors={errors}
              onSaveBeforeExecute={save}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </Panel>
        )}
      </ReactFlow>

      {/* Execution History Panel */}
      <ExecutionHistoryPanel workflowId={workflowId} />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal />
      
      {/* Beginner Guide Dialog */}
      <BeginnerGuideDialog open={showGuide} onOpenChange={setShowGuide} />
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