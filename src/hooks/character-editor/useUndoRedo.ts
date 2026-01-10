/**
 * Undo/Redo History Hook
 *
 * Provides unlimited undo/redo functionality with a navigable timeline.
 * Used by useCharacterEditor to track all state changes.
 *
 * Features:
 * - Unlimited history (configurable max)
 * - Timeline slider support (jumpToHistory)
 * - Batching support for drag operations (startBatch/endBatch)
 * - Labels for history entries
 *
 * Uses a single combined state object to prevent stale closure issues
 * during rapid slider movement on touch devices.
 *
 * @module hooks/character-editor/useUndoRedo
 */
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
}

/**
 * Internal state structure combining past, present, and future
 * Using a single state object enables functional updates that always
 * receive the latest state, avoiding stale closure issues.
 */
interface HistoryState<T> {
  past: HistoryEntry<T>[];
  present: HistoryEntry<T>;
  future: HistoryEntry<T>[];
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
  // Combined state for past, present, and future
  // Using a single state object allows functional updates that always
  // receive the latest state, preventing stale closure issues during
  // rapid operations like slider dragging on touch devices.
  const [historyState, setHistoryState] = useState<HistoryState<T>>(() => ({
    past: [],
    present: {
      state: initialState,
      label: "Initial state",
      timestamp: Date.now(),
    },
    future: [],
  }));

  // Batching support - accumulate changes without creating history entries
  // Use ref for immediate synchronous access (setState is async)
  const isBatchingRef = useRef(false);
  const batchStartEntryRef = useRef<HistoryEntry<T> | null>(null);

  const setState = useCallback(
    (newState: T, label?: string) => {
      if (isBatchingRef.current) {
        // When batching, just update present without recording to history
        setHistoryState((prev) => ({
          ...prev,
          present: {
            state: newState,
            label,
            timestamp: Date.now(),
          },
        }));
        return;
      }

      setHistoryState((prev) => {
        // Add current entry to past
        let newPast = [...prev.past, prev.present];
        // Limit history if needed
        if (newPast.length > maxHistory) {
          newPast = newPast.slice(-maxHistory);
        }
        return {
          past: newPast,
          present: {
            state: newState,
            label,
            timestamp: Date.now(),
          },
          // Clear future (new branch in history)
          future: [],
        };
      });
    },
    [maxHistory]
  );

  const startBatch = useCallback(() => {
    if (!isBatchingRef.current) {
      // Save the current entry so we can add it to history when batch ends
      batchStartEntryRef.current = historyState.present;
      isBatchingRef.current = true;
    }
  }, [historyState.present]);

  const endBatch = useCallback(
    (label?: string) => {
      if (!isBatchingRef.current || !batchStartEntryRef.current) {
        // Not in batch mode or no start entry, just clean up
        batchStartEntryRef.current = null;
        isBatchingRef.current = false;
        return;
      }

      // Capture the ref value before the async callback to avoid race conditions
      const batchStartEntry = batchStartEntryRef.current;

      // Clear refs immediately to prevent double-calls
      batchStartEntryRef.current = null;
      isBatchingRef.current = false;

      setHistoryState((prev) => {
        // Only create history entry if state actually changed
        const startState = JSON.stringify(batchStartEntry.state);
        const currentState = JSON.stringify(prev.present.state);

        if (startState !== currentState) {
          // Add the batch start entry to past
          let newPast = [...prev.past, batchStartEntry];
          if (newPast.length > maxHistory) {
            newPast = newPast.slice(-maxHistory);
          }

          return {
            past: newPast,
            present: {
              ...prev.present,
              label: label || prev.present.label,
            },
            // Clear future (new branch in history)
            future: [],
          };
        }

        return prev;
      });
    },
    [maxHistory]
  );

  const resetState = useCallback((newState: T) => {
    // Reset without adding to history
    setHistoryState({
      past: [],
      present: {
        state: newState,
        label: "Initial state",
        timestamp: Date.now(),
      },
      future: [],
    });
  }, []);

  const undo = useCallback(() => {
    setHistoryState((prev) => {
      if (prev.past.length === 0) return prev;

      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        // Move present to future
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistoryState((prev) => {
      if (prev.future.length === 0) return prev;

      const next = prev.future[0];
      const newFuture = prev.future.slice(1);

      return {
        // Move present to past
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistoryState((prev) => ({
      ...prev,
      past: [],
      future: [],
    }));
  }, []);

  // Jump to a specific point in history
  // Uses functional update to always receive the latest state,
  // which is critical for rapid slider movement on touch devices.
  const jumpToHistory = useCallback((index: number) => {
    setHistoryState((prev) => {
      // Clamp index to valid range
      const totalLength = prev.past.length + 1 + prev.future.length;
      const clampedIndex = Math.max(0, Math.min(index, totalLength - 1));

      // If jumping to current position, do nothing
      if (clampedIndex === prev.past.length) return prev;

      // Combine all entries into one timeline
      const allEntries = [...prev.past, prev.present, ...prev.future];
      const targetEntry = allEntries[clampedIndex];

      // Safety check: should never happen with proper clamping, but be safe
      if (!targetEntry) return prev;

      // Split into new past, present, future
      return {
        past: allEntries.slice(0, clampedIndex),
        present: targetEntry,
        future: allEntries.slice(clampedIndex + 1),
      };
    });
  }, []);

  // Derived values from combined state
  const { past, present: presentEntry, future } = historyState;

  // Combined history: past + present + future (for timeline display)
  const history = useMemo(() => {
    return [...past, presentEntry, ...future];
  }, [past, presentEntry, future]);

  // Total number of entries
  const totalHistoryEntries = past.length + 1 + future.length;

  // Current index is always the last item (present)
  const historyIndex = past.length;

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
  };
}

/**
 * Deep clone helper for state snapshots
 *
 * Uses structuredClone when available (modern browsers/Node 17+),
 * falls back to JSON parse/stringify for older environments.
 *
 * structuredClone is faster and handles more types (Date, Map, Set, etc.)
 * but JSON fallback ensures compatibility.
 */
export function deepClone<T>(obj: T): T {
  // Use structuredClone for better performance in modern environments
  if (typeof structuredClone === "function") {
    return structuredClone(obj);
  }
  // Fallback for older environments
  return JSON.parse(JSON.stringify(obj));
}
