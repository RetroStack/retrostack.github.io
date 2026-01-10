/**
 * Drag Select Hook
 *
 * Enables iOS Photos-style drag-select in grids. When in selection mode,
 * users can drag across multiple items to select/toggle them in one motion.
 *
 * Features:
 * - Tracks touched items to avoid re-toggling same item
 * - Supports both touch (mobile) and mouse (desktop)
 * - Threshold before drag is recognized to avoid accidental drags
 * - Coordinates with existing tap/click handlers
 * - Prevents click events after drag ends
 *
 * Typically used with useSelectionMode and useLongPress for a complete
 * selection experience.
 *
 * @module hooks/useDragSelect
 */
"use client";

import { useCallback, useRef, useState } from "react";

export interface UseDragSelectOptions {
  /** Whether drag select is enabled (should be true when isSelectionMode) */
  enabled: boolean;
  /** Callback when an item is touched during drag */
  onItemTouched: (index: number) => void;
  /** Function to get item index from touch/mouse coordinates */
  getIndexFromPoint: (clientX: number, clientY: number) => number | null;
  /** Callback when drag starts */
  onDragStart?: () => void;
  /** Callback when drag ends */
  onDragEnd?: () => void;
  /** Minimum movement in pixels before drag is recognized (default: 5) */
  dragThreshold?: number;
}

export interface UseDragSelectResult {
  /** Touch start handler - attach to container */
  onTouchStart: (e: React.TouchEvent) => void;
  /** Touch move handler - attach to container */
  onTouchMove: (e: React.TouchEvent) => void;
  /** Touch end handler - attach to container */
  onTouchEnd: (e: React.TouchEvent) => void;
  /** Mouse down handler - attach to container */
  onMouseDown: (e: React.MouseEvent) => void;
  /** Mouse move handler - attach to container */
  onMouseMove: (e: React.MouseEvent) => void;
  /** Mouse up handler - attach to container */
  onMouseUp: (e: React.MouseEvent) => void;
  /** Click capture handler - attach to container to prevent clicks after drag */
  onClickCapture: (e: React.MouseEvent) => void;
  /** Whether currently dragging */
  isDragging: boolean;
}

/**
 * Hook for iOS Photos-style drag-select in grids.
 *
 * When enabled (typically in selection mode), allows users to drag
 * across multiple items to select/toggle them in one motion.
 *
 * Features:
 * - Tracks touched items to avoid re-toggling same item
 * - Supports both touch (mobile) and mouse (desktop)
 * - Threshold before drag is recognized to avoid accidental drags
 * - Coordinates with existing tap/click handlers
 *
 * @example
 * ```tsx
 * const getIndexFromPoint = useCallback((x, y) => {
 *   // Calculate which grid item is at (x, y)
 *   return calculateGridIndex(x, y);
 * }, []);
 *
 * const dragSelect = useDragSelect({
 *   enabled: isSelectionMode,
 *   onItemTouched: (index) => toggleSelection(index),
 *   getIndexFromPoint,
 * });
 *
 * return (
 *   <div
 *     onTouchStart={dragSelect.onTouchStart}
 *     onTouchMove={dragSelect.onTouchMove}
 *     onTouchEnd={dragSelect.onTouchEnd}
 *     onMouseDown={dragSelect.onMouseDown}
 *     onMouseMove={dragSelect.onMouseMove}
 *     onMouseUp={dragSelect.onMouseUp}
 *     onClickCapture={dragSelect.onClickCapture}
 *   >
 *     {items}
 *   </div>
 * );
 * ```
 */
export function useDragSelect({
  enabled,
  onItemTouched,
  getIndexFromPoint,
  onDragStart,
  onDragEnd,
  dragThreshold = 5,
}: UseDragSelectOptions): UseDragSelectResult {
  const [isDragging, setIsDragging] = useState(false);

  // Track state during drag
  const stateRef = useRef<{
    startPos: { x: number; y: number } | null;
    touchedIndices: Set<number>;
    isActive: boolean;
    hasMoved: boolean;
  }>({
    startPos: null,
    touchedIndices: new Set(),
    isActive: false,
    hasMoved: false,
  });

  // Track if we just finished dragging (to prevent click after drag)
  const justFinishedDraggingRef = useRef(false);

  // Track if mouse button is currently pressed (Safari doesn't reliably report e.buttons)
  const isMouseDownRef = useRef(false);

  const startDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled) return;

      const index = getIndexFromPoint(clientX, clientY);

      stateRef.current = {
        startPos: { x: clientX, y: clientY },
        touchedIndices: new Set(),
        isActive: true,
        hasMoved: false,
      };

      // If we start on a valid item, include it in touched indices
      // but don't toggle yet - wait until we know it's a drag
      if (index !== null) {
        stateRef.current.touchedIndices.add(index);
      }
    },
    [enabled, getIndexFromPoint],
  );

  const moveDrag = useCallback(
    (clientX: number, clientY: number) => {
      const state = stateRef.current;
      if (!enabled || !state.isActive || !state.startPos) return;

      // Check if we've moved enough to be considered a drag
      if (!state.hasMoved) {
        const dx = Math.abs(clientX - state.startPos.x);
        const dy = Math.abs(clientY - state.startPos.y);

        if (dx < dragThreshold && dy < dragThreshold) {
          return; // Not moved enough yet
        }

        // We're now dragging
        state.hasMoved = true;
        setIsDragging(true);
        onDragStart?.();

        // Toggle the first item we started on
        const firstTouched = Array.from(state.touchedIndices)[0];
        if (firstTouched !== undefined) {
          onItemTouched(firstTouched);
        }
      }

      // Get current item under finger/cursor
      const currentIndex = getIndexFromPoint(clientX, clientY);

      if (currentIndex !== null && !state.touchedIndices.has(currentIndex)) {
        // New item - toggle it and add to touched set
        state.touchedIndices.add(currentIndex);
        onItemTouched(currentIndex);
      }
    },
    [enabled, dragThreshold, getIndexFromPoint, onItemTouched, onDragStart],
  );

  const endDrag = useCallback(() => {
    const state = stateRef.current;

    if (state.hasMoved) {
      setIsDragging(false);
      onDragEnd?.();
      // Mark that we just finished dragging to prevent the subsequent click
      justFinishedDraggingRef.current = true;
    }

    // Reset state
    stateRef.current = {
      startPos: null,
      touchedIndices: new Set(),
      isActive: false,
      hasMoved: false,
    };
  }, [onDragEnd]);

  // Touch handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) {
        endDrag();
        return;
      }
      const touch = e.touches[0];
      startDrag(touch.clientX, touch.clientY);
    },
    [startDrag, endDrag],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) {
        endDrag();
        return;
      }
      const touch = e.touches[0];
      moveDrag(touch.clientX, touch.clientY);
    },
    [moveDrag, endDrag],
  );

  const onTouchEnd = useCallback(() => {
    endDrag();
  }, [endDrag]);

  // Mouse handlers (for desktop testing and hybrid devices)
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      isMouseDownRef.current = true;
      if (enabled) {
        // Prevent text selection when drag-select is enabled
        e.preventDefault();
      }
      startDrag(e.clientX, e.clientY);
    },
    [startDrag, enabled],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Only track if mouse button is held (use ref for Safari compatibility)
      if (!isMouseDownRef.current) return;
      moveDrag(e.clientX, e.clientY);
    },
    [moveDrag],
  );

  const onMouseUp = useCallback(() => {
    isMouseDownRef.current = false;
    endDrag();
  }, [endDrag]);

  // Click capture handler to prevent clicks after drag
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (justFinishedDraggingRef.current) {
      e.stopPropagation();
      e.preventDefault();
      justFinishedDraggingRef.current = false;
    }
  }, []);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onClickCapture,
    isDragging,
  };
}
