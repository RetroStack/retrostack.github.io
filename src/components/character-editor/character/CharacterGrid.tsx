/**
 * Character Grid Component
 *
 * Responsive grid layout for displaying all characters in a character set.
 * Shows character thumbnails with optional indices and selection states.
 *
 * Auto-calculates optimal column count based on container width.
 * For interactive selection (shift-click, context menu, etc.),
 * use InteractiveCharacterGrid instead.
 *
 * Also re-exports related components:
 * - CharacterPreviewGrid: For read-only preview displays
 * - CharacterGridItem: Individual grid item with selection
 * - InteractiveCharacterGrid: Full interactive version with selection
 *
 * @module components/character-editor/character/CharacterGrid
 */
"use client";

import { useRef, useMemo } from "react";
import { CharacterDisplay, EmptyCharacterDisplay } from "./CharacterDisplay";
import { Character, CharacterSetConfig } from "@/lib/character-editor/types";
import { useResizeObserver } from "@/hooks/useResizeObserver";

// Re-export split components for backward compatibility
export { CharacterPreviewGrid, type CharacterPreviewGridProps } from "./CharacterPreviewGrid";
export { CharacterGridItem, type CharacterGridItemProps } from "./CharacterGridItem";
export { InteractiveCharacterGrid, type InteractiveCharacterGridProps } from "./InteractiveCharacterGrid";

export interface CharacterGridProps {
  /** Array of characters to display */
  characters: Character[];
  /** Character set configuration */
  config: CharacterSetConfig;
  /** Currently selected character index */
  selectedIndex?: number;
  /** Set of batch-selected character indices */
  batchSelection?: Set<number>;
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
 * Grid display of all characters in a character set (display-only)
 *
 * Features:
 * - Responsive column layout based on container width
 * - Selection state visualization (visual only, no click handling)
 * - Optional add button for new characters
 *
 * Note: For interactive selection with shift-click, use InteractiveCharacterGrid instead.
 */
export function CharacterGrid({
  characters,
  config,
  selectedIndex,
  batchSelection,
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
      data-testid="character-grid"
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
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {selectedIndex !== undefined && `Selected character ${selectedIndex} of ${characters.length}`}
      </div>
    </div>
  );
}
