import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUpdateWorkflow } from "@/features/workflows/hooks/use-workflows";
import type { Node, Edge } from "@xyflow/react";

export type AutoSaveStatus =
  | "idle"
  | "unsaved"
  | "saving"
  | "saved"
  | "error"
  | "offline";

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
}

interface UseAutoSaveOptions {
  workflowId: string;
  /** Used to notice changes and schedule saves (may be a deferred copy). */
  nodes: Node[];
  edges: Edge[];
  /**
   * Returns the live, up-to-the-moment nodes and edges. Saves always read from
   * here so a save never captures a stale (deferred) copy. Falls back to the
   * `nodes` / `edges` above when omitted.
   */
  getLatestState?: () => WorkflowState;
  delay?: number;
  positionDelay?: number;
  enabled?: boolean;
  maxRetries?: number;
  /** While the database is unreachable, how often to keep trying after the quick retries (ms). */
  slowRetryDelay?: number;
}

interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
  /** Fire-and-forget save (Ctrl+S, clicking the indicator). */
  save: () => void;
  /**
   * Saves the latest state and resolves `true` only once it is stored.
   * Resolves `false` if it could not be saved (offline, server error).
   * Safe to call at any time: calls are queued, never overlap, and a call
   * made while a save is in flight waits for it and then saves anything newer.
   */
  saveAsync: () => Promise<boolean>;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  /** Plain-language reason the last save failed; null when the last save worked. */
  errorMessage: string | null;
}

/** True for "can't reach the server/database" style failures (worth retrying). */
const isConnectionError = (error: unknown): boolean => {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  return /can'?t reach database|P1001|P1002|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|fetch failed|failed to fetch|network|timed out|timeout|transaction already closed/i.test(
    raw,
  );
};

/** Turns a raw failure into something a person can act on. */
const describeSaveError = (error: unknown): string => {
  if (isConnectionError(error)) {
    return "Can't reach the database right now. Your changes are kept on this page and will be saved automatically as soon as it's back.";
  }
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (/unauthorized|not authenticated|sign.?in/i.test(raw)) {
    return "You've been signed out, so this couldn't be saved. Sign in again, then retry.";
  }
  // Keep the last meaningful line; database errors are long and multi-line.
  const line =
    raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .pop() ?? "";
  return line
    ? line.slice(0, 180)
    : "Something went wrong while saving. Please try again.";
};

/**
 * Hash of everything except positions (node ids, types, config, connections).
 */
const createStructureHash = (nodes: Node[], edges: Edge[]): string => {
  const structuralNodes = nodes
    .map((n) => ({ id: n.id, type: n.type, data: n.data }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const structuralEdges = edges
    .map((e) => ({
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    }))
    .sort((a, b) =>
      `${a.source}-${a.sourceHandle ?? ""}-${a.target}-${a.targetHandle ?? ""}`.localeCompare(
        `${b.source}-${b.sourceHandle ?? ""}-${b.target}-${b.targetHandle ?? ""}`,
      ),
    );

  return JSON.stringify({ nodes: structuralNodes, edges: structuralEdges });
};

/** Positions rounded to the 10px snap grid, so sub-grid jitter isn't a "change". */
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
  getLatestState,
  delay = 3000,
  positionDelay = 10000,
  enabled = true,
  maxRetries = 3,
  slowRetryDelay = 30000,
}: UseAutoSaveOptions): UseAutoSaveReturn => {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  // Bumped after every successful save so the scheduling effect re-checks
  // whether something changed *while* that save was running.
  const [savedVersion, setSavedVersion] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateWorkflow = useUpdateWorkflow({ silent: true });

  // ---- latest values, readable from async code without stale closures ----
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;
  const getLatestRef = useRef(getLatestState);
  getLatestRef.current = getLatestState;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const mutateRef = useRef(updateWorkflow.mutateAsync);
  mutateRef.current = updateWorkflow.mutateAsync;

  const readState = useCallback((): WorkflowState => {
    const latest = getLatestRef.current?.();
    return latest ?? { nodes: nodesRef.current, edges: edgesRef.current };
  }, []);

  // Hashes of what we are watching (recomputed whenever the inputs change; no
  // throttling, so a change can never be missed).
  const structureHash = useMemo(
    () => createStructureHash(nodes, edges),
    [nodes, edges],
  );
  const positionHash = useMemo(() => createPositionHash(nodes), [nodes]);

  // What is stored on the server, as hashes. Starts as "whatever we loaded".
  const savedRef = useRef({ structure: structureHash, position: positionHash });

  const isDirtyNow = useCallback((): boolean => {
    const state = readState();
    return (
      createStructureHash(state.nodes, state.edges) !==
        savedRef.current.structure ||
      createPositionHash(state.nodes) !== savedRef.current.position
    );
  }, [readState]);

  const hasUnsavedChanges =
    structureHash !== savedRef.current.structure ||
    positionHash !== savedRef.current.position;

  // ---- timers / lifecycle ----
  const mountedRef = useRef(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const slowRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastErrorRef = useRef<unknown>(null);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const scheduleIdle = useCallback(
    (ms: number) => {
      clearIdleTimer();
      idleTimerRef.current = setTimeout(() => {
        setStatus((current) => (current === "saved" ? "idle" : current));
      }, ms);
    },
    [clearIdleTimer],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearIdleTimer();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (slowRetryTimerRef.current) clearTimeout(slowRetryTimerRef.current);
    };
  }, [clearIdleTimer]);

  // Online / offline
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

  /** One save of the latest state. Never throws; resolves to success. */
  const persistOnce = useCallback(async (): Promise<boolean> => {
    const state = readState();
    const structure = createStructureHash(state.nodes, state.edges);
    const position = createPositionHash(state.nodes);

    if (
      structure === savedRef.current.structure &&
      position === savedRef.current.position
    ) {
      return true;
    }

    clearIdleTimer();
    if (mountedRef.current) setStatus("saving");

    try {
      await mutateRef.current({
        id: workflowId,
        nodes: state.nodes,
        edges: state.edges,
      });
    } catch (error) {
      lastErrorRef.current = error;
      if (mountedRef.current) setErrorMessage(describeSaveError(error));
      return false;
    }

    savedRef.current = { structure, position };
    lastErrorRef.current = null;
    if (slowRetryTimerRef.current) {
      clearTimeout(slowRetryTimerRef.current);
      slowRetryTimerRef.current = null;
    }
    if (mountedRef.current) {
      setErrorMessage(null);
      setLastSavedAt(new Date());
      setSavedVersion((v) => v + 1);
    }
    return true;
  }, [readState, workflowId, clearIdleTimer]);

  /**
   * Makes the server match the latest state. Calls are chained so they never
   * overlap; each one re-checks what is still unsaved when its turn comes.
   */
  const flush = useCallback(
    (reportError = true): Promise<boolean> => {
      const run = queueRef.current.then(async (): Promise<boolean> => {
        if (!enabledRef.current) return true;

        // Edits can land while a save is running, so loop until the server has
        // everything (bounded, so a user mid-drag can't keep us here forever).
        for (let pass = 0; pass < 4; pass++) {
          if (!isDirtyNow()) break;

          if (typeof navigator !== "undefined" && !navigator.onLine) {
            if (mountedRef.current) setStatus("offline");
            return false;
          }

          const ok = await persistOnce();
          if (!ok) {
            if (mountedRef.current && reportError) setStatus("error");
            return false;
          }
        }

        if (mountedRef.current) {
          if (isDirtyNow()) {
            setStatus("unsaved");
          } else {
            setStatus("saved");
            scheduleIdle(3000);
          }
        }
        return !isDirtyNow();
      });

      queueRef.current = run.catch(() => undefined);
      return run;
    },
    [isDirtyNow, persistOnce, scheduleIdle],
  );

  // Auto-save with retry + backoff. Held in a ref so it can reschedule itself.
  const autoSaveRef = useRef<() => Promise<void>>(async () => {});
  autoSaveRef.current = async () => {
    const ok = await flush(false);
    if (ok) {
      retryCountRef.current = 0;
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) return; // resumes when back online

    if (retryCountRef.current < maxRetries) {
      retryCountRef.current += 1;
      const wait = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
      if (mountedRef.current) setStatus("saving");
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => {
        void autoSaveRef.current();
      }, wait);
    } else {
      retryCountRef.current = 0;
      if (mountedRef.current) setStatus("error");
      // A database that is down or waking up usually comes back on its own, so
      // keep trying (gently) instead of waiting for the user to notice.
      if (isConnectionError(lastErrorRef.current)) {
        if (slowRetryTimerRef.current) clearTimeout(slowRetryTimerRef.current);
        slowRetryTimerRef.current = setTimeout(() => {
          void autoSaveRef.current();
        }, slowRetryDelay);
      }
    }
  };

  // Debounced auto-save. Re-evaluates after every completed save
  // (`savedVersion`), which is what picks up edits made during a slow save.
  useEffect(() => {
    if (!enabled) return;

    const structureChanged = structureHash !== savedRef.current.structure;
    const positionChanged = positionHash !== savedRef.current.position;
    if (!structureChanged && !positionChanged) return;

    setStatus((current) =>
      current === "saving" || current === "offline" ? current : "unsaved",
    );

    const saveDelay = structureChanged ? delay : positionDelay;
    const timer = setTimeout(() => {
      void autoSaveRef.current();
    }, saveDelay);

    return () => clearTimeout(timer);
  }, [
    structureHash,
    positionHash,
    savedVersion,
    isOnline,
    enabled,
    delay,
    positionDelay,
  ]);

  // Last chance: if the tab is closed (or the editor unmounts) with unsaved
  // changes, send them with the beacon endpoint instead of losing them.
  const sendBeacon = useCallback(() => {
    if (!enabledRef.current || !isDirtyNow()) return;
    if (
      typeof navigator === "undefined" ||
      typeof navigator.sendBeacon !== "function"
    )
      return;

    try {
      const state = readState();
      const payload = JSON.stringify({
        id: workflowId,
        nodes: state.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data ?? {},
        })),
        edges: state.edges.map((e) => ({
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle ?? null,
          targetHandle: e.targetHandle ?? null,
        })),
      });
      navigator.sendBeacon(
        "/api/workflows/save-beacon",
        new Blob([payload], { type: "application/json" }),
      );
    } catch {
      // Best effort only.
    }
  }, [isDirtyNow, readState, workflowId]);

  useEffect(() => {
    window.addEventListener("pagehide", sendBeacon);
    return () => {
      window.removeEventListener("pagehide", sendBeacon);
      sendBeacon(); // editor unmounting (client-side navigation)
    };
  }, [sendBeacon]);

  // If a save is known to be failing, don't let the tab close silently on
  // changes that exist nowhere else. (Not shown for normal unsaved changes:
  // those are sent with the beacon above.)
  useEffect(() => {
    const stuck =
      hasUnsavedChanges && (status === "error" || status === "offline");
    if (!stuck) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges, status]);

  const save = useCallback(() => {
    void flush();
  }, [flush]);

  const saveAsync = useCallback(() => flush(), [flush]);

  return {
    status,
    lastSavedAt,
    save,
    saveAsync,
    isSaving: status === "saving" || updateWorkflow.isPending,
    hasUnsavedChanges,
    errorMessage,
  };
};
