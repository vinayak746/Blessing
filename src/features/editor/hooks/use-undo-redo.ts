import { useCallback, useRef, useState } from "react";
import type { Node, Edge } from "@xyflow/react";

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface UseUndoRedoOptions {
  maxHistory?: number;
}

interface UseUndoRedoReturn {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  takeSnapshot: () => void;
}

export const useUndoRedo = (
  nodes: Node[],
  edges: Edge[],
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  options: UseUndoRedoOptions = {}
): UseUndoRedoReturn => {
  const { maxHistory = 50 } = options;

  const [pastStates, setPastStates] = useState<HistoryState[]>([]);
  const [futureStates, setFutureStates] = useState<HistoryState[]>([]);
  
  const isUndoingRef = useRef(false);

  // Take a snapshot of current state (call this before making changes)
  const takeSnapshot = useCallback(() => {
    if (isUndoingRef.current) return;

    setPastStates((past) => {
      const newPast = [
        ...past,
        {
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
        },
      ];
      // Limit history size
      if (newPast.length > maxHistory) {
        newPast.shift();
      }
      return newPast;
    });

    // Clear future when new action is taken
    setFutureStates([]);
  }, [nodes, edges, maxHistory]);

  const undo = useCallback(() => {
    if (pastStates.length === 0) return;

    isUndoingRef.current = true;

    const previous = pastStates[pastStates.length - 1];
    const newPast = pastStates.slice(0, -1);

    // Save current state to future
    setFutureStates((future) => [
      ...future,
      {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      },
    ]);

    setPastStates(newPast);
    setNodes(previous.nodes);
    setEdges(previous.edges);

    // Reset flag after state updates
    setTimeout(() => {
      isUndoingRef.current = false;
    }, 0);
  }, [pastStates, nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (futureStates.length === 0) return;

    isUndoingRef.current = true;

    const next = futureStates[futureStates.length - 1];
    const newFuture = futureStates.slice(0, -1);

    // Save current state to past
    setPastStates((past) => [
      ...past,
      {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      },
    ]);

    setFutureStates(newFuture);
    setNodes(next.nodes);
    setEdges(next.edges);

    setTimeout(() => {
      isUndoingRef.current = false;
    }, 0);
  }, [futureStates, nodes, edges, setNodes, setEdges]);

  return {
    undo,
    redo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
    takeSnapshot,
  };
};