/**
 * Font Import Utilities
 *
 * Functions for importing character sets from TTF/OTF/WOFF font files
 * using opentype.js for font parsing
 *
 * Supports:
 * - Web Worker rendering for non-blocking UI
 * - Chunked main-thread fallback with requestIdleCallback
 * - Cancellation of in-flight operations
 *
 * Note: Requires opentype.js to be installed: npm install opentype.js
 */

import { Character } from "./types";
import type { WorkerRequest, WorkerResponse } from "./fontImportWorker";

// Type definitions for opentype.js (optional dependency)
interface OpenTypeFont {
  names: {
    fontFamily?: { en?: string };
    fullName?: { en?: string };
  };
  unitsPerEm: number;
  ascender: number;
  descender: number;
  charToGlyph(char: string): OpenTypeGlyph;
}

interface OpenTypeGlyph {
  index: number;
  advanceWidth: number;
  getPath(x: number, y: number, fontSize: number): OpenTypePath;
}

interface OpenTypePath {
  fill: string;
  draw(ctx: CanvasRenderingContext2D): void;
}

/**
 * Options for importing from a font file
 */
export interface FontImportOptions {
  /** Character width in pixels */
  charWidth: number;
  /** Character height in pixels */
  charHeight: number;
  /** Start character code (e.g., 32 for ASCII space) */
  startCode: number;
  /** End character code (e.g., 126 for ASCII tilde) */
  endCode: number;
  /** Font size in points for rendering */
  fontSize: number;
  /** Threshold for black/white conversion (0-255) */
  threshold: number;
  /** Whether to center glyphs in their cells */
  centerGlyphs: boolean;
  /** Baseline offset (0 = auto, positive = move up) */
  baselineOffset: number;
}

/**
 * Default font import options
 */
export function getDefaultFontImportOptions(): FontImportOptions {
  return {
    charWidth: 8,
    charHeight: 8,
    startCode: 32, // ASCII space
    endCode: 126, // ASCII tilde (printable ASCII range)
    fontSize: 8,
    threshold: 128,
    centerGlyphs: true,
    baselineOffset: 0,
  };
}

/**
 * Common character ranges for import
 */
export const CHARACTER_RANGES = [
  { name: "Printable ASCII", startCode: 32, endCode: 126, count: 95 },
  { name: "Extended ASCII", startCode: 32, endCode: 255, count: 224 },
  { name: "Uppercase Only", startCode: 65, endCode: 90, count: 26 },
  { name: "Lowercase Only", startCode: 97, endCode: 122, count: 26 },
  { name: "Digits Only", startCode: 48, endCode: 57, count: 10 },
  { name: "Full 256 (with blanks)", startCode: 0, endCode: 255, count: 256 },
];

/**
 * Result of parsing a font
 */
export interface FontParseResult {
  /** Parsed characters */
  characters: Character[];
  /** Font family name */
  fontFamily: string;
  /** Number of successfully imported glyphs */
  importedCount: number;
  /** Number of missing glyphs (replaced with blank) */
  missingCount: number;
}

/**
 * Check if opentype.js is available
 */
export function isOpentypeAvailable(): boolean {
  try {
    // Check if opentype is available (would be imported dynamically)
    return typeof window !== "undefined" && "opentype" in window;
  } catch {
    return false;
  }
}

/**
 * Load a font file and return the opentype font object
 */
export async function loadFontFile(file: File): Promise<OpenTypeFont> {
  // Dynamic import of opentype.js with error handling
  let opentype: { parse: (buffer: ArrayBuffer) => OpenTypeFont };
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    opentype = await import("opentype.js" as any);
  } catch {
    throw new Error(
      "Font import requires the opentype.js library. Please install it with: npm install opentype.js"
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const font = opentype.parse(arrayBuffer);
        resolve(font);
      } catch (error) {
        reject(new Error(`Failed to parse font: ${error}`));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read font file"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Render a single glyph to a character
 */
function renderGlyphToCharacter(
  font: OpenTypeFont,
  charCode: number,
  options: FontImportOptions
): Character {
  const { charWidth, charHeight, fontSize, threshold, centerGlyphs, baselineOffset } = options;

  // Create a canvas for rendering
  const canvas = document.createElement("canvas");
  canvas.width = charWidth;
  canvas.height = charHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    // Return empty character if canvas fails
    return createEmptyCharacter(charWidth, charHeight);
  }

  // Clear canvas with white
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, charWidth, charHeight);

  // Get the glyph
  const glyph = font.charToGlyph(String.fromCharCode(charCode));

  if (!glyph || glyph.index === 0) {
    // Glyph not found, return empty character
    return createEmptyCharacter(charWidth, charHeight);
  }

  // Calculate metrics
  const scale = fontSize / font.unitsPerEm;
  const glyphWidth = glyph.advanceWidth * scale;
  const glyphHeight = (font.ascender - font.descender) * scale;

  // Calculate position
  let x = 0;
  let y = charHeight - (font.descender * scale * -1) + baselineOffset;

  if (centerGlyphs) {
    // Center horizontally
    x = (charWidth - glyphWidth) / 2;
    // Adjust vertical centering
    const verticalOffset = (charHeight - glyphHeight) / 2;
    y = charHeight - (font.descender * scale * -1) - verticalOffset + baselineOffset;
  }

  // Draw the glyph
  ctx.fillStyle = "black";
  const path = glyph.getPath(x, y, fontSize);
  path.fill = "black";
  path.draw(ctx);

  // Convert to pixel data
  const imageData = ctx.getImageData(0, 0, charWidth, charHeight);
  const pixels: boolean[][] = [];

  for (let py = 0; py < charHeight; py++) {
    const row: boolean[] = [];
    for (let px = 0; px < charWidth; px++) {
      const index = (py * charWidth + px) * 4;
      const r = imageData.data[index];
      const g = imageData.data[index + 1];
      const b = imageData.data[index + 2];
      // Use perceived brightness
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      row.push(brightness < threshold);
    }
    pixels.push(row);
  }

  return { pixels };
}

/**
 * Create an empty character with all pixels off
 */
function createEmptyCharacter(width: number, height: number): Character {
  const pixels: boolean[][] = [];
  for (let y = 0; y < height; y++) {
    pixels.push(new Array(width).fill(false));
  }
  return { pixels };
}

/**
 * Parse a font file into characters
 */
export async function parseFontToCharacters(
  file: File,
  options: FontImportOptions
): Promise<FontParseResult> {
  const font = await loadFontFile(file);

  const fontFamily = font.names?.fontFamily?.en || font.names?.fullName?.en || "Unknown Font";

  const characters: Character[] = [];
  let importedCount = 0;
  let missingCount = 0;

  for (let code = options.startCode; code <= options.endCode; code++) {
    const char = renderGlyphToCharacter(font, code, options);
    characters.push(char);

    // Check if glyph was found (has any pixels set)
    const hasPixels = char.pixels.some((row) => row.some((p) => p));
    if (hasPixels) {
      importedCount++;
    } else if (code >= 33) {
      // Only count as missing if it's a printable character (not space/control)
      missingCount++;
    }
  }

  return {
    characters,
    fontFamily,
    importedCount,
    missingCount,
  };
}

/**
 * Check if a file is a valid font file
 */
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

  // Check MIME type
  if (validTypes.includes(file.type)) return true;

  // Check extension as fallback
  const ext = file.name.toLowerCase().split(".").pop();
  return ["ttf", "otf", "woff", "woff2"].includes(ext || "");
}

/**
 * Get supported font file extensions
 */
export function getSupportedFontExtensions(): string {
  return ".ttf, .otf, .woff, .woff2";
}

/**
 * Get a preview of what characters will be imported
 */
export function getCharacterRangePreview(
  startCode: number,
  endCode: number
): string[] {
  const preview: string[] = [];
  const maxPreview = 20;

  for (let code = startCode; code <= endCode && preview.length < maxPreview; code++) {
    if (code >= 32 && code <= 126) {
      preview.push(String.fromCharCode(code));
    } else if (code < 32) {
      preview.push("·"); // Control character placeholder
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
// Web Worker-based Font Parsing
// ============================================================================

/**
 * Singleton worker manager for font parsing
 */
class FontWorkerManager {
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (result: FontParseResult) => void;
      reject: (error: Error) => void;
      onProgress?: (processed: number, total: number) => void;
    }
  >();
  private workerSupported: boolean | null = null;

  /**
   * Check if Web Workers with OffscreenCanvas are supported
   */
  isSupported(): boolean {
    if (this.workerSupported !== null) {
      return this.workerSupported;
    }

    try {
      // Check for Worker and OffscreenCanvas support
      this.workerSupported =
        typeof Worker !== "undefined" &&
        typeof OffscreenCanvas !== "undefined" &&
        typeof window !== "undefined";
    } catch {
      this.workerSupported = false;
    }

    return this.workerSupported;
  }

  /**
   * Get or create the worker instance
   */
  private getWorker(): Worker {
    if (!this.worker) {
      // Create worker from the worker file
      this.worker = new Worker(
        new URL("./fontImportWorker.ts", import.meta.url),
        { type: "module" }
      );

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const message = event.data;
        const pending = this.pendingRequests.get(message.id);

        if (!pending) return;

        switch (message.type) {
          case "progress":
            pending.onProgress?.(message.processed, message.total);
            break;

          case "result":
            this.pendingRequests.delete(message.id);
            pending.resolve({
              characters: message.characters,
              fontFamily: message.fontFamily,
              importedCount: message.importedCount,
              missingCount: message.missingCount,
            });
            break;

          case "error":
            this.pendingRequests.delete(message.id);
            pending.reject(new Error(message.error));
            break;

          case "cancelled":
            this.pendingRequests.delete(message.id);
            pending.reject(new Error("Cancelled"));
            break;
        }
      };

      this.worker.onerror = (error) => {
        // Reject all pending requests
        for (const [id, pending] of this.pendingRequests) {
          pending.reject(new Error(`Worker error: ${error.message}`));
          this.pendingRequests.delete(id);
        }
        // Reset worker to force recreation on next use
        this.worker = null;
        this.workerSupported = false;
      };
    }

    return this.worker;
  }

  /**
   * Parse font using the worker
   */
  parse(
    fontData: ArrayBuffer,
    options: FontImportOptions,
    onProgress?: (processed: number, total: number) => void
  ): { promise: Promise<FontParseResult>; cancel: () => void } {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const promise = new Promise<FontParseResult>((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject, onProgress });

      const worker = this.getWorker();
      const request: WorkerRequest = {
        type: "parse",
        id,
        fontData,
        options: {
          charWidth: options.charWidth,
          charHeight: options.charHeight,
          startCode: options.startCode,
          endCode: options.endCode,
          fontSize: options.fontSize,
          threshold: options.threshold,
          centerGlyphs: options.centerGlyphs,
          baselineOffset: options.baselineOffset,
        },
      };

      worker.postMessage(request, [fontData]);
    });

    const cancel = () => {
      const pending = this.pendingRequests.get(id);
      if (pending) {
        this.pendingRequests.delete(id);
        this.worker?.postMessage({ type: "cancel", id });
        pending.reject(new Error("Cancelled"));
      }
    };

    return { promise, cancel };
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

// Singleton instance
const workerManager = new FontWorkerManager();

// ============================================================================
// Chunked Main-Thread Fallback
// ============================================================================

/**
 * Parse font with chunked rendering on main thread
 * Uses requestIdleCallback for non-blocking execution
 */
async function parseFontChunked(
  file: File,
  options: FontImportOptions,
  signal: AbortSignal,
  onProgress?: (processed: number, total: number) => void
): Promise<FontParseResult> {
  const font = await loadFontFile(file);

  if (signal.aborted) {
    throw new Error("Cancelled");
  }

  const fontFamily =
    font.names?.fontFamily?.en || font.names?.fullName?.en || "Unknown Font";

  const characters: Character[] = [];
  let importedCount = 0;
  let missingCount = 0;

  const totalChars = options.endCode - options.startCode + 1;
  const CHUNK_SIZE = 8; // Process 8 characters per idle callback

  // Use requestIdleCallback if available, otherwise use setTimeout
  const scheduleChunk = (callback: () => void): number => {
    if (typeof requestIdleCallback !== "undefined") {
      return requestIdleCallback(callback, { timeout: 50 });
    }
    return window.setTimeout(callback, 0);
  };

  const cancelChunk = (id: number): void => {
    if (typeof cancelIdleCallback !== "undefined") {
      cancelIdleCallback(id);
    } else {
      clearTimeout(id);
    }
  };

  return new Promise((resolve, reject) => {
    let currentCode = options.startCode;
    let callbackId: number;

    const processChunk = () => {
      if (signal.aborted) {
        reject(new Error("Cancelled"));
        return;
      }

      const chunkEnd = Math.min(currentCode + CHUNK_SIZE, options.endCode + 1);

      for (let code = currentCode; code < chunkEnd; code++) {
        const char = renderGlyphToCharacter(font, code, options);
        characters.push(char);

        const hasPixels = char.pixels.some((row) => row.some((p) => p));
        if (hasPixels) {
          importedCount++;
        } else if (code >= 33) {
          missingCount++;
        }
      }

      currentCode = chunkEnd;
      const processed = currentCode - options.startCode;
      onProgress?.(processed, totalChars);

      if (currentCode <= options.endCode) {
        callbackId = scheduleChunk(processChunk);
      } else {
        resolve({
          characters,
          fontFamily,
          importedCount,
          missingCount,
        });
      }
    };

    // Start processing
    callbackId = scheduleChunk(processChunk);

    // Handle abort
    signal.addEventListener("abort", () => {
      cancelChunk(callbackId);
      reject(new Error("Cancelled"));
    });
  });
}

// ============================================================================
// Font Parse Controller (Main API)
// ============================================================================

/**
 * Controller for managing font parsing with cancellation support
 */
export class FontParseController {
  private abortController: AbortController | null = null;
  private workerCancel: (() => void) | null = null;
  private cancelled = false;
  private fileReader: FileReader | null = null;

  /**
   * Parse a font file with cancellation support
   * Automatically uses Web Worker if available, falls back to chunked main-thread
   */
  async parse(
    file: File,
    options: FontImportOptions,
    onProgress?: (processed: number, total: number) => void
  ): Promise<FontParseResult> {
    // Reset cancelled state for new parse
    this.cancelled = false;

    // Try worker-based parsing first
    if (workerManager.isSupported()) {
      try {
        const arrayBuffer = await this.readFileAsArrayBuffer(file);

        // Check if cancelled during file read
        if (this.cancelled) {
          throw new Error("Cancelled");
        }

        const { promise, cancel } = workerManager.parse(
          arrayBuffer,
          options,
          onProgress
        );
        this.workerCancel = cancel;

        const result = await promise;
        this.workerCancel = null;
        return result;
      } catch (error) {
        // If worker fails (not cancelled), fall back to main thread
        if (error instanceof Error && error.message !== "Cancelled") {
          console.warn("Worker parsing failed, falling back to main thread:", error);
        } else {
          throw error;
        }
      }
    }

    // Check if cancelled before starting fallback
    if (this.cancelled) {
      throw new Error("Cancelled");
    }

    // Fall back to chunked main-thread parsing
    this.abortController = new AbortController();
    const result = await parseFontChunked(
      file,
      options,
      this.abortController.signal,
      onProgress
    );
    this.abortController = null;
    return result;
  }

  /**
   * Cancel any in-progress parsing operation
   */
  cancel(): void {
    this.cancelled = true;

    // Cancel file reading if in progress
    if (this.fileReader) {
      this.fileReader.abort();
      this.fileReader = null;
    }

    if (this.workerCancel) {
      this.workerCancel();
      this.workerCancel = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Check if this controller has been cancelled
   */
  isCancelled(): boolean {
    return this.cancelled;
  }

  /**
   * Check if an operation is currently in progress
   */
  isActive(): boolean {
    return (
      this.fileReader !== null ||
      this.workerCancel !== null ||
      this.abortController !== null
    );
  }

  /**
   * Read file as ArrayBuffer with cancellation support
   */
  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      // Check if already cancelled
      if (this.cancelled) {
        reject(new Error("Cancelled"));
        return;
      }

      const reader = new FileReader();
      this.fileReader = reader;

      reader.onload = (e) => {
        this.fileReader = null;
        if (this.cancelled) {
          reject(new Error("Cancelled"));
        } else {
          resolve(e.target?.result as ArrayBuffer);
        }
      };

      reader.onerror = () => {
        this.fileReader = null;
        reject(new Error("Failed to read file"));
      };

      reader.onabort = () => {
        this.fileReader = null;
        reject(new Error("Cancelled"));
      };

      reader.readAsArrayBuffer(file);
    });
  }
}

/**
 * Create a debounced version of a function
 */
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
