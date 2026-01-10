/**
 * Mock implementation of fontImport for Jest testing
 *
 * This mock avoids the import.meta.url issue that occurs in the real module
 * when creating Web Workers. It exports all the utility functions that can
 * be tested without browser dependencies.
 */

import { Character } from "../../types";

// ============================================================================
// Type Definitions
// ============================================================================

export interface FontImportOptions {
  charWidth: number;
  charHeight: number;
  startCode: number;
  endCode: number;
  fontSize: number;
  threshold: number;
  centerGlyphs: boolean;
  baselineOffset: number;
}

export interface FontParseResult {
  characters: Character[];
  fontFamily: string;
  importedCount: number;
  missingCount: number;
}

// ============================================================================
// Utility Functions (Same as real implementation)
// ============================================================================

export function getDefaultFontImportOptions(): FontImportOptions {
  return {
    charWidth: 8,
    charHeight: 8,
    startCode: 32,
    endCode: 126,
    fontSize: 8,
    threshold: 128,
    centerGlyphs: true,
    baselineOffset: 0,
  };
}

export const CHARACTER_RANGES = [
  { name: "Printable ASCII", startCode: 32, endCode: 126, count: 95 },
  { name: "Extended ASCII", startCode: 32, endCode: 255, count: 224 },
  { name: "Uppercase Only", startCode: 65, endCode: 90, count: 26 },
  { name: "Lowercase Only", startCode: 97, endCode: 122, count: 26 },
  { name: "Digits Only", startCode: 48, endCode: 57, count: 10 },
  { name: "Full 256 (with blanks)", startCode: 0, endCode: 255, count: 256 },
];

export function isValidFontFile(file: File): boolean {
  const validTypes = [
    "font/ttf",
    "font/otf",
    "font/woff",
    "font/woff2",
    "application/x-font-ttf",
    "application/x-font-otf",
    "application/font-woff",
    "application/font-woff2",
  ];

  if (validTypes.includes(file.type)) return true;

  const ext = file.name.toLowerCase().split(".").pop();
  return ["ttf", "otf", "woff", "woff2"].includes(ext || "");
}

export function getSupportedFontExtensions(): string {
  return ".ttf, .otf, .woff, .woff2";
}

export function getCharacterRangePreview(
  startCode: number,
  endCode: number
): string[] {
  const preview: string[] = [];
  const maxPreview = 20;

  for (
    let code = startCode;
    code <= endCode && preview.length < maxPreview;
    code++
  ) {
    if (code >= 32 && code <= 126) {
      preview.push(String.fromCharCode(code));
    } else if (code < 32) {
      preview.push("\u00B7"); // Control character placeholder (middle dot)
    } else {
      preview.push(String.fromCharCode(code));
    }
  }

  if (endCode - startCode >= maxPreview) {
    preview.push("...");
  }

  return preview;
}

// ============================================================================
// FontParseController (Mock implementation)
// ============================================================================

export class FontParseController {
  private cancelled = false;
  private active = false;

  async parse(
    _file: File,
    _options: FontImportOptions,
    _onProgress?: (processed: number, total: number) => void
  ): Promise<FontParseResult> {
    this.active = true;
    // Mock implementation - just return empty result
    this.active = false;
    return {
      characters: [],
      fontFamily: "Mock Font",
      importedCount: 0,
      missingCount: 0,
    };
  }

  cancel(): void {
    this.cancelled = true;
    this.active = false;
  }

  isCancelled(): boolean {
    return this.cancelled;
  }

  isActive(): boolean {
    return this.active;
  }
}

// ============================================================================
// Debounce Utility (Same as real implementation)
// ============================================================================

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): { call: (...args: Parameters<T>) => void; cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const call = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { call, cancel };
}

// ============================================================================
// Other Exports (Mock implementations)
// ============================================================================

export function isOpentypeAvailable(): boolean {
  return false;
}

export async function loadFontFile(_file: File): Promise<unknown> {
  throw new Error("Mock: Font loading not available in tests");
}

export async function parseFontToCharacters(
  _file: File,
  _options: FontImportOptions
): Promise<FontParseResult> {
  return {
    characters: [],
    fontFamily: "Mock Font",
    importedCount: 0,
    missingCount: 0,
  };
}
