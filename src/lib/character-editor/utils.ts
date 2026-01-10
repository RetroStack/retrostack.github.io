/**
 * Character ROM Editor - Utility Functions
 *
 * General-purpose utility functions for the character editor:
 * - File size and dimension formatting for display
 * - Configuration validation
 * - Filename generation for exports
 * - File type validation for imports
 * - Common helpers (debounce, throttle, clamp)
 * - Character comparison utilities
 *
 * @module lib/character-editor/utils
 *
 * These are pure functions with no side effects, making them
 * easy to test and reuse across components and hooks.
 */

import { CharacterSetConfig } from "./types";

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
 * Get anchor point label for display
 */
export function getAnchorLabel(anchor: string): string {
  const labels: Record<string, string> = {
    tl: "Top Left",
    tr: "Top Right",
    bl: "Bottom Left",
    br: "Bottom Right",
  };
  return labels[anchor] || anchor;
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
 * Check if two characters are equal
 */
export function charactersEqual(
  a: { pixels: boolean[][] },
  b: { pixels: boolean[][] }
): boolean {
  if (a.pixels.length !== b.pixels.length) return false;
  for (let row = 0; row < a.pixels.length; row++) {
    if (a.pixels[row].length !== b.pixels[row].length) return false;
    for (let col = 0; col < a.pixels[row].length; col++) {
      if (a.pixels[row][col] !== b.pixels[row][col]) return false;
    }
  }
  return true;
}
