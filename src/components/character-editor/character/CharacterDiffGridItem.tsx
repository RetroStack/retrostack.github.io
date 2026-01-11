/**
 * Character Diff Grid Item Component
 *
 * Grid item for displaying a character with diff highlighting and selection support.
 * Used in the snapshot restore selection view to show which characters differ
 * from the current state and allow users to select which ones to restore.
 *
 * @module components/character-editor/character/CharacterDiffGridItem
 */
"use client";

import { useCallback, useMemo } from "react";
import { CharacterDiffDisplay } from "./CharacterDiffDisplay";
import { Character } from "@/lib/character-editor/types";
import { useLongPress } from "@/hooks/useLongPress";
import { areCharactersEqual } from "@/lib/character-editor/utils";

export interface CharacterDiffGridItemProps {
  /** The character to display (e.g., from snapshot) */
  character: Character;
  /** The character to compare against (e.g., current state) */
  comparisonCharacter?: Character;
  /** Index of this character in the grid */
  index: number;
  /** Whether this character is selected for restore */
  isSelected: boolean;
  /** Whether selection mode is active */
  isSelectionMode: boolean;
  /** Callback when the character is clicked */
  onClick: (index: number, shiftKey: boolean, ctrlKey: boolean) => void;
  /** Callback when long press is detected */
  onLongPress?: (index: number) => void;
  /** Scale factor for display */
  scale?: number;
  /** Foreground color */
  foregroundColor: string;
  /** Background color */
  backgroundColor: string;
}

/**
 * Grid item for character diff display with selection support
 */
export function CharacterDiffGridItem({
  character,
  comparisonCharacter,
  index,
  isSelected,
  isSelectionMode,
  onClick,
  onLongPress,
  scale = 3,
  foregroundColor,
  backgroundColor,
}: CharacterDiffGridItemProps) {
  // Check if character has changes
  const hasChanges = useMemo(() => {
    if (!comparisonCharacter) return false;
    return !areCharactersEqual(character, comparisonCharacter);
  }, [character, comparisonCharacter]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      onClick(index, e.shiftKey, e.metaKey || e.ctrlKey);
    },
    [index, onClick]
  );

  const handleLongPress = useCallback(() => {
    onLongPress?.(index);
  }, [index, onLongPress]);

  const longPressHandlers = useLongPress({
    onLongPress: handleLongPress,
    disabled: !onLongPress,
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(index, e.shiftKey, e.metaKey || e.ctrlKey);
      }
    },
    [index, onClick]
  );

  // Selection styling
  const selectionClass = useMemo(() => {
    if (isSelected) {
      return "ring-2 ring-retro-cyan ring-offset-1 ring-offset-retro-dark";
    }
    return "";
  }, [isSelected]);

  return (
    <div
      onClick={handleClick}
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
      data-has-changes={hasChanges}
      className={`
        focus:outline-none focus-visible:ring-1 focus-visible:ring-retro-cyan
        rounded relative touch-manipulation cursor-pointer
        hover:opacity-80 transition-opacity
        ${selectionClass}
      `}
      style={{ touchAction: "manipulation" }}
    >
      <CharacterDiffDisplay
        character={character}
        comparisonCharacter={comparisonCharacter}
        scale={scale}
        foregroundColor={foregroundColor}
        backgroundColor={backgroundColor}
        showDiffBorder={hasChanges}
        index={index}
      />

      {/* Checkmark overlay for selected items in selection mode */}
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

      {/* Changed indicator badge */}
      {hasChanges && (
        <div
          className="absolute -bottom-0.5 -left-0.5 w-2 h-2 bg-amber-500 rounded-full"
          title="Character has changes"
        />
      )}
    </div>
  );
}
