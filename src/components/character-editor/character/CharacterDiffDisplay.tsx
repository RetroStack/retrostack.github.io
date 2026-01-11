/**
 * Character Diff Display Component
 *
 * Displays a character with pixel-level diff highlighting.
 * Compares a source character (e.g., from snapshot) with a comparison
 * character (e.g., current state) and highlights differing pixels in red.
 *
 * @module components/character-editor/character/CharacterDiffDisplay
 */
"use client";

import { useMemo } from "react";
import { PixelGrid } from "../editor/PixelGrid";
import { Character } from "@/lib/character-editor/types";
import { findDifferingPixels } from "@/lib/character-editor/utils";

export interface CharacterDiffDisplayProps {
  /** The character to display (e.g., from snapshot) */
  character: Character;
  /** The character to compare against (e.g., current state) */
  comparisonCharacter?: Character;
  /** Scale factor for display */
  scale?: number;
  /** Foreground color */
  foregroundColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Color for differing pixels */
  diffColor?: string;
  /** Whether to show a border when character differs */
  showDiffBorder?: boolean;
  /** Character index (for accessibility) */
  index?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Character display with pixel-level diff highlighting
 *
 * Shows the character with differing pixels highlighted in red.
 * Optionally shows an amber border if the character has any differences.
 */
export function CharacterDiffDisplay({
  character,
  comparisonCharacter,
  scale = 2,
  foregroundColor = "#ffffff",
  backgroundColor = "#000000",
  diffColor = "#ff3333",
  showDiffBorder = true,
  index,
  className = "",
}: CharacterDiffDisplayProps) {
  // Calculate differing pixels
  const diffPixels = useMemo(() => {
    if (!comparisonCharacter) {
      return new Set<string>();
    }
    return findDifferingPixels(character, comparisonCharacter);
  }, [character, comparisonCharacter]);

  const hasDifferences = diffPixels.size > 0;

  // Border styling for characters with differences
  const borderClass = useMemo(() => {
    if (showDiffBorder && hasDifferences) {
      return "ring-1 ring-amber-500/70";
    }
    return "";
  }, [showDiffBorder, hasDifferences]);

  return (
    <div
      className={`relative inline-block ${borderClass} ${className}`}
      aria-label={
        index !== undefined
          ? `Character ${index}${hasDifferences ? " (changed)" : ""}`
          : `Character${hasDifferences ? " (changed)" : ""}`
      }
    >
      <PixelGrid
        pixels={character.pixels}
        scale={scale}
        showGrid={false}
        foregroundColor={foregroundColor}
        backgroundColor={backgroundColor}
        diffPixels={diffPixels}
        diffColor={diffColor}
        interactive={false}
      />
    </div>
  );
}
