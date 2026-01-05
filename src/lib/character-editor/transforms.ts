/**
 * Character ROM Editor - Transform Operations
 *
 * Provides pixel manipulation operations:
 * - Rotate left/right
 * - Shift up/down/left/right with wrap
 * - Resize with anchor point
 * - Invert, flip, mirror
 */

import { Character, AnchorPoint, createEmptyCharacter } from "./types";

/**
 * Scale algorithm type for scaling operations
 */
export type ScaleAlgorithm = "nearest" | "threshold";

/**
 * Rotate character 90 degrees
 * Note: For non-square characters, maintains original dimensions by fitting rotated content
 */
export function rotateCharacter(
  character: Character,
  direction: "left" | "right"
): Character {
  const height = character.pixels.length;
  const width = character.pixels[0]?.length || 0;

  const newPixels: boolean[][] = [];

  for (let row = 0; row < height; row++) {
    const newRow: boolean[] = [];
    for (let col = 0; col < width; col++) {
      let sourceRow: number;
      let sourceCol: number;

      if (direction === "right") {
        // Clockwise rotation
        sourceRow = width - 1 - col;
        sourceCol = row;
      } else {
        // Counter-clockwise rotation
        sourceRow = col;
        sourceCol = height - 1 - row;
      }

      // Handle dimension mismatch for non-square characters
      if (
        sourceRow >= 0 &&
        sourceRow < height &&
        sourceCol >= 0 &&
        sourceCol < width
      ) {
        newRow.push(character.pixels[sourceRow]?.[sourceCol] || false);
      } else {
        newRow.push(false);
      }
    }
    newPixels.push(newRow);
  }

  return { pixels: newPixels };
}

/**
 * Shift character pixels in a direction
 */
export function shiftCharacter(
  character: Character,
  direction: "up" | "down" | "left" | "right",
  wrap: boolean = true
): Character {
  const height = character.pixels.length;
  const width = character.pixels[0]?.length || 0;
  const newPixels: boolean[][] = [];

  for (let row = 0; row < height; row++) {
    const newRow: boolean[] = [];
    for (let col = 0; col < width; col++) {
      let sourceRow = row;
      let sourceCol = col;

      switch (direction) {
        case "up":
          sourceRow = row + 1;
          if (sourceRow >= height) {
            sourceRow = wrap ? 0 : height - 1;
            if (!wrap) {
              newRow.push(false);
              continue;
            }
          }
          break;
        case "down":
          sourceRow = row - 1;
          if (sourceRow < 0) {
            sourceRow = wrap ? height - 1 : 0;
            if (!wrap) {
              newRow.push(false);
              continue;
            }
          }
          break;
        case "left":
          sourceCol = col + 1;
          if (sourceCol >= width) {
            sourceCol = wrap ? 0 : width - 1;
            if (!wrap) {
              newRow.push(false);
              continue;
            }
          }
          break;
        case "right":
          sourceCol = col - 1;
          if (sourceCol < 0) {
            sourceCol = wrap ? width - 1 : 0;
            if (!wrap) {
              newRow.push(false);
              continue;
            }
          }
          break;
      }

      newRow.push(character.pixels[sourceRow]?.[sourceCol] || false);
    }
    newPixels.push(newRow);
  }

  return { pixels: newPixels };
}

/**
 * Resize character maintaining content relative to anchor point
 * Supports all 9 anchor positions in a 3x3 grid
 */
export function resizeCharacter(
  character: Character,
  newWidth: number,
  newHeight: number,
  anchor: AnchorPoint
): Character {
  const oldHeight = character.pixels.length;
  const oldWidth = character.pixels[0]?.length || 0;

  // Calculate offsets based on anchor (3x3 grid)
  let offsetX = 0;
  let offsetY = 0;

  // Horizontal offset
  if (anchor.endsWith("l")) {
    // Left-aligned: tl, ml, bl
    offsetX = 0;
  } else if (anchor.endsWith("c")) {
    // Center-aligned: tc, mc, bc
    offsetX = Math.floor((newWidth - oldWidth) / 2);
  } else if (anchor.endsWith("r")) {
    // Right-aligned: tr, mr, br
    offsetX = newWidth - oldWidth;
  }

  // Vertical offset
  if (anchor.startsWith("t")) {
    // Top-aligned: tl, tc, tr
    offsetY = 0;
  } else if (anchor.startsWith("m")) {
    // Middle-aligned: ml, mc, mr
    offsetY = Math.floor((newHeight - oldHeight) / 2);
  } else if (anchor.startsWith("b")) {
    // Bottom-aligned: bl, bc, br
    offsetY = newHeight - oldHeight;
  }

  const newPixels: boolean[][] = [];

  for (let row = 0; row < newHeight; row++) {
    const newRow: boolean[] = [];
    for (let col = 0; col < newWidth; col++) {
      const oldRow = row - offsetY;
      const oldCol = col - offsetX;

      if (
        oldRow >= 0 &&
        oldRow < oldHeight &&
        oldCol >= 0 &&
        oldCol < oldWidth
      ) {
        newRow.push(character.pixels[oldRow][oldCol]);
      } else {
        newRow.push(false);
      }
    }
    newPixels.push(newRow);
  }

  return { pixels: newPixels };
}

/**
 * Invert all pixels in character
 */
export function invertCharacter(character: Character): Character {
  return {
    pixels: character.pixels.map((row) => row.map((pixel) => !pixel)),
  };
}

/**
 * Flip character horizontally (mirror)
 */
export function flipHorizontal(character: Character): Character {
  return {
    pixels: character.pixels.map((row) => [...row].reverse()),
  };
}

/**
 * Flip character vertically
 */
export function flipVertical(character: Character): Character {
  return {
    pixels: [...character.pixels].reverse().map((row) => [...row]),
  };
}

/**
 * Clear all pixels in character
 */
export function clearCharacter(width: number, height: number): Character {
  return createEmptyCharacter(width, height);
}

/**
 * Fill all pixels in character
 */
export function fillCharacter(width: number, height: number): Character {
  const pixels: boolean[][] = [];
  for (let row = 0; row < height; row++) {
    pixels.push(new Array(width).fill(true));
  }
  return { pixels };
}

/**
 * Toggle a single pixel
 */
export function togglePixel(
  character: Character,
  row: number,
  col: number
): Character {
  const newPixels = character.pixels.map((r, ri) =>
    ri === row ? r.map((p, ci) => (ci === col ? !p : p)) : [...r]
  );
  return { pixels: newPixels };
}

/**
 * Set a single pixel to a specific value
 */
export function setPixel(
  character: Character,
  row: number,
  col: number,
  value: boolean
): Character {
  const newPixels = character.pixels.map((r, ri) =>
    ri === row ? r.map((p, ci) => (ci === col ? value : p)) : [...r]
  );
  return { pixels: newPixels };
}

/**
 * Apply a transform to multiple characters
 */
export function batchTransform(
  characters: Character[],
  indices: Set<number>,
  transform: (char: Character) => Character
): Character[] {
  return characters.map((char, index) =>
    indices.has(index) ? transform(char) : char
  );
}

/**
 * Check if a pixel position differs across multiple characters
 * Returns: 'same-on' | 'same-off' | 'mixed'
 */
export function getPixelState(
  characters: Character[],
  indices: Set<number>,
  row: number,
  col: number
): "same-on" | "same-off" | "mixed" {
  const selected = Array.from(indices).map((i) => characters[i]);
  if (selected.length === 0) return "same-off";

  const firstValue = selected[0]?.pixels[row]?.[col] || false;

  for (let i = 1; i < selected.length; i++) {
    const value = selected[i]?.pixels[row]?.[col] || false;
    if (value !== firstValue) {
      return "mixed";
    }
  }

  return firstValue ? "same-on" : "same-off";
}

/**
 * Toggle a pixel across multiple characters
 */
export function batchTogglePixel(
  characters: Character[],
  indices: Set<number>,
  row: number,
  col: number
): Character[] {
  const state = getPixelState(characters, indices, row, col);
  const newValue = state !== "same-on"; // If mixed or off, turn on; if on, turn off

  return characters.map((char, index) => {
    if (!indices.has(index)) return char;
    return setPixel(char, row, col, newValue);
  });
}

/**
 * Bounding box result type
 */
export interface BoundingBox {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
}

/**
 * Get the bounding box of foreground pixels in a character
 * Returns null if the character is empty (no foreground pixels)
 */
export function getBoundingBox(character: Character): BoundingBox | null {
  const height = character.pixels.length;
  const width = character.pixels[0]?.length || 0;

  let minRow = height;
  let maxRow = -1;
  let minCol = width;
  let maxCol = -1;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (character.pixels[row][col]) {
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
      }
    }
  }

  // No foreground pixels found
  if (maxRow === -1) {
    return null;
  }

  return { minRow, maxRow, minCol, maxCol };
}

/**
 * Center character content within its dimensions
 * Calculates bounding box of foreground pixels and shifts to center
 */
export function centerCharacter(character: Character): Character {
  const height = character.pixels.length;
  const width = character.pixels[0]?.length || 0;

  const bbox = getBoundingBox(character);

  // Empty character, return unchanged
  if (!bbox) {
    return character;
  }

  // Calculate content dimensions
  const contentWidth = bbox.maxCol - bbox.minCol + 1;
  const contentHeight = bbox.maxRow - bbox.minRow + 1;

  // Calculate target position (centered)
  const targetCol = Math.floor((width - contentWidth) / 2);
  const targetRow = Math.floor((height - contentHeight) / 2);

  // Calculate shift offset
  const shiftX = targetCol - bbox.minCol;
  const shiftY = targetRow - bbox.minRow;

  // No shift needed if already centered
  if (shiftX === 0 && shiftY === 0) {
    return character;
  }

  // Create new pixel array with shifted content
  const newPixels: boolean[][] = [];

  for (let row = 0; row < height; row++) {
    const newRow: boolean[] = [];
    for (let col = 0; col < width; col++) {
      // Find source pixel (reverse the shift)
      const srcRow = row - shiftY;
      const srcCol = col - shiftX;

      if (
        srcRow >= 0 &&
        srcRow < height &&
        srcCol >= 0 &&
        srcCol < width
      ) {
        newRow.push(character.pixels[srcRow][srcCol]);
      } else {
        newRow.push(false);
      }
    }
    newPixels.push(newRow);
  }

  return { pixels: newPixels };
}

/**
 * Scale character using nearest neighbor algorithm
 * Maps each output pixel to the nearest source pixel
 */
function scaleNearestNeighbor(
  character: Character,
  scale: number,
  anchor: AnchorPoint
): Character {
  const oldHeight = character.pixels.length;
  const oldWidth = character.pixels[0]?.length || 0;

  // Calculate scaled dimensions
  const scaledWidth = Math.round(oldWidth * scale);
  const scaledHeight = Math.round(oldHeight * scale);

  // Create scaled content
  const scaledPixels: boolean[][] = [];

  for (let outRow = 0; outRow < scaledHeight; outRow++) {
    const row: boolean[] = [];
    for (let outCol = 0; outCol < scaledWidth; outCol++) {
      // Find source pixel using inverse mapping
      const srcRow = Math.min(Math.floor(outRow / scale), oldHeight - 1);
      const srcCol = Math.min(Math.floor(outCol / scale), oldWidth - 1);

      row.push(character.pixels[srcRow]?.[srcCol] || false);
    }
    scaledPixels.push(row);
  }

  // Calculate anchor offset to position within original bounds
  const deltaWidth = oldWidth - scaledWidth;
  const deltaHeight = oldHeight - scaledHeight;

  let offsetX = 0;
  let offsetY = 0;

  // Horizontal offset based on anchor
  if (anchor.endsWith("l")) {
    offsetX = 0;
  } else if (anchor.endsWith("c")) {
    offsetX = Math.floor(deltaWidth / 2);
  } else if (anchor.endsWith("r")) {
    offsetX = deltaWidth;
  }

  // Vertical offset based on anchor
  if (anchor.startsWith("t")) {
    offsetY = 0;
  } else if (anchor.startsWith("m")) {
    offsetY = Math.floor(deltaHeight / 2);
  } else if (anchor.startsWith("b")) {
    offsetY = deltaHeight;
  }

  // Create output at original dimensions with anchor positioning
  const newPixels: boolean[][] = [];

  for (let row = 0; row < oldHeight; row++) {
    const newRow: boolean[] = [];
    for (let col = 0; col < oldWidth; col++) {
      const srcRow = row - offsetY;
      const srcCol = col - offsetX;

      if (
        srcRow >= 0 &&
        srcRow < scaledHeight &&
        srcCol >= 0 &&
        srcCol < scaledWidth
      ) {
        newRow.push(scaledPixels[srcRow][srcCol]);
      } else {
        newRow.push(false);
      }
    }
    newPixels.push(newRow);
  }

  return { pixels: newPixels };
}

/**
 * Calculate coverage of foreground pixels in a source rectangle
 */
function calculateCoverage(
  pixels: boolean[][],
  rowStart: number,
  rowEnd: number,
  colStart: number,
  colEnd: number
): number {
  const height = pixels.length;
  const width = pixels[0]?.length || 0;

  let totalArea = 0;
  let foregroundArea = 0;

  // Iterate over all pixels that overlap with the source rectangle
  const startRow = Math.max(0, Math.floor(rowStart));
  const endRow = Math.min(height - 1, Math.floor(rowEnd));
  const startCol = Math.max(0, Math.floor(colStart));
  const endCol = Math.min(width - 1, Math.floor(colEnd));

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      // Calculate overlap area for this pixel
      const pixelRowStart = Math.max(row, rowStart);
      const pixelRowEnd = Math.min(row + 1, rowEnd);
      const pixelColStart = Math.max(col, colStart);
      const pixelColEnd = Math.min(col + 1, colEnd);

      const overlapArea =
        (pixelRowEnd - pixelRowStart) * (pixelColEnd - pixelColStart);
      totalArea += overlapArea;

      if (pixels[row][col]) {
        foregroundArea += overlapArea;
      }
    }
  }

  if (totalArea === 0) {
    return 0;
  }

  return foregroundArea / totalArea;
}

/**
 * Scale character using threshold-based area sampling algorithm
 * Calculates coverage percentage and turns on if >= threshold
 */
function scaleThreshold(
  character: Character,
  scale: number,
  anchor: AnchorPoint,
  threshold: number = 0.5
): Character {
  const oldHeight = character.pixels.length;
  const oldWidth = character.pixels[0]?.length || 0;

  // Calculate scaled dimensions
  const scaledWidth = Math.round(oldWidth * scale);
  const scaledHeight = Math.round(oldHeight * scale);

  // Create scaled content using area sampling
  const scaledPixels: boolean[][] = [];

  for (let outRow = 0; outRow < scaledHeight; outRow++) {
    const row: boolean[] = [];
    for (let outCol = 0; outCol < scaledWidth; outCol++) {
      // Calculate the source rectangle this output pixel covers
      const srcRowStart = outRow / scale;
      const srcRowEnd = (outRow + 1) / scale;
      const srcColStart = outCol / scale;
      const srcColEnd = (outCol + 1) / scale;

      // Calculate coverage of foreground pixels
      const coverage = calculateCoverage(
        character.pixels,
        srcRowStart,
        srcRowEnd,
        srcColStart,
        srcColEnd
      );

      // Apply threshold
      row.push(coverage >= threshold);
    }
    scaledPixels.push(row);
  }

  // Calculate anchor offset to position within original bounds
  const deltaWidth = oldWidth - scaledWidth;
  const deltaHeight = oldHeight - scaledHeight;

  let offsetX = 0;
  let offsetY = 0;

  // Horizontal offset based on anchor
  if (anchor.endsWith("l")) {
    offsetX = 0;
  } else if (anchor.endsWith("c")) {
    offsetX = Math.floor(deltaWidth / 2);
  } else if (anchor.endsWith("r")) {
    offsetX = deltaWidth;
  }

  // Vertical offset based on anchor
  if (anchor.startsWith("t")) {
    offsetY = 0;
  } else if (anchor.startsWith("m")) {
    offsetY = Math.floor(deltaHeight / 2);
  } else if (anchor.startsWith("b")) {
    offsetY = deltaHeight;
  }

  // Create output at original dimensions with anchor positioning
  const newPixels: boolean[][] = [];

  for (let row = 0; row < oldHeight; row++) {
    const newRow: boolean[] = [];
    for (let col = 0; col < oldWidth; col++) {
      const srcRow = row - offsetY;
      const srcCol = col - offsetX;

      if (
        srcRow >= 0 &&
        srcRow < scaledHeight &&
        srcCol >= 0 &&
        srcCol < scaledWidth
      ) {
        newRow.push(scaledPixels[srcRow][srcCol]);
      } else {
        newRow.push(false);
      }
    }
    newPixels.push(newRow);
  }

  return { pixels: newPixels };
}

/**
 * Scale character with configurable algorithm and anchor positioning
 * Clips content to fit within original character dimensions
 */
export function scaleCharacter(
  character: Character,
  scale: number,
  anchor: AnchorPoint,
  algorithm: ScaleAlgorithm
): Character {
  if (scale === 1) {
    return character;
  }

  if (algorithm === "nearest") {
    return scaleNearestNeighbor(character, scale, anchor);
  } else {
    return scaleThreshold(character, scale, anchor);
  }
}
