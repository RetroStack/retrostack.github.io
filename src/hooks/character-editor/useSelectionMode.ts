/**
 * Selection Mode Hook
 *
 * Manages touch-friendly selection mode for the character grid.
 * Provides a unified interface for both mobile (selection mode with
 * tap-to-toggle) and desktop (shift+click, ctrl+click) patterns.
 *
 * Typically used with useLongPress (to enter selection mode on long press)
 * and useDragSelect (for drag-to-select multiple items).
 *
 * Selection mode is the state where tapping items toggles their selection
 * rather than making them the active item for editing.
 *
 * @module hooks/character-editor/useSelectionMode
 */
"use client";

import { useCallback, useState, useMemo } from "react";

export interface UseSelectionModeOptions {
  /** Total number of items that can be selected */
  itemCount: number;
  /** Current primary selected index */
  selectedIndex: number;
  /** Current batch selection set */
  batchSelection: Set<number>;
  /** Callback to update selection (same signature as toggleBatchSelection) */
  onSelect: (index: number, extend: boolean, toggle?: boolean) => void;
  /** Optional callback when selection mode changes */
  onSelectionModeChange?: (isActive: boolean) => void;
}

export interface UseSelectionModeResult {
  /** Whether selection mode is currently active */
  isSelectionMode: boolean;

  /** Enter selection mode, optionally with an initial item selected */
  enterSelectionMode: (initialIndex?: number) => void;

  /** Exit selection mode (clears batch selection) */
  exitSelectionMode: () => void;

  /** Toggle selection mode on/off */
  toggleSelectionMode: () => void;

  /** Toggle a single item in/out of selection (for use in selection mode) */
  toggleItem: (index: number) => void;

  /** Select all items */
  selectAll: () => void;

  /** Clear all batch selections */
  clearSelection: () => void;

  /**
   * Unified handler for item interaction.
   * - In selection mode: toggles item
   * - Outside selection mode: uses shift/ctrl behavior
   */
  handleItemInteraction: (index: number, shiftKey: boolean, metaOrCtrlKey?: boolean) => void;

  /**
   * Handler for long press - enters selection mode with item selected
   */
  handleLongPress: (index: number) => void;

  /** Number of currently selected items (including primary) */
  selectionCount: number;

  /** Whether any items are selected beyond the primary */
  hasMultipleSelected: boolean;

  /** Set of all selected indices (primary + batch) */
  selectedIndices: Set<number>;
}

/**
 * Hook for managing touch-friendly selection mode.
 *
 * Provides a unified interface for both touch (selection mode with tap-to-toggle)
 * and desktop (shift+click, ctrl+click) selection patterns.
 *
 * @example
 * ```tsx
 * const {
 *   isSelectionMode,
 *   handleItemInteraction,
 *   handleLongPress,
 *   enterSelectionMode,
 *   exitSelectionMode,
 * } = useSelectionMode({
 *   itemCount: characters.length,
 *   selectedIndex,
 *   batchSelection,
 *   onSelect: toggleBatchSelection,
 * });
 * ```
 */
export function useSelectionMode({
  itemCount,
  selectedIndex,
  batchSelection,
  onSelect,
  onSelectionModeChange,
}: UseSelectionModeOptions): UseSelectionModeResult {
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Compute derived values
  const selectionCount = batchSelection.size + 1;
  const hasMultipleSelected = selectionCount > 1;

  const selectedIndices = useMemo(() => {
    const indices = new Set(batchSelection);
    indices.add(selectedIndex);
    return indices;
  }, [selectedIndex, batchSelection]);

  const enterSelectionMode = useCallback(
    (initialIndex?: number) => {
      setIsSelectionMode(true);
      onSelectionModeChange?.(true);

      // If an initial index is provided and it's not already selected,
      // add it to the selection
      if (initialIndex !== undefined && initialIndex !== selectedIndex && !batchSelection.has(initialIndex)) {
        onSelect(initialIndex, false, true); // toggle = true to add to selection
      }
    },
    [selectedIndex, batchSelection, onSelect, onSelectionModeChange],
  );

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    onSelectionModeChange?.(false);
    // Clear batch selection when exiting
    onSelect(selectedIndex, false, false);
  }, [selectedIndex, onSelect, onSelectionModeChange]);

  const toggleSelectionMode = useCallback(() => {
    if (isSelectionMode) {
      exitSelectionMode();
    } else {
      enterSelectionMode();
    }
  }, [isSelectionMode, enterSelectionMode, exitSelectionMode]);

  const toggleItem = useCallback(
    (index: number) => {
      // In selection mode, toggle adds/removes from selection
      onSelect(index, false, true);
    },
    [onSelect],
  );

  const selectAll = useCallback(() => {
    // Select all by adding each item to batch selection
    for (let i = 0; i < itemCount; i++) {
      if (i !== selectedIndex && !batchSelection.has(i)) {
        onSelect(i, false, true);
      }
    }
  }, [itemCount, selectedIndex, batchSelection, onSelect]);

  const clearSelection = useCallback(() => {
    // Clear by doing a normal select on current index
    onSelect(selectedIndex, false, false);
  }, [selectedIndex, onSelect]);

  const handleItemInteraction = useCallback(
    (index: number, shiftKey: boolean, metaOrCtrlKey?: boolean) => {
      if (isSelectionMode) {
        // In selection mode, always toggle
        toggleItem(index);
      } else {
        // Outside selection mode, use normal shift/ctrl behavior
        onSelect(index, shiftKey, metaOrCtrlKey);
      }
    },
    [isSelectionMode, toggleItem, onSelect],
  );

  const handleLongPress = useCallback(
    (index: number) => {
      if (!isSelectionMode) {
        enterSelectionMode(index);
      }
    },
    [isSelectionMode, enterSelectionMode],
  );

  return {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelectionMode,
    toggleItem,
    selectAll,
    clearSelection,
    handleItemInteraction,
    handleLongPress,
    selectionCount,
    hasMultipleSelected,
    selectedIndices,
  };
}
