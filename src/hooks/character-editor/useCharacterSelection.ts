/**
 * Character Selection State Hook
 *
 * Manages single and batch selection of characters in the grid:
 * - Primary selection (selectedIndex): The "active" character being edited
 * - Batch selection (batchSelection): Additional selected characters
 * - Combined selection (selectedIndices): All selected characters
 *
 * Supports:
 * - Click to select single
 * - Shift+click for range selection
 * - Cmd/Ctrl+click to toggle individual items
 * - Select All functionality
 *
 * Used by useCharacterEditor to manage selection state.
 *
 * @module hooks/character-editor/useCharacterSelection
 */
"use client";

import { useState, useCallback, useMemo } from "react";

export interface UseCharacterSelectionOptions {
  /** Total number of characters in the set */
  characterCount: number;
  /** Initial selected index */
  initialIndex?: number;
}

export interface UseCharacterSelectionResult {
  /** Currently selected character index */
  selectedIndex: number;
  /** Set selected character index */
  setSelectedIndex: (index: number) => void;
  /** Batch selected character indices (excludes primary selection) */
  batchSelection: Set<number>;
  /** Toggle batch selection for an index */
  toggleBatchSelection: (index: number, extend: boolean, toggle?: boolean) => void;
  /** Clear batch selection */
  clearBatchSelection: () => void;
  /** Select all characters */
  selectAll: () => void;
  /** Combined set of all selected indices (selectedIndex + batchSelection) */
  selectedIndices: Set<number>;
  /** Reset selection to initial state */
  resetSelection: (newIndex?: number) => void;
  /** Adjust selection after items are deleted */
  adjustSelectionAfterDelete: (deletedCount: number) => void;
}

/**
 * Hook for managing character selection state
 *
 * Features:
 * - Single primary selection (selectedIndex)
 * - Batch selection support (batchSelection)
 * - Range selection with Shift+click
 * - Toggle selection with Cmd/Ctrl+click
 * - Select all functionality
 */
export function useCharacterSelection({
  characterCount,
  initialIndex = 0,
}: UseCharacterSelectionOptions): UseCharacterSelectionResult {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [batchSelection, setBatchSelection] = useState<Set<number>>(new Set());
  const [selectionAnchor, setSelectionAnchor] = useState<number | null>(null);

  // Combined set of all selected indices
  const selectedIndices = useMemo(() => {
    const indices = new Set(batchSelection);
    indices.add(selectedIndex);
    return indices;
  }, [selectedIndex, batchSelection]);

  // Toggle batch selection with support for:
  // - Normal click: select single and clear batch
  // - Shift+click: range selection
  // - Cmd/Ctrl+click: toggle individual item
  const toggleBatchSelection = useCallback(
    (index: number, extend: boolean, toggle: boolean = false) => {
      if (toggle) {
        // CMD/CTRL+click: toggle individual item in/out of selection
        setBatchSelection((prev) => {
          const next = new Set(prev);
          if (index === selectedIndex) {
            // Clicking the primary selection with CMD/CTRL
            // If there are other items in batch, make one of them the new primary
            if (next.size > 0) {
              const [newPrimary] = next;
              next.delete(newPrimary);
              next.add(selectedIndex);
              setSelectedIndex(newPrimary);
            }
            // If nothing else selected, ignore (can't deselect everything)
          } else if (next.has(index)) {
            // Remove from batch selection
            next.delete(index);
          } else {
            // Add to batch selection
            next.add(index);
          }
          return next;
        });
      } else if (extend) {
        // Shift+click: select range from anchor (or current selection) to clicked index
        const anchor = selectionAnchor ?? selectedIndex;
        const start = Math.min(anchor, index);
        const end = Math.max(anchor, index);

        // Create new selection with range
        const rangeSelection = new Set<number>();
        for (let i = start; i <= end; i++) {
          rangeSelection.add(i);
        }

        // Set the clicked index as the new selected index
        // and add everything else (except clicked) to batch
        setSelectedIndex(index);
        rangeSelection.delete(index);
        setBatchSelection(rangeSelection);
      } else {
        // Normal click: select single and set as anchor for future range selections
        setSelectedIndex(index);
        setSelectionAnchor(index);
        setBatchSelection(new Set());
      }
    },
    [selectedIndex, selectionAnchor]
  );

  const clearBatchSelection = useCallback(() => {
    setBatchSelection(new Set());
  }, []);

  const selectAll = useCallback(() => {
    const all = new Set(Array.from({ length: characterCount }, (_, i) => i));
    // Remove the selected index from batch (it's already the primary)
    all.delete(selectedIndex);
    setBatchSelection(all);
  }, [characterCount, selectedIndex]);

  const resetSelection = useCallback((newIndex: number = 0) => {
    setSelectedIndex(newIndex);
    setSelectionAnchor(null);
    setBatchSelection(new Set());
  }, []);

  // Adjust selection indices after deletion
  const adjustSelectionAfterDelete = useCallback(
    (deletedCount: number) => {
      const newLength = characterCount - deletedCount;
      setSelectedIndex(Math.min(selectedIndex, Math.max(0, newLength - 1)));
      setBatchSelection(new Set());
    },
    [characterCount, selectedIndex]
  );

  return {
    selectedIndex,
    setSelectedIndex,
    batchSelection,
    toggleBatchSelection,
    clearBatchSelection,
    selectAll,
    selectedIndices,
    resetSelection,
    adjustSelectionAfterDelete,
  };
}
