"use client";

import { useMemo } from "react";
import { PixelGrid } from "./PixelGrid";
import { Character, CharacterSetConfig } from "@/lib/character-editor";

export interface CharacterPreviewProps {
  /** Characters to display */
  characters: Character[];
  /** Character set configuration */
  config: CharacterSetConfig;
  /** Maximum number of characters to show */
  maxCharacters?: number;
  /** Maximum width in pixels (used to calculate layout) */
  maxWidth?: number;
  /** Maximum height in pixels (used to calculate layout) */
  maxHeight?: number;
  /** Pixel scale factor (1 = 1:1, 2 = 2x, etc.) */
  scale?: number;
  /** Foreground color */
  foregroundColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Additional CSS classes */
  className?: string;
  /** Force a specific number of columns (overrides auto-calculation) */
  forceColumns?: number;
}

/**
 * Compact character set preview for library cards
 *
 * Shows a grid of characters that fits within specified dimensions.
 * Useful for thumbnails and previews.
 */
export function CharacterPreview({
  characters,
  config,
  maxCharacters = 32,
  maxWidth = 128,
  maxHeight = 64,
  scale = 1,
  foregroundColor = "#ffffff",
  backgroundColor = "#000000",
  className = "",
  forceColumns,
}: CharacterPreviewProps) {
  // Calculate how many characters we can display
  const { displayChars, columns, rows } = useMemo(() => {
    const charWidth = config.width;
    const charHeight = config.height;

    // If forceColumns is set, use that instead of calculating
    if (forceColumns) {
      const cols = forceColumns;
      const maxDisplay = Math.min(maxCharacters, characters.length);
      const rowCount = Math.ceil(maxDisplay / cols);
      const displayCount = Math.min(cols * rowCount, maxDisplay);

      return {
        displayChars: characters.slice(0, displayCount),
        columns: cols,
        rows: rowCount,
      };
    }

    // Calculate max chars per row based on width
    const maxCols = Math.floor(maxWidth / charWidth);
    // Calculate max rows based on height
    const maxRows = Math.floor(maxHeight / charHeight);

    // Calculate total displayable characters
    const maxDisplay = Math.min(maxCharacters, maxCols * maxRows, characters.length);

    // Try to make a reasonable grid
    let cols = maxCols;
    let rowCount = Math.ceil(maxDisplay / cols);

    // Adjust if too many rows
    while (rowCount > maxRows && cols > 1) {
      cols--;
      rowCount = Math.ceil(maxDisplay / cols);
    }

    const displayCount = Math.min(cols * rowCount, maxDisplay);

    return {
      displayChars: characters.slice(0, displayCount),
      columns: cols,
      rows: rowCount,
    };
  }, [characters, config, maxCharacters, maxWidth, maxHeight, forceColumns]);

  // Combine all characters into a single pixel grid
  const combinedPixels = useMemo(() => {
    const { width, height } = config;
    const totalWidth = columns * width;
    const totalHeight = rows * height;

    const pixels: boolean[][] = Array.from({ length: totalHeight }, () =>
      Array(totalWidth).fill(false)
    );

    displayChars.forEach((char, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const offsetX = col * width;
      const offsetY = row * height;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (char.pixels[y]?.[x]) {
            pixels[offsetY + y][offsetX + x] = true;
          }
        }
      }
    });

    return pixels;
  }, [displayChars, config, columns, rows]);

  const remainingCount = characters.length - displayChars.length;

  return (
    <div className={`relative inline-block ${className}`}>
      <PixelGrid
        pixels={combinedPixels}
        scale={scale}
        showGrid={false}
        foregroundColor={foregroundColor}
        backgroundColor={backgroundColor}
        interactive={false}
      />

      {/* Show remaining count badge */}
      {remainingCount > 0 && (
        <div className="absolute bottom-0 right-0 bg-retro-dark/90 text-[9px] text-gray-400 px-1 rounded-tl font-mono">
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

/**
 * Single character preview with label
 */
export function SingleCharacterPreview({
  character,
  config,
  label,
  foregroundColor = "#ffffff",
  backgroundColor = "#000000",
  className = "",
}: {
  character: Character;
  config: CharacterSetConfig;
  label?: string;
  foregroundColor?: string;
  backgroundColor?: string;
  className?: string;
}) {
  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <PixelGrid
        pixels={character.pixels}
        scale={1}
        showGrid={false}
        foregroundColor={foregroundColor}
        backgroundColor={backgroundColor}
        interactive={false}
      />
      {label && (
        <span className="text-[8px] text-gray-500 font-mono">{label}</span>
      )}
    </div>
  );
}

/**
 * ASCII preview showing printable characters
 */
export function ASCIIPreview({
  characters,
  config,
  startIndex = 32, // Start at space character
  foregroundColor = "#ffffff",
  backgroundColor = "#000000",
  className = "",
}: {
  characters: Character[];
  config: CharacterSetConfig;
  startIndex?: number;
  foregroundColor?: string;
  backgroundColor?: string;
  className?: string;
}) {
  // Show a sample of ASCII characters (A-Z, 0-9)
  const samples = useMemo(() => {
    const indices = [
      // A-Z (ASCII 65-90)
      ...Array.from({ length: 26 }, (_, i) => 65 - startIndex + i),
      // 0-9 (ASCII 48-57)
      ...Array.from({ length: 10 }, (_, i) => 48 - startIndex + i),
    ].filter((i) => i >= 0 && i < characters.length);

    return indices.map((i) => characters[i]);
  }, [characters, startIndex]);

  return (
    <CharacterPreview
      characters={samples}
      config={config}
      maxCharacters={36}
      foregroundColor={foregroundColor}
      backgroundColor={backgroundColor}
      className={className}
    />
  );
}
