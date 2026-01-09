"use client";

import { useRef, useMemo, useCallback } from "react";
import { CharacterDisplay, EmptyCharacterDisplay } from "./CharacterDisplay";
import { Character, CharacterSetConfig } from "@/lib/character-editor/types";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { useLongPress } from "@/hooks/useLongPress";
import { useDragSelect } from "@/hooks/useDragSelect";

export interface CharacterGridProps {
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
  /** Whether characters are interactive */
  interactive?: boolean;
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
 * Grid display of all characters in a character set
 *
 * Features:
 * - Responsive column layout based on container width
 * - Selection state visualization
 * - Batch selection support with shift-click
 * - Optional add button for new characters
 */
export function CharacterGrid({
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
  minColumns = 4,
  maxColumns = 32,
  gap = 4,
  className = "",
  interactive = true,
  smallScale = 2,
}: CharacterGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { size } = useResizeObserver<HTMLDivElement>();

  // Calculate character display size (scaled)
  const charWidth = config.width * smallScale;

  // Calculate optimal number of columns based on container width
  const columns = useMemo(() => {
    if (!size.width) return minColumns;

    const cellWidth = charWidth + gap;
    const availableWidth = size.width - gap;
    const cols = Math.floor(availableWidth / cellWidth);

    return Math.max(minColumns, Math.min(maxColumns, cols));
  }, [size.width, charWidth, gap, minColumns, maxColumns]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      role="listbox"
      aria-label="Character grid"
      aria-multiselectable={batchSelection !== undefined}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, ${charWidth}px)`,
          gap: `${gap}px`,
          padding: `${gap}px`,
        }}
      >
        {characters.map((character, index) => (
          <CharacterDisplay
            key={index}
            character={character}
            mode="small"
            smallScale={smallScale}
            selected={selectedIndex === index}
            batchSelected={batchSelection?.has(index) && selectedIndex !== index}
            onClick={() => {
              if (onSelect) {
                // We need to handle the click in a way that captures shift key
                // This is handled via the div wrapper below
              }
            }}
            foregroundColor={foregroundColor}
            backgroundColor={backgroundColor}
            interactive={interactive}
            index={index}
            showIndex={showIndices}
          />
        ))}

        {/* Add new character button */}
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

      {/* Click handler overlay for shift detection */}
      <style jsx>{`
        .grid > :global(*) {
          cursor: ${interactive ? "pointer" : "default"};
        }
      `}</style>

      {/* Keyboard navigation */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {selectedIndex !== undefined &&
          `Selected character ${selectedIndex} of ${characters.length}`}
      </div>
    </div>
  );
}

/**
 * Simplified grid for displaying character previews (non-interactive)
 */
export function CharacterPreviewGrid({
  characters,
  config,
  maxCharacters = 16,
  foregroundColor = "#ffffff",
  backgroundColor = "#000000",
  smallScale = 1,
  className = "",
}: {
  characters: Character[];
  config: CharacterSetConfig;
  maxCharacters?: number;
  foregroundColor?: string;
  backgroundColor?: string;
  smallScale?: number;
  className?: string;
}) {
  const displayChars = characters.slice(0, maxCharacters);
  const remainingCount = characters.length - maxCharacters;

  // Calculate columns to show roughly 4 rows
  const columns = Math.ceil(Math.sqrt(maxCharacters));
  const charWidth = config.width * smallScale;

  return (
    <div className={`relative ${className}`}>
      <div
        className="grid gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${columns}, ${charWidth}px)`,
        }}
      >
        {displayChars.map((character, index) => (
          <CharacterDisplay
            key={index}
            character={character}
            mode="small"
            smallScale={smallScale}
            foregroundColor={foregroundColor}
            backgroundColor={backgroundColor}
            interactive={false}
          />
        ))}
      </div>

      {/* Show remaining count */}
      {remainingCount > 0 && (
        <div className="absolute bottom-0 right-0 bg-retro-navy/90 text-[10px] text-gray-400 px-1 rounded">
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

/**
 * Individual character item with long-press support
 */
function CharacterGridItem({
  character,
  index,
  selectedIndex,
  batchSelection,
  onSelect,
  onContextMenu,
  onLongPress,
  isSelectionMode,
  smallScale,
  foregroundColor,
  backgroundColor,
  showIndices,
}: {
  character: Character;
  index: number;
  selectedIndex?: number;
  batchSelection?: Set<number>;
  onSelect?: (index: number, shiftKey: boolean, metaOrCtrlKey?: boolean) => void;
  onContextMenu?: (x: number, y: number, index: number) => void;
  onLongPress?: (index: number) => void;
  isSelectionMode?: boolean;
  smallScale: number;
  foregroundColor: string;
  backgroundColor: string;
  showIndices: boolean;
}) {
  const isSelected = selectedIndex === index || batchSelection?.has(index);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Prevent click if this was a long press
      onSelect?.(index, e.shiftKey, e.metaKey || e.ctrlKey);
    },
    [index, onSelect],
  );

  const handleLongPress = useCallback(() => {
    onLongPress?.(index);
  }, [index, onLongPress]);

  const longPressHandlers = useLongPress({
    onLongPress: handleLongPress,
    disabled: !onLongPress,
  });

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (onContextMenu) {
        e.preventDefault();
        // Select the character on right-click if not already selected
        if (selectedIndex !== index && !batchSelection?.has(index)) {
          onSelect?.(index, false, false);
        }
        onContextMenu(e.clientX, e.clientY, index);
      }
    },
    [index, selectedIndex, batchSelection, onSelect, onContextMenu],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect?.(index, e.shiftKey, e.metaKey || e.ctrlKey);
      }
    },
    [index, onSelect],
  );

  // Merge context menu handlers - our custom handler should take precedence
  const mergedContextMenu = useCallback(
    (e: React.MouseEvent) => {
      // First, handle long press context menu prevention
      longPressHandlers.onContextMenu(e as React.MouseEvent & React.TouchEvent);
      // Then handle our custom context menu if not prevented
      if (!e.defaultPrevented) {
        handleContextMenu(e);
      }
    },
    [longPressHandlers, handleContextMenu],
  );

  return (
    <div
      onClick={handleClick}
      onContextMenu={mergedContextMenu}
      onKeyDown={handleKeyDown}
      onMouseDown={longPressHandlers.onMouseDown}
      onMouseUp={longPressHandlers.onMouseUp}
      onMouseLeave={longPressHandlers.onMouseLeave}
      onTouchStart={longPressHandlers.onTouchStart}
      onTouchEnd={longPressHandlers.onTouchEnd}
      onTouchMove={longPressHandlers.onTouchMove}
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      data-grid-index={index}
      className="focus:outline-none focus-visible:ring-1 focus-visible:ring-retro-cyan rounded relative touch-manipulation"
      style={{ touchAction: "manipulation" }}
    >
      <CharacterDisplay
        character={character}
        mode="small"
        smallScale={smallScale}
        selected={selectedIndex === index}
        batchSelected={batchSelection?.has(index) && selectedIndex !== index}
        foregroundColor={foregroundColor}
        backgroundColor={backgroundColor}
        interactive={false}
        index={index}
        showIndex={showIndices}
      />
      {/* Checkmark overlay for selection mode */}
      {isSelectionMode && isSelected && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-retro-cyan rounded-bl flex items-center justify-center">
          <svg className="w-2 h-2 text-retro-dark" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

/**
 * Grid with clickable characters that captures shift key properly
 *
 * Features:
 * - Touch-friendly selection mode with long-press to enter
 * - Desktop shift+click and ctrl+click support
 * - Checkmark overlay on selected items in selection mode
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
}: CharacterGridProps) {
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
    [characters.length],
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
