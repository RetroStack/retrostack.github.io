/**
 * Grid Keyboard Navigation Hook
 *
 * Provides arrow key navigation for grid-based components.
 * Handles Up/Down/Left/Right arrows, Home/End, and PageUp/PageDown.
 *
 * @module hooks/useGridKeyboardNavigation
 */
import { useCallback, useRef, type KeyboardEvent } from "react";

export interface UseGridKeyboardNavigationOptions {
  /** Total number of items in the grid */
  itemCount: number;
  /** Number of columns in the grid */
  columns: number;
  /** Currently focused/selected index */
  currentIndex: number;
  /** Callback when navigation occurs - receives new index and whether shift was held */
  onNavigate: (index: number, shiftKey: boolean) => void;
  /** Number of items to jump on PageUp/PageDown (default: columns * 3) */
  pageSize?: number;
  /** Selector for focusable grid items (default: '[role="option"]') */
  itemSelector?: string;
  /** Container ref for DOM queries (optional - if not provided, uses document.activeElement) */
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export interface UseGridKeyboardNavigationReturn {
  /** Key down handler to attach to the grid container */
  handleKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  /** Focus a specific item by index */
  focusItem: (index: number) => void;
  /** Container ref - either the provided one or an internal ref */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook for keyboard navigation in grids.
 *
 * @example
 * ```tsx
 * const { handleKeyDown, containerRef, focusItem } = useGridKeyboardNavigation({
 *   itemCount: items.length,
 *   columns: 8,
 *   currentIndex: selectedIndex,
 *   onNavigate: (index, shift) => setSelectedIndex(index),
 * });
 *
 * return (
 *   <div ref={containerRef} onKeyDown={handleKeyDown}>
 *     {items.map((item, i) => <GridItem key={i} tabIndex={0} />)}
 *   </div>
 * );
 * ```
 */
export function useGridKeyboardNavigation({
  itemCount,
  columns,
  currentIndex,
  onNavigate,
  pageSize,
  itemSelector = '[role="option"]',
  containerRef: externalContainerRef,
}: UseGridKeyboardNavigationOptions): UseGridKeyboardNavigationReturn {
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = externalContainerRef ?? internalContainerRef;

  const effectivePageSize = pageSize ?? columns * 3;

  // Focus a specific item by index
  const focusItem = useCallback(
    (index: number) => {
      if (!containerRef.current) return;

      const items = containerRef.current.querySelectorAll<HTMLElement>(itemSelector);
      const targetItem = items[index];
      if (targetItem) {
        targetItem.focus();
      }
    },
    [containerRef, itemSelector]
  );

  // Calculate new index based on key pressed
  const getNextIndex = useCallback(
    (key: string, currentIdx: number): number | null => {
      if (itemCount === 0) return null;

      const currentCol = currentIdx % columns;
      const totalRows = Math.ceil(itemCount / columns);

      switch (key) {
        case "ArrowRight": {
          const next = currentIdx + 1;
          return next < itemCount ? next : currentIdx;
        }
        case "ArrowLeft": {
          const next = currentIdx - 1;
          return next >= 0 ? next : currentIdx;
        }
        case "ArrowDown": {
          const next = currentIdx + columns;
          // If going down would exceed item count, go to last item in column or last item
          if (next >= itemCount) {
            // Find the last item in the same column
            const lastRowStart = (totalRows - 1) * columns;
            const lastInColumn = lastRowStart + currentCol;
            return lastInColumn < itemCount ? lastInColumn : itemCount - 1;
          }
          return next;
        }
        case "ArrowUp": {
          const next = currentIdx - columns;
          return next >= 0 ? next : currentCol; // Go to first row, same column
        }
        case "Home":
          return 0;
        case "End":
          return itemCount - 1;
        case "PageDown": {
          const next = Math.min(currentIdx + effectivePageSize, itemCount - 1);
          return next;
        }
        case "PageUp": {
          const next = Math.max(currentIdx - effectivePageSize, 0);
          return next;
        }
        default:
          return null;
      }
    },
    [itemCount, columns, effectivePageSize]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const navigationKeys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
        "PageUp",
        "PageDown",
      ];

      if (!navigationKeys.includes(e.key)) return;

      // Don't interfere with default behavior if focus is in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const newIndex = getNextIndex(e.key, currentIndex);

      if (newIndex !== null && newIndex !== currentIndex) {
        e.preventDefault();
        onNavigate(newIndex, e.shiftKey);
        focusItem(newIndex);
      }
    },
    [currentIndex, getNextIndex, onNavigate, focusItem]
  );

  return {
    handleKeyDown,
    containerRef,
    focusItem,
  };
}
