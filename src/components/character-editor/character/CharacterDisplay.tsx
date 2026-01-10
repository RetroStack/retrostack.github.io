/**
 * Character Display Components
 *
 * Components for rendering individual character bitmaps:
 * - CharacterDisplay: Main display component with two modes
 *   - small: Thumbnail view for grids (1:1 or scaled, no grid lines)
 *   - large: Editing view with grid lines and interaction
 * - EmptyCharacterDisplay: Placeholder for "add new" button
 *
 * Uses PixelGrid internally for canvas-based rendering.
 *
 * @module components/character-editor/character/CharacterDisplay
 */
"use client";

import { useMemo } from "react";
import { PixelGrid } from "../editor/PixelGrid";
import { Character } from "@/lib/character-editor/types";

export interface CharacterDisplayProps {
  /** Character data to display */
  character: Character;
  /** Display mode - small (scaled, no grid) or large (scaled with grid) */
  mode?: "small" | "large";
  /** Scale factor for large mode */
  scale?: number;
  /** Scale factor for small mode (default 2 for better visibility) */
  smallScale?: number;
  /** Whether this character is selected */
  selected?: boolean;
  /** Whether this character is in a batch selection */
  batchSelected?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Pixel click handler (for editing, isRightClick indicates right mouse button) */
  onPixelClick?: (row: number, col: number, isRightClick?: boolean) => void;
  /** Pixel drag handler (for editing) */
  onPixelDrag?: (row: number, col: number) => void;
  /** Drag end handler */
  onDragEnd?: () => void;
  /** Pixel hover handler (for coordinate display) */
  onPixelHover?: (row: number, col: number) => void;
  /** Pixel leave handler (when mouse leaves canvas) */
  onPixelLeave?: () => void;
  /** Foreground color */
  foregroundColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Grid line color (large mode only) */
  gridColor?: string;
  /** Grid line thickness (large mode only) */
  gridThickness?: number;
  /** Whether clicking is enabled */
  interactive?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show checkered pattern for mixed pixels */
  mixedPixels?: Set<string>;
  /** Character index (for display) */
  index?: number;
  /** Show character index */
  showIndex?: boolean;
}

/**
 * Single character display component
 *
 * Provides two display modes:
 * - small: 1:1 pixel rendering for overview grids
 * - large: Scaled rendering with grid lines for editing
 */
export function CharacterDisplay({
  character,
  mode = "small",
  scale = 20,
  smallScale = 2,
  selected = false,
  batchSelected = false,
  onClick,
  onPixelClick,
  onPixelDrag,
  onDragEnd,
  onPixelHover,
  onPixelLeave,
  foregroundColor = "#ffffff",
  backgroundColor = "#000000",
  gridColor = "#333333",
  gridThickness = 1,
  interactive = true,
  className = "",
  mixedPixels,
  index,
  showIndex = false,
}: CharacterDisplayProps) {
  const isLarge = mode === "large";

  // Calculate actual scale based on mode
  const actualScale = isLarge ? scale : smallScale;

  // Determine border styling based on selection state
  const borderClass = useMemo(() => {
    if (selected) {
      return "ring-2 ring-retro-cyan ring-offset-2 ring-offset-retro-dark";
    }
    if (batchSelected) {
      return "ring-2 ring-retro-pink/50 ring-offset-1 ring-offset-retro-dark";
    }
    return "";
  }, [selected, batchSelected]);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick && !isLarge) {
      e.stopPropagation();
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && !isLarge && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  const wrapperClasses = [
    "relative inline-block",
    !isLarge && interactive ? "cursor-pointer" : "",
    !isLarge && interactive ? "hover:opacity-80 transition-opacity" : "",
    borderClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={wrapperClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={!isLarge && interactive ? "button" : undefined}
      tabIndex={!isLarge && interactive ? 0 : undefined}
      aria-pressed={selected || batchSelected}
      aria-label={
        index !== undefined ? `Character ${index}` : "Character"
      }
    >
      <PixelGrid
        pixels={character.pixels}
        scale={actualScale}
        showGrid={isLarge}
        gridColor={gridColor}
        gridThickness={isLarge ? gridThickness : 0}
        foregroundColor={foregroundColor}
        backgroundColor={backgroundColor}
        onPixelClick={isLarge ? onPixelClick : undefined}
        onPixelDrag={isLarge ? onPixelDrag : undefined}
        onDragEnd={isLarge ? onDragEnd : undefined}
        onPixelHover={isLarge ? onPixelHover : undefined}
        onPixelLeave={isLarge ? onPixelLeave : undefined}
        interactive={isLarge && interactive}
        mixedPixels={mixedPixels}
      />

      {/* Character index badge */}
      {showIndex && index !== undefined && (
        <div className="absolute -top-1 -right-1 bg-retro-navy/90 text-[8px] text-gray-400 px-1 rounded font-mono">
          {index}
        </div>
      )}

    </div>
  );
}

/**
 * Empty character placeholder
 */
export function EmptyCharacterDisplay({
  width,
  height,
  mode = "small",
  scale = 20,
  smallScale = 2,
  onClick,
  className = "",
}: {
  width: number;
  height: number;
  mode?: "small" | "large";
  scale?: number;
  smallScale?: number;
  onClick?: () => void;
  className?: string;
}) {
  const isLarge = mode === "large";
  const actualScale = isLarge ? scale : smallScale;
  const gridThickness = 1;

  const pixelWidth = width * actualScale + (isLarge ? (width + 1) * gridThickness : 0);
  const pixelHeight = height * actualScale + (isLarge ? (height + 1) * gridThickness : 0);

  return (
    <div
      className={`relative inline-flex items-center justify-center bg-retro-navy/50 border border-dashed border-retro-grid/50 cursor-pointer hover:border-retro-cyan/50 transition-colors ${className}`}
      style={{ width: pixelWidth, height: pixelHeight }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label="Add new character"
    >
      <svg
        className="w-6 h-6 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    </div>
  );
}
