/**
 * Interactive Character Grid Component
 *
 * A fully interactive grid for character selection and editing.
 * Features:
 * - Responsive column count based on container width
 * - Click selection with shift/meta modifiers
 * - Long press for touch selection mode
 * - Drag-to-select multiple characters
 * - Right-click context menu
 * - Optional "add new" button at end
 * - Selection mode integration
 *
 * Used in EditorSidebar for the main character picker.
 *
 * @module components/character-editor/character/InteractiveCharacterGrid
 */
"use client";

import { useRef, useMemo, useCallback, useEffect } from "react";
import { EmptyCharacterDisplay } from "./CharacterDisplay";
import { CharacterGridItem } from "./CharacterGridItem";
import { Character, CharacterSetConfig } from "@/lib/character-editor/types";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { useDragSelect } from "@/hooks/useDragSelect";
import { useGridKeyboardNavigation } from "@/hooks/useGridKeyboardNavigation";

export interface InteractiveCharacterGridProps {
  /** Array of characters to display */
  characters: Character[];
  /** Character set configuration */
  config: CharacterSetConfig;
  /** Currently selected character index */
  selectedIndex?: number;
  /** Set of batch-selected character indices */
  batchSelection?: Set<number>;
  /** Callback when a character is selected */
  onSelect?: (index: number, shiftKey: boolean, metaOrCtrlKey?: boolean) => void;
  /** Whether to show the add button at the end */
  showAddButton?: boolean;
  /** Callback when add button is clicked */
  onAdd?: () => void;
  /** Foreground color */
  foregroundColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Whether to show character indices */
  showIndices?: boolean;
  /** Minimum columns */
  minColumns?: number;
  /** Maximum columns */
  maxColumns?: number;
  /** Gap between characters in pixels */
  gap?: number;
  /** Additional CSS classes */
  className?: string;
  /** Scale factor for small character display (default 2) */
  smallScale?: number;
  /** Callback for right-click context menu */
  onContextMenu?: (x: number, y: number, index: number) => void;
  /** Whether selection mode is active (touch-friendly multi-select) */
  isSelectionMode?: boolean;
  /** Callback when long press is detected on an item */
  onLongPress?: (index: number) => void;
}

/**
 * Grid with clickable characters that captures shift key properly
 *
 * Features:
 * - Touch-friendly selection mode with long-press to enter
 * - Desktop shift+click and ctrl+click support
 * - Checkmark overlay on selected items in selection mode
 * - Drag-select support (iOS Photos-style)
 */
export function InteractiveCharacterGrid({
  characters,
  config,
  selectedIndex,
  batchSelection,
  onSelect,
  showAddButton = false,
  onAdd,
  foregroundColor = "#ffffff",
  backgroundColor = "#000000",
  showIndices = false,
  minColumns = 8,
  maxColumns = 32,
  gap = 4,
  className = "",
  smallScale = 2,
  onContextMenu,
  isSelectionMode = false,
  onLongPress,
}: InteractiveCharacterGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { size } = useResizeObserver<HTMLDivElement>();

  // Calculate character display size (scaled)
  const charWidth = config.width * smallScale;

  // Cell width including padding for selection ring
  const cellWidth = charWidth + gap + 8;

  const columns = useMemo(() => {
    if (!size.width) return minColumns;

    const availableWidth = size.width - gap;
    const cols = Math.floor(availableWidth / cellWidth);

    return Math.max(minColumns, Math.min(maxColumns, cols));
  }, [size.width, cellWidth, gap, minColumns, maxColumns]);

  // Keyboard navigation for the grid
  const handleKeyboardNavigate = useCallback(
    (index: number, shiftKey: boolean) => {
      onSelect?.(index, shiftKey, false);
    },
    [onSelect]
  );

  const { handleKeyDown: handleGridKeyDown, focusItem } = useGridKeyboardNavigation({
    itemCount: characters.length,
    columns,
    currentIndex: selectedIndex ?? 0,
    onNavigate: handleKeyboardNavigate,
    containerRef,
  });

  // Focus the selected item when selection changes externally
  useEffect(() => {
    if (selectedIndex !== undefined && document.activeElement?.closest('[role="listbox"]') === containerRef.current) {
      focusItem(selectedIndex);
    }
  }, [selectedIndex, focusItem]);

  // Get item index from screen coordinates (for drag-select)
  // Uses DOM-based lookup for accuracy with auto-sized grid cells
  const getIndexFromPoint = useCallback(
    (clientX: number, clientY: number): number | null => {
      const element = document.elementFromPoint(clientX, clientY);
      if (!element) return null;

      // Traverse up to find element with data-grid-index
      let current: Element | null = element;
      while (current && current !== document.body) {
        const indexAttr = current.getAttribute("data-grid-index");
        if (indexAttr !== null) {
          const index = parseInt(indexAttr, 10);
          return index >= 0 && index < characters.length ? index : null;
        }
        current = current.parentElement;
      }

      return null;
    },
    [characters.length]
  );

  // Drag-select hook for iOS Photos-style multi-select
  const dragSelect = useDragSelect({
    enabled: isSelectionMode,
    onItemTouched: (index) => onSelect?.(index, false, true), // Toggle mode
    getIndexFromPoint,
  });

  return (
    <div
      ref={containerRef}
      className={`overflow-auto p-2 ${className} ${isSelectionMode ? "ring-4 ring-retro-cyan rounded bg-retro-cyan/10" : ""} ${dragSelect.isDragging ? "ring-4 ring-retro-pink bg-retro-pink/20" : ""}`}
      role="listbox"
      aria-label="Character selection grid"
      aria-multiselectable={isSelectionMode || batchSelection !== undefined}
      onKeyDown={handleGridKeyDown}
    >
      <div
        ref={gridRef}
        className="grid select-none"
        style={{
          gridTemplateColumns: `repeat(${columns}, auto)`,
          gap: `${gap}px`,
        }}
        onTouchStartCapture={dragSelect.onTouchStart}
        onTouchMoveCapture={dragSelect.onTouchMove}
        onTouchEndCapture={dragSelect.onTouchEnd}
        onMouseDownCapture={dragSelect.onMouseDown}
        onMouseMoveCapture={dragSelect.onMouseMove}
        onMouseUpCapture={dragSelect.onMouseUp}
        onClickCapture={dragSelect.onClickCapture}
      >
        {characters.map((character, index) => (
          <CharacterGridItem
            key={index}
            character={character}
            index={index}
            selectedIndex={selectedIndex}
            batchSelection={batchSelection}
            onSelect={onSelect}
            onContextMenu={onContextMenu}
            onLongPress={onLongPress}
            isSelectionMode={isSelectionMode}
            smallScale={smallScale}
            foregroundColor={foregroundColor}
            backgroundColor={backgroundColor}
            showIndices={showIndices}
          />
        ))}

        {showAddButton && (
          <EmptyCharacterDisplay
            width={config.width}
            height={config.height}
            mode="small"
            smallScale={smallScale}
            onClick={onAdd}
          />
        )}
      </div>
    </div>
  );
}
