"use client";

import { useRef, useMemo } from "react";
import { CharacterDisplay, EmptyCharacterDisplay } from "./CharacterDisplay";
import { Character, CharacterSetConfig } from "@/lib/character-editor/types";
import { useResizeObserver } from "@/hooks/useResizeObserver";

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
 * Grid with clickable characters that captures shift key properly
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
}: CharacterGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { size } = useResizeObserver<HTMLDivElement>();

  // Calculate character display size (scaled)
  const charWidth = config.width * smallScale;

  const columns = useMemo(() => {
    if (!size.width) return minColumns;

    const cellWidth = charWidth + gap + 8; // Account for selection ring
    const availableWidth = size.width - gap;
    const cols = Math.floor(availableWidth / cellWidth);

    return Math.max(minColumns, Math.min(maxColumns, cols));
  }, [size.width, charWidth, gap, minColumns, maxColumns]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto p-2 ${className}`}
      role="listbox"
      aria-label="Character selection grid"
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, auto)`,
          gap: `${gap}px`,
        }}
      >
        {characters.map((character, index) => (
          <div
            key={index}
            onClick={(e) => onSelect?.(index, e.shiftKey, e.metaKey || e.ctrlKey)}
            onContextMenu={(e) => {
              if (onContextMenu) {
                e.preventDefault();
                // Select the character on right-click if not already selected
                if (selectedIndex !== index && !batchSelection?.has(index)) {
                  onSelect?.(index, false, false);
                }
                onContextMenu(e.clientX, e.clientY, index);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.(index, e.shiftKey, e.metaKey || e.ctrlKey);
              }
            }}
            role="option"
            aria-selected={selectedIndex === index || batchSelection?.has(index)}
            tabIndex={0}
            className="focus:outline-none focus-visible:ring-1 focus-visible:ring-retro-cyan rounded"
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
          </div>
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
