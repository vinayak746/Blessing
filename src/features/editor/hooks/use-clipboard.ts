"use client";

import { useState, useCallback, useRef } from "react";
import type { Node, Edge } from "@xyflow/react";
import { createId } from "@paralleldrive/cuid2";
import { toast } from "sonner";

interface ClipboardData {
  nodes: Node[];
  edges: Edge[];
}

// Minimum time between paste operations (ms)
const PASTE_THROTTLE = 1000;

export function useClipboard(
  nodes: Node[],
  edges: Edge[],
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  takeSnapshot: () => void
) {
  const clipboardRef = useRef<ClipboardData | null>(null);
  const lastPasteTimeRef = useRef<number>(0);
  const isPastingRef = useRef<boolean>(false);

  const copy = useCallback(() => {
    const selectedNodes = nodes.filter((node) => node.selected);
    
    if (selectedNodes.length === 0) {
      toast.info("No nodes selected to copy");
      return;
    }

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    
    // Copy edges that connect selected nodes
    const selectedEdges = edges.filter(
      (edge) =>
        selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
    );

    clipboardRef.current = {
      nodes: selectedNodes,
      edges: selectedEdges,
    };

    toast.success(`Copied ${selectedNodes.length} node${selectedNodes.length > 1 ? "s" : ""}`);
  }, [nodes, edges]);

  const cut = useCallback(() => {
    const selectedNodes = nodes.filter((node) => node.selected);
    
    if (selectedNodes.length === 0) {
      toast.info("No nodes selected to cut");
      return;
    }

    // Copy first
    copy();

    // Then delete
    takeSnapshot();
    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    
    setNodes((nds) => nds.filter((n) => !selectedNodeIds.has(n.id)));
    setEdges((eds) =>
      eds.filter(
        (e) => !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target)
      )
    );

    toast.success(`Cut ${selectedNodes.length} node${selectedNodes.length > 1 ? "s" : ""}`);
  }, [nodes, copy, takeSnapshot, setNodes, setEdges]);

  const paste = useCallback(() => {
    // Prevent re-entry and throttle
    if (isPastingRef.current) return;
    
    const now = Date.now();
    if (now - lastPasteTimeRef.current < PASTE_THROTTLE) {
      return;
    }
    
    isPastingRef.current = true;
    lastPasteTimeRef.current = now;

    if (!clipboardRef.current || clipboardRef.current.nodes.length === 0) {
      isPastingRef.current = false;
      toast.info("Nothing to paste");
      return;
    }

    try {
      takeSnapshot();

      const { nodes: copiedNodes, edges: copiedEdges } = clipboardRef.current;
      
      // Create ID mapping for new nodes
      const idMapping = new Map<string, string>();
      copiedNodes.forEach((node) => {
        idMapping.set(node.id, createId());
      });

      // Offset position so pasted nodes don't overlap
      const offset = { x: 50, y: 50 };

      // Create new nodes with new IDs and offset positions
      const newNodes: Node[] = copiedNodes.map((node) => ({
        ...node,
        id: idMapping.get(node.id)!,
        position: {
          x: node.position.x + offset.x,
          y: node.position.y + offset.y,
        },
        selected: true,
        data: { ...node.data },
      }));

      // Create new edges with updated source/target IDs
      const newEdges: Edge[] = copiedEdges.map((edge) => ({
        ...edge,
        id: createId(),
        source: idMapping.get(edge.source)!,
        target: idMapping.get(edge.target)!,
      }));

      // Update clipboard with new positions so next paste offsets correctly
      clipboardRef.current = {
        nodes: copiedNodes.map((node) => ({
          ...node,
          position: {
            x: node.position.x + offset.x,
            y: node.position.y + offset.y,
          },
        })),
        edges: copiedEdges,
      };

      // Deselect existing nodes and add new ones
      setNodes((nds) => [
        ...nds.map((n) => ({ ...n, selected: false })),
        ...newNodes,
      ]);
      setEdges((eds) => [...eds, ...newEdges]);

      toast.success(`Pasted ${newNodes.length} node${newNodes.length > 1 ? "s" : ""}`);
    } finally {
      // Release lock after a short delay
      setTimeout(() => {
        isPastingRef.current = false;
      }, 100);
    }
  }, [takeSnapshot, setNodes, setEdges]);

  const duplicate = useCallback(() => {
    const selectedNodes = nodes.filter((node) => node.selected);
    
    if (selectedNodes.length === 0) {
      toast.info("No nodes selected to duplicate");
      return;
    }

    // Store current clipboard, copy, paste, restore clipboard
    const previousClipboard = clipboardRef.current;
    copy();
    paste();
    clipboardRef.current = previousClipboard;
  }, [nodes, copy, paste]);

  return {
    copy,
    cut,
    paste,
    duplicate,
    hasClipboard: clipboardRef.current !== null && clipboardRef.current.nodes.length > 0,
  };
}
