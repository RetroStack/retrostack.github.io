/**
 * Character ROM Editor - Utility Functions
 *
 * General-purpose utility functions for the character editor:
 * - File size and dimension formatting for display
 * - Configuration validation
 * - Filename generation for exports
 * - File type validation for imports
 * - Common helpers (debounce, throttle, clamp)
 *
 * @module lib/character-editor/utils
 *
 * These are pure functions with no side effects, making them
 * easy to test and reuse across components and hooks.
 */

import { Character, CharacterSetConfig } from "./types";

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Format character set size for display (e.g., "8x8")
 */
export function formatSize(config: CharacterSetConfig): string {
  return `${config.width}x${config.height}`;
}

/**
 * Parse a size string (e.g., "8x8") to width and height
 */
export function parseSize(sizeStr: string): { width: number; height: number } | null {
  const match = sizeStr.match(/^(\d+)x(\d+)$/);
  if (!match) return null;
  return {
    width: parseInt(match[1], 10),
    height: parseInt(match[2], 10),
  };
}

/**
 * Validate character set configuration
 */
export function validateConfig(config: CharacterSetConfig): string[] {
  const errors: string[] = [];

  if (config.width < 1 || config.width > 16) {
    errors.push("Width must be between 1 and 16 pixels");
  }

  if (config.height < 1 || config.height > 16) {
    errors.push("Height must be between 1 and 16 pixels");
  }

  if (config.padding !== "left" && config.padding !== "right") {
    errors.push("Padding must be 'left' or 'right'");
  }

  if (config.bitDirection !== "ltr" && config.bitDirection !== "rtl") {
    errors.push("Bit direction must be 'ltr' or 'rtl'");
  }

  return errors;
}

/**
 * Get suggested filename for export
 */
export function getSuggestedFilename(name: string): string {
  // Remove special characters and spaces
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${cleaned || "charset"}.bin`;
}

/**
 * Validate file type for import
 */
export function isValidBinaryFile(file: File): boolean {
  // Accept common ROM extensions and generic binary
  const validExtensions = [".bin", ".rom", ".chr", ".fnt", ".dat"];
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));

  // Also accept files without extension or with unknown extension
  // as binary files don't have a standard extension
  return validExtensions.includes(ext) || !ext || ext === file.name.toLowerCase();
}

/**
 * Calculate character count from file size and config
 */
export function calculateCharacterCount(
  fileSize: number,
  config: CharacterSetConfig
): number {
  const bytesPerLine = Math.ceil(config.width / 8);
  const bytesPerChar = bytesPerLine * config.height;
  return Math.floor(fileSize / bytesPerChar);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Compare two characters pixel-by-pixel
 *
 * @param a - First character
 * @param b - Second character
 * @returns true if characters are identical (same dimensions and pixel values)
 */
export function areCharactersEqual(a: Character, b: Character): boolean {
  // Check dimensions first
  if (a.pixels.length !== b.pixels.length) return false;
  if (a.pixels.length === 0) return true;
  if (a.pixels[0].length !== b.pixels[0].length) return false;

  // Compare each pixel
  for (let row = 0; row < a.pixels.length; row++) {
    for (let col = 0; col < a.pixels[0].length; col++) {
      if (a.pixels[row][col] !== b.pixels[row][col]) return false;
    }
  }
  return true;
}

/**
 * Find indices of characters that differ between two character arrays
 *
 * @param source - Source character array (e.g., from snapshot)
 * @param target - Target character array (e.g., current state)
 * @returns Set of indices where characters differ
 */
export function findChangedCharacterIndices(
  source: Character[],
  target: Character[]
): Set<number> {
  const changed = new Set<number>();
  const maxLength = Math.max(source.length, target.length);

  for (let i = 0; i < maxLength; i++) {
    // If index doesn't exist in one array, it's changed
    if (i >= source.length || i >= target.length) {
      changed.add(i);
    } else if (!areCharactersEqual(source[i], target[i])) {
      changed.add(i);
    }
  }
  return changed;
}

/**
 * Find pixels that differ between two characters
 *
 * @param charA - First character (e.g., from snapshot)
 * @param charB - Second character (e.g., current state)
 * @returns Set of "row,col" strings for pixels that differ
 */
export function findDifferingPixels(
  charA: Character,
  charB: Character
): Set<string> {
  const diffPixels = new Set<string>();

  // Get max dimensions (handle different sized characters)
  const maxRows = Math.max(charA.pixels.length, charB.pixels.length);
  const maxCols = Math.max(
    charA.pixels[0]?.length || 0,
    charB.pixels[0]?.length || 0
  );

  for (let row = 0; row < maxRows; row++) {
    for (let col = 0; col < maxCols; col++) {
      const pixelA = charA.pixels[row]?.[col] ?? false;
      const pixelB = charB.pixels[row]?.[col] ?? false;

      if (pixelA !== pixelB) {
        diffPixels.add(`${row},${col}`);
      }
    }
  }

  return diffPixels;
}
