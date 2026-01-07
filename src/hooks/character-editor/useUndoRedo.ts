"use client";

import { useState, useCallback, useMemo, useRef } from "react";

/**
 * A single entry in the history timeline
 */
export interface HistoryEntry<T> {
  /** The state snapshot */
  state: T;
  /** Human-readable label describing the operation */
  label?: string;
  /** Timestamp when this state was created */
  timestamp: number;
}

export interface UseUndoRedoResult<T> {
  /** Current state */
  state: T;
  /** Set new state (adds to history) */
  setState: (newState: T, label?: string) => void;
  /** Reset state without adding to history */
  resetState: (newState: T) => void;
  /** Undo last change */
  undo: () => void;
  /** Redo last undone change */
  redo: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Number of items in history */
  historyLength: number;
  /** Clear all history */
  clearHistory: () => void;
  /** Full history timeline (past + present + future) */
  history: HistoryEntry<T>[];
  /** Current position in history (0-based, points to present) */
  historyIndex: number;
  /** Jump to a specific point in history */
  jumpToHistory: (index: number) => void;
  /** Total number of entries in history */
  totalHistoryEntries: number;
  /** Start batching changes - they won't create history entries until endBatch is called */
  startBatch: () => void;
  /** End batching and commit all changes as a single history entry */
  endBatch: (label?: string) => void;
  /** Whether currently in batch mode */
  isBatching: boolean;
}

/**
 * Hook for unlimited undo/redo functionality with history timeline support
 *
 * @param initialState - Initial state value
 * @param maxHistory - Maximum history length (default: unlimited)
 */
export function useUndoRedo<T>(
  initialState: T,
  maxHistory: number = Infinity
): UseUndoRedoResult<T> {
  // Past entries with labels
  const [past, setPast] = useState<HistoryEntry<T>[]>([]);
  // Future entries with labels (for redo)
  const [future, setFuture] = useState<HistoryEntry<T>[]>([]);
  // Current state entry
  const [presentEntry, setPresentEntry] = useState<HistoryEntry<T>>({
    state: initialState,
    label: "Initial state",
    timestamp: Date.now(),
  });

  // Batching support - accumulate changes without creating history entries
  // Use ref for immediate synchronous access (setState is async)
  const isBatchingRef = useRef(false);
  const batchStartEntryRef = useRef<HistoryEntry<T> | null>(null);

  const setState = useCallback(
    (newState: T, label?: string) => {
      if (isBatchingRef.current) {
        // When batching, just update present without recording to history
        setPresentEntry({
          state: newState,
          label,
          timestamp: Date.now(),
        });
        return;
      }

      setPast((prevPast) => {
        // Add current entry to past
        let newPast = [...prevPast, presentEntry];
        // Limit history if needed
        if (newPast.length > maxHistory) {
          newPast = newPast.slice(-maxHistory);
        }
        return newPast;
      });
      // Clear future (new branch in history)
      setFuture([]);
      // Set new present
      setPresentEntry({
        state: newState,
        label,
        timestamp: Date.now(),
      });
    },
    [presentEntry, maxHistory]
  );

  const startBatch = useCallback(() => {
    if (!isBatchingRef.current) {
      // Save the current entry so we can add it to history when batch ends
      batchStartEntryRef.current = presentEntry;
      isBatchingRef.current = true;
    }
  }, [presentEntry]);

  const endBatch = useCallback(
    (label?: string) => {
      if (isBatchingRef.current && batchStartEntryRef.current) {
        // Only create history entry if state actually changed
        const startState = JSON.stringify(batchStartEntryRef.current.state);
        const currentState = JSON.stringify(presentEntry.state);

        if (startState !== currentState) {
          // Add the batch start entry to past
          setPast((prevPast) => {
            let newPast = [...prevPast, batchStartEntryRef.current!];
            if (newPast.length > maxHistory) {
              newPast = newPast.slice(-maxHistory);
            }
            return newPast;
          });
          // Clear future (new branch in history)
          setFuture([]);
          // Update present with the batch label
          setPresentEntry((prev) => ({
            ...prev,
            label: label || prev.label,
          }));
        }

        batchStartEntryRef.current = null;
        isBatchingRef.current = false;
      }
    },
    [presentEntry, maxHistory]
  );

  const resetState = useCallback((newState: T) => {
    // Reset without adding to history
    setPast([]);
    setFuture([]);
    setPresentEntry({
      state: newState,
      label: "Initial state",
      timestamp: Date.now(),
    });
  }, []);

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;

      const previous = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, -1);

      // Move present to future
      setFuture((prevFuture) => [presentEntry, ...prevFuture]);
      setPresentEntry(previous);

      return newPast;
    });
  }, [presentEntry]);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;

      const next = prevFuture[0];
      const newFuture = prevFuture.slice(1);

      // Move present to past
      setPast((prevPast) => [...prevPast, presentEntry]);
      setPresentEntry(next);

      return newFuture;
    });
  }, [presentEntry]);

  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  // Combined history: past + present + future (for timeline display)
  const history = useMemo(() => {
    return [...past, presentEntry, ...future];
  }, [past, presentEntry, future]);

  // Total number of entries
  const totalHistoryEntries = past.length + 1 + future.length;

  // Current index is always the last item (present)
  const historyIndex = past.length;

  // Jump to a specific point in history
  const jumpToHistory = useCallback(
    (index: number) => {
      // Clamp index to valid range
      const totalLength = past.length + 1 + future.length;
      const clampedIndex = Math.max(0, Math.min(index, totalLength - 1));

      // If jumping to current position, do nothing
      if (clampedIndex === past.length) return;

      // Combine all entries into one timeline
      const allEntries = [...past, presentEntry, ...future];
      const targetEntry = allEntries[clampedIndex];

      // Split into new past, present, future
      const newPast = allEntries.slice(0, clampedIndex);
      const newFuture = allEntries.slice(clampedIndex + 1);

      setPast(newPast);
      setPresentEntry(targetEntry);
      setFuture(newFuture);
    },
    [past, presentEntry, future]
  );

  return {
    state: presentEntry.state,
    setState,
    resetState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    historyLength: past.length + future.length,
    clearHistory,
    history,
    historyIndex,
    jumpToHistory,
    totalHistoryEntries,
    startBatch,
    endBatch,
    isBatching: isBatchingRef.current,
  };
}

/**
 * Deep clone helper for state snapshots
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
