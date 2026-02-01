import { useCallback, useEffect, useRef, useState } from "react";
import { useUpdateWorkflow } from "@/features/workflows/hooks/use-workflows";
import type { Node, Edge } from "@xyflow/react";
import { toast } from "sonner";

export type AutoSaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error" | "offline";

interface UseAutoSaveOptions {
  workflowId: string;
  nodes: Node[];
  edges: Edge[];
  delay?: number;
  positionDelay?: number;
  enabled?: boolean;
  maxRetries?: number;
}

interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
  save: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

/**
 * Creates a stable hash string for comparison
 */
const createStructureHash = (nodes: Node[], edges: Edge[]): string => {
  const structuralNodes = nodes
    .map((n) => ({
      id: n.id,
      type: n.type,
      data: n.data,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const structuralEdges = edges
    .map((e) => ({
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    }))
    .sort((a, b) => `${a.source}-${a.target}`.localeCompare(`${b.source}-${b.target}`));

  return JSON.stringify({ nodes: structuralNodes, edges: structuralEdges });
};

const createPositionHash = (nodes: Node[]): string => {
  const positions = nodes
    .map((n) => ({
      id: n.id,
      x: Math.round(n.position.x / 10) * 10,
      y: Math.round(n.position.y / 10) * 10,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return JSON.stringify(positions);
};

export const useAutoSave = ({
  workflowId,
  nodes,
  edges,
  delay = 3000,
  positionDelay = 10000,
  enabled = true,
  maxRetries = 3,
}: UseAutoSaveOptions): UseAutoSaveReturn => {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const updateWorkflow = useUpdateWorkflow({ silent: true });

  // Refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStructureRef = useRef<string>("");
  const lastSavedPositionRef = useRef<string>("");
  const isInitialMount = useRef(true);
  const isSavingRef = useRef(false);
  const retryCountRef = useRef(0);
  const lastManualSaveRef = useRef<number>(0);

  // Store latest nodes/edges in refs to avoid stale closures
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  // Calculate hashes
  const currentStructureHash = createStructureHash(nodes, edges);
  const currentPositionHash = createPositionHash(nodes);

  // Determine if there are unsaved changes
  const hasUnsavedChanges =
    currentStructureHash !== lastSavedStructureRef.current ||
    currentPositionHash !== lastSavedPositionRef.current;

  // Clear idle timeout helper
  const clearIdleTimeout = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
  }, []);

  // Schedule transition to idle
  const scheduleIdleTransition = useCallback((delayMs: number) => {
    clearIdleTimeout();
    idleTimeoutRef.current = setTimeout(() => {
      setStatus((current) => (current === "saved" ? "idle" : current));
    }, delayMs);
  }, [clearIdleTimeout]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setStatus((prev) => (prev === "offline" ? "unsaved" : prev));
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Core save function
  const performSave = useCallback(
    (showToast: boolean) => {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      const structureHash = createStructureHash(currentNodes, currentEdges);
      const positionHash = createPositionHash(currentNodes);

      isSavingRef.current = true;
      clearIdleTimeout();
      setStatus("saving");

      if (showToast) {
        toast.loading("Saving...", { id: "save-status" });
      }

      updateWorkflow.mutate(
        { id: workflowId, nodes: currentNodes, edges: currentEdges },
        {
          onSuccess: () => {
            lastSavedStructureRef.current = structureHash;
            lastSavedPositionRef.current = positionHash;
            isSavingRef.current = false;
            retryCountRef.current = 0;
            setLastSavedAt(new Date());
            setStatus("saved");

            if (showToast) {
              toast.success("Saved", { id: "save-status", duration: 1500 });
            }

            scheduleIdleTransition(3000);
          },
          onError: (error) => {
            isSavingRef.current = false;

            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++;
              const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);

              setStatus("saving");
              toast.error(
                `Save failed. Retrying in ${retryDelay / 1000}s... (${retryCountRef.current}/${maxRetries})`,
                { id: "save-error", duration: retryDelay }
              );

              setTimeout(() => performSave(false), retryDelay);
            } else {
              setStatus("error");
              retryCountRef.current = 0;
              toast.error(`Auto-save failed: ${error.message}`, {
                id: "save-error",
                action: {
                  label: "Retry",
                  onClick: () => performSave(true),
                },
                duration: 10000,
              });
            }
          },
        }
      );
    },
    [workflowId, updateWorkflow, maxRetries, clearIdleTimeout, scheduleIdleTransition]
  );

  // Manual save function (called by Ctrl+S or clicking the indicator)
  const save = useCallback(() => {
    // Throttle: ignore if save was triggered less than 1 second ago
    const now = Date.now();
    if (now - lastManualSaveRef.current < 1000) {
      return;
    }
    lastManualSaveRef.current = now;

    // If already saving, ignore
    if (isSavingRef.current) {
      return;
    }

    if (!enabled) {
      return;
    }

    if (!isOnline) {
      setStatus("offline");
      toast.error("You're offline. Changes will be saved when you reconnect.", {
        id: "save-offline",
      });
      return;
    }

    const structureHash = createStructureHash(nodesRef.current, edgesRef.current);
    const positionHash = createPositionHash(nodesRef.current);

    // Check if anything actually changed
    const hasChanges =
      structureHash !== lastSavedStructureRef.current ||
      positionHash !== lastSavedPositionRef.current;

    if (!hasChanges) {
      // No changes - just confirm saved state
      clearIdleTimeout();
      setStatus("saved");
      toast.success("All changes saved", { id: "save-status", duration: 1500 });
      scheduleIdleTransition(3000);
      return;
    }

    // Perform the save
    performSave(true);
  }, [enabled, isOnline, performSave, clearIdleTimeout, scheduleIdleTransition]);

  // Initialize hashes on mount
  useEffect(() => {
    if (isInitialMount.current) {
      lastSavedStructureRef.current = currentStructureHash;
      lastSavedPositionRef.current = currentPositionHash;
      isInitialMount.current = false;
    }
  }, []); // Empty deps - only run once on mount

  // Debounced auto-save when changes detected
  useEffect(() => {
    if (!enabled || isInitialMount.current) return;

    const structureChanged = currentStructureHash !== lastSavedStructureRef.current;
    const positionChanged = currentPositionHash !== lastSavedPositionRef.current;

    if (!structureChanged && !positionChanged) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
      return;
    }

    // Only set unsaved if not currently saving
    if (!isSavingRef.current) {
      setStatus("unsaved");
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Use shorter delay for structural changes, longer for position-only
    const saveDelay = structureChanged ? delay : positionDelay;

    autoSaveTimeoutRef.current = setTimeout(() => {
      if (!isSavingRef.current) {
        performSave(false); // Auto-save without toast
      }
    }, saveDelay);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [currentStructureHash, currentPositionHash, delay, positionDelay, enabled, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      clearIdleTimeout();
    };
  }, [clearIdleTimeout]);

  return {
    status,
    lastSavedAt,
    save,
    isSaving: isSavingRef.current || updateWorkflow.isPending,
    hasUnsavedChanges,
  };
};
