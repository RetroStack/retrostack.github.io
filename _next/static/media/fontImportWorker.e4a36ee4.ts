/**
 * Font Import Web Worker
 *
 * Handles font parsing and glyph rendering off the main thread
 * using OffscreenCanvas for rendering.
 */

// Message types for worker communication
export interface WorkerRequest {
  type: "parse";
  id: string;
  fontData: ArrayBuffer;
  options: {
    charWidth: number;
    charHeight: number;
    startCode: number;
    endCode: number;
    fontSize: number;
    threshold: number;
    centerGlyphs: boolean;
    baselineOffset: number;
  };
}

export interface WorkerProgressMessage {
  type: "progress";
  id: string;
  processed: number;
  total: number;
}

export interface WorkerResultMessage {
  type: "result";
  id: string;
  characters: { pixels: boolean[][] }[];
  fontFamily: string;
  importedCount: number;
  missingCount: number;
}

export interface WorkerErrorMessage {
  type: "error";
  id: string;
  error: string;
}

export interface WorkerCancelledMessage {
  type: "cancelled";
  id: string;
}

export type WorkerResponse =
  | WorkerProgressMessage
  | WorkerResultMessage
  | WorkerErrorMessage
  | WorkerCancelledMessage;

// Type definitions for opentype.js
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
  draw(ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D): void;
}

// Track cancelled job IDs
const cancelledJobs = new Set<string>();

/**
 * Yield to the event loop to allow cancel messages to be processed
 */
function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Worker message handler
self.onmessage = async (event: MessageEvent<WorkerRequest | { type: "cancel"; id: string }>) => {
  const message = event.data;

  if (message.type === "cancel") {
    // Mark this job as cancelled
    cancelledJobs.add(message.id);
    return;
  }

  if (message.type === "parse") {
    const { id, fontData, options } = message;

    // Check if already cancelled before starting
    if (cancelledJobs.has(id)) {
      cancelledJobs.delete(id);
      self.postMessage({ type: "cancelled", id } as WorkerCancelledMessage);
      return;
    }

    try {
      // Dynamic import of opentype.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opentype = await import("opentype.js" as any);

      // Check if cancelled after import
      if (cancelledJobs.has(id)) {
        cancelledJobs.delete(id);
        self.postMessage({ type: "cancelled", id } as WorkerCancelledMessage);
        return;
      }

      // Parse font
      const font: OpenTypeFont = opentype.parse(fontData);
      const fontFamily =
        font.names?.fontFamily?.en || font.names?.fullName?.en || "Unknown Font";

      const characters: { pixels: boolean[][] }[] = [];
      let importedCount = 0;
      let missingCount = 0;
      const totalChars = options.endCode - options.startCode + 1;

      // Process in chunks, yielding to event loop between chunks
      // This allows cancel messages to be processed
      const CHUNK_SIZE = 16;
      let processed = 0;
      let currentCode = options.startCode;

      while (currentCode <= options.endCode) {
        // Process one chunk
        const chunkEnd = Math.min(currentCode + CHUNK_SIZE, options.endCode + 1);

        for (let code = currentCode; code < chunkEnd; code++) {
          const char = renderGlyphToCharacter(font, code, options);
          characters.push(char);

          // Check if glyph was found
          const hasPixels = char.pixels.some((row) => row.some((p) => p));
          if (hasPixels) {
            importedCount++;
          } else if (code >= 33) {
            missingCount++;
          }

          processed++;
        }

        currentCode = chunkEnd;

        // Send progress update
        self.postMessage({
          type: "progress",
          id,
          processed,
          total: totalChars,
        } as WorkerProgressMessage);

        // Yield to event loop to allow cancel messages to be processed
        if (currentCode <= options.endCode) {
          await yieldToEventLoop();

          // Check if cancelled during yield
          if (cancelledJobs.has(id)) {
            cancelledJobs.delete(id);
            self.postMessage({ type: "cancelled", id } as WorkerCancelledMessage);
            return;
          }
        }
      }

      // Final check for cancellation
      if (cancelledJobs.has(id)) {
        cancelledJobs.delete(id);
        self.postMessage({ type: "cancelled", id } as WorkerCancelledMessage);
        return;
      }

      self.postMessage({
        type: "result",
        id,
        characters,
        fontFamily,
        importedCount,
        missingCount,
      } as WorkerResultMessage);
    } catch (error) {
      cancelledJobs.delete(id);
      self.postMessage({
        type: "error",
        id,
        error: error instanceof Error ? error.message : "Unknown error",
      } as WorkerErrorMessage);
    }
  }
};

/**
 * Render a single glyph to a character using OffscreenCanvas
 */
function renderGlyphToCharacter(
  font: OpenTypeFont,
  charCode: number,
  options: {
    charWidth: number;
    charHeight: number;
    fontSize: number;
    threshold: number;
    centerGlyphs: boolean;
    baselineOffset: number;
  }
): { pixels: boolean[][] } {
  const { charWidth, charHeight, fontSize, threshold, centerGlyphs, baselineOffset } = options;

  // Create OffscreenCanvas for rendering
  const canvas = new OffscreenCanvas(charWidth, charHeight);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return createEmptyCharacter(charWidth, charHeight);
  }

  // Clear canvas with white
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, charWidth, charHeight);

  // Get the glyph
  const glyph = font.charToGlyph(String.fromCharCode(charCode));

  if (!glyph || glyph.index === 0) {
    return createEmptyCharacter(charWidth, charHeight);
  }

  // Calculate metrics
  const scale = fontSize / font.unitsPerEm;
  const glyphWidth = glyph.advanceWidth * scale;
  const glyphHeight = (font.ascender - font.descender) * scale;

  // Calculate position
  let x = 0;
  let y = charHeight - font.descender * scale * -1 + baselineOffset;

  if (centerGlyphs) {
    x = (charWidth - glyphWidth) / 2;
    const verticalOffset = (charHeight - glyphHeight) / 2;
    y = charHeight - font.descender * scale * -1 - verticalOffset + baselineOffset;
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
function createEmptyCharacter(width: number, height: number): { pixels: boolean[][] } {
  const pixels: boolean[][] = [];
  for (let y = 0; y < height; y++) {
    pixels.push(new Array(width).fill(false));
  }
  return { pixels };
}

// Export empty object to make this a module
export {};
