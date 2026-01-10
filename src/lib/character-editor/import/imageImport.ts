/**
 * Image Import Utilities
 *
 * Functions for importing character sets from PNG/image files
 */

import { Character } from "../types";

/**
 * Reading order for character extraction
 */
export type ReadingOrder =
  | "ltr-ttb" // Left to right, top to bottom (default)
  | "rtl-ttb" // Right to left, top to bottom
  | "ltr-btt" // Left to right, bottom to top
  | "rtl-btt" // Right to left, bottom to top
  | "ttb-ltr" // Top to bottom, left to right
  | "ttb-rtl" // Top to bottom, right to left
  | "btt-ltr" // Bottom to top, left to right
  | "btt-rtl"; // Bottom to top, right to left

/**
 * Options for importing from an image
 */
export interface ImageImportOptions {
  /** Character width in pixels */
  charWidth: number;
  /** Character height in pixels */
  charHeight: number;
  /** Grid offset X (starting position) */
  offsetX: number;
  /** Grid offset Y (starting position) */
  offsetY: number;
  /** Horizontal gap between characters in pixels */
  gapX: number;
  /** Vertical gap between characters in pixels */
  gapY: number;
  /** Force a specific number of columns (0 = auto-detect) */
  forceColumns: number;
  /** Force a specific number of rows (0 = auto-detect) */
  forceRows: number;
  /** Threshold for black/white conversion (0-255) */
  threshold: number;
  /** Whether to invert colors (treat dark as on) */
  invert: boolean;
  /** Maximum number of characters to import */
  maxCharacters?: number;
  /** Width of source pixels to average for each logical pixel (1-100) */
  pixelWidth: number;
  /** Height of source pixels to average for each logical pixel (1-100) */
  pixelHeight: number;
  /** Rotation angle in degrees (-5 to 5) */
  rotation: number;
  /** Reading order for character extraction */
  readingOrder: ReadingOrder;
}

/**
 * Default import options
 */
export function getDefaultImageImportOptions(): ImageImportOptions {
  return {
    charWidth: 8,
    charHeight: 8,
    offsetX: 0,
    offsetY: 0,
    gapX: 0,
    gapY: 0,
    forceColumns: 0,
    forceRows: 0,
    threshold: 128,
    invert: false,
    maxCharacters: 256,
    pixelWidth: 1,
    pixelHeight: 1,
    rotation: 0,
    readingOrder: "ltr-ttb",
  };
}

/**
 * Result of parsing an image
 */
export interface ImageParseResult {
  /** Parsed characters */
  characters: Character[];
  /** Number of columns in the grid */
  columns: number;
  /** Number of rows in the grid */
  rows: number;
  /** Image width */
  imageWidth: number;
  /** Image height */
  imageHeight: number;
}

/**
 * Load an image file and return its ImageData
 */
export async function loadImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Create canvas and draw image
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to create canvas context"));
        return;
      }

      // Draw with white background (for transparent images)
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Rotate image data by a given angle in degrees around the top-left corner
 * Returns a new ImageData with the rotated image
 *
 * For positive angles: the image rotates counter-clockwise, keeping top-left fixed
 * For negative angles: the image rotates clockwise, keeping top-left fixed
 */
export function rotateImageData(imageData: ImageData, angleDegrees: number): ImageData {
  if (angleDegrees === 0) {
    return imageData;
  }

  // Negate the angle so positive = counter-clockwise visually (top-right moves up)
  // This makes it intuitive: positive angle tilts the top of the image to the left
  const angleRadians = (-angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  const { width, height } = imageData;

  // Calculate the bounding box for rotation around top-left corner (0,0)
  // The four corners after rotation:
  // (0,0) stays at (0,0)
  // (w,0) -> (w*cos, -w*sin)
  // (0,h) -> (h*sin, h*cos)
  // (w,h) -> (w*cos + h*sin, -w*sin + h*cos)
  const corners = [
    { x: 0, y: 0 },
    { x: width * cos, y: -width * sin },
    { x: height * sin, y: height * cos },
    { x: width * cos + height * sin, y: -width * sin + height * cos },
  ];

  const minX = Math.min(...corners.map((c) => c.x));
  const maxX = Math.max(...corners.map((c) => c.x));
  const minY = Math.min(...corners.map((c) => c.y));
  const maxY = Math.max(...corners.map((c) => c.y));

  const newWidth = Math.ceil(maxX - minX);
  const newHeight = Math.ceil(maxY - minY);

  // Create canvas for rotation
  const canvas = document.createElement("canvas");
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return imageData;
  }

  // Create a temporary canvas with the original image
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = width;
  srcCanvas.height = height;
  const srcCtx = srcCanvas.getContext("2d");

  if (!srcCtx) {
    return imageData;
  }

  srcCtx.putImageData(imageData, 0, 0);

  // Fill with white background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, newWidth, newHeight);

  // Translate to compensate for negative coordinates, then rotate around origin
  ctx.translate(-minX, -minY);
  ctx.rotate(angleRadians);
  ctx.drawImage(srcCanvas, 0, 0);

  return ctx.getImageData(0, 0, newWidth, newHeight);
}

/**
 * Get brightness of a pixel (0-255)
 */
function getPixelBrightness(imageData: ImageData, x: number, y: number): number {
  const index = (y * imageData.width + x) * 4;
  const r = imageData.data[index];
  const g = imageData.data[index + 1];
  const b = imageData.data[index + 2];
  const a = imageData.data[index + 3];

  // If fully transparent, treat as white (background)
  if (a === 0) return 255;

  // Use perceived brightness formula
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

/**
 * Get average brightness of a pixel area
 * When pixelWidth or pixelHeight > 1, samples multiple source pixels and averages them
 */
function getAreaBrightness(
  imageData: ImageData,
  startX: number,
  startY: number,
  pixelWidth: number,
  pixelHeight: number,
): number {
  let totalBrightness = 0;
  let validPixels = 0;

  for (let dy = 0; dy < pixelHeight; dy++) {
    for (let dx = 0; dx < pixelWidth; dx++) {
      const x = startX + dx;
      const y = startY + dy;

      // Check bounds - out of bounds pixels are treated as white (255)
      if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) {
        totalBrightness += 255;
        validPixels++;
        continue;
      }

      totalBrightness += getPixelBrightness(imageData, x, y);
      validPixels++;
    }
  }

  if (validPixels === 0) return 255;
  return Math.round(totalBrightness / validPixels);
}

/**
 * Extract a single character from an image
 */
function extractCharacter(
  imageData: ImageData,
  startX: number,
  startY: number,
  charWidth: number,
  charHeight: number,
  threshold: number,
  invert: boolean,
  pixelWidth: number = 1,
  pixelHeight: number = 1,
): Character {
  const pixels: boolean[][] = [];

  for (let y = 0; y < charHeight; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < charWidth; x++) {
      // Calculate the starting position of this pixel area in the source image
      const imgX = startX + x * pixelWidth;
      const imgY = startY + y * pixelHeight;

      // Get average brightness of the pixel area
      const brightness = getAreaBrightness(imageData, imgX, imgY, pixelWidth, pixelHeight);

      // Dark pixels (below threshold) are "on" by default
      let isOn = brightness < threshold;
      if (invert) isOn = !isOn;
      row.push(isOn);
    }
    pixels.push(row);
  }

  return { pixels };
}

/**
 * Parse an image into characters
 */
export function parseImageToCharacters(imageData: ImageData, options: ImageImportOptions): ImageParseResult {
  const {
    charWidth,
    charHeight,
    offsetX,
    offsetY,
    gapX,
    gapY,
    forceColumns,
    forceRows,
    threshold,
    invert,
    maxCharacters = 256,
    pixelWidth = 1,
    pixelHeight = 1,
    rotation = 0,
    readingOrder = "ltr-ttb",
  } = options;

  // Apply rotation if needed
  const processedImageData = rotation !== 0 ? rotateImageData(imageData, rotation) : imageData;

  // Calculate grid dimensions
  const availableWidth = processedImageData.width - offsetX;
  const availableHeight = processedImageData.height - offsetY;

  // Cell size in source image pixels (character dimensions * pixel size + gap)
  const cellWidth = charWidth * pixelWidth + gapX;
  const cellHeight = charHeight * pixelHeight + gapY;

  // Use forced dimensions if provided, otherwise auto-detect
  const columns = forceColumns > 0 ? forceColumns : Math.floor(availableWidth / cellWidth);
  const rows = forceRows > 0 ? forceRows : Math.floor(availableHeight / cellHeight);

  const characters: Character[] = [];

  // Determine iteration order based on reading order
  const isRowMajor = readingOrder.startsWith("ltr") || readingOrder.startsWith("rtl");
  const isLeftToRight = readingOrder.includes("ltr");
  const isTopToBottom = readingOrder.includes("ttb");

  // Generate row and column indices based on reading order
  const rowIndices = isTopToBottom
    ? Array.from({ length: rows }, (_, i) => i)
    : Array.from({ length: rows }, (_, i) => rows - 1 - i);

  const colIndices = isLeftToRight
    ? Array.from({ length: columns }, (_, i) => i)
    : Array.from({ length: columns }, (_, i) => columns - 1 - i);

  // Extract characters based on reading order
  if (isRowMajor) {
    // Row-major: iterate rows first, then columns
    for (const row of rowIndices) {
      if (characters.length >= maxCharacters) break;
      for (const col of colIndices) {
        if (characters.length >= maxCharacters) break;
        const startX = offsetX + col * cellWidth;
        const startY = offsetY + row * cellHeight;

        const char = extractCharacter(
          processedImageData,
          startX,
          startY,
          charWidth,
          charHeight,
          threshold,
          invert,
          pixelWidth,
          pixelHeight,
        );

        characters.push(char);
      }
    }
  } else {
    // Column-major: iterate columns first, then rows
    for (const col of colIndices) {
      if (characters.length >= maxCharacters) break;
      for (const row of rowIndices) {
        if (characters.length >= maxCharacters) break;
        const startX = offsetX + col * cellWidth;
        const startY = offsetY + row * cellHeight;

        const char = extractCharacter(
          processedImageData,
          startX,
          startY,
          charWidth,
          charHeight,
          threshold,
          invert,
          pixelWidth,
          pixelHeight,
        );

        characters.push(char);
      }
    }
  }

  return {
    characters,
    columns,
    rows,
    imageWidth: processedImageData.width,
    imageHeight: processedImageData.height,
  };
}

/**
 * Auto-detect character dimensions from an image
 * Looks for common grid patterns based on image dimensions
 */
export function detectCharacterDimensions(
  imageWidth: number,
  imageHeight: number,
): { width: number; height: number; columns: number; rows: number }[] {
  const suggestions: {
    width: number;
    height: number;
    columns: number;
    rows: number;
  }[] = [];

  // Common character sizes
  const commonSizes = [
    [8, 8],
    [8, 16],
    [6, 8],
    [8, 10],
    [8, 12],
    [16, 16],
  ];

  for (const [w, h] of commonSizes) {
    const cols = Math.floor(imageWidth / w);
    const rows = Math.floor(imageHeight / h);

    if (cols > 0 && rows > 0) {
      const totalChars = cols * rows;
      // Prefer sizes that result in common character counts
      if (totalChars === 128 || totalChars === 256 || totalChars === 96 || totalChars === 64 || totalChars === 16) {
        suggestions.unshift({ width: w, height: h, columns: cols, rows });
      } else if (totalChars >= 16 && totalChars <= 512) {
        suggestions.push({ width: w, height: h, columns: cols, rows });
      }
    }
  }

  // If no good matches, just provide 8x8 as default
  if (suggestions.length === 0) {
    const cols = Math.floor(imageWidth / 8);
    const rows = Math.floor(imageHeight / 8);
    suggestions.push({ width: 8, height: 8, columns: cols, rows });
  }

  return suggestions;
}

/**
 * Create a preview image showing the grid overlay
 */
export function createGridOverlayImage(imageData: ImageData, options: ImageImportOptions): ImageData {
  const { charWidth, charHeight, offsetX, offsetY, pixelWidth = 1, pixelHeight = 1 } = options;

  // Create a copy of the image data
  const result = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);

  // Draw grid lines (semi-transparent cyan)
  const gridColor = { r: 0, g: 255, b: 255, a: 128 };

  // Cell size in source image pixels
  const cellWidth = charWidth * pixelWidth;
  const cellHeight = charHeight * pixelHeight;

  // Draw vertical lines
  for (let x = offsetX; x < imageData.width; x += cellWidth) {
    for (let y = 0; y < imageData.height; y++) {
      const index = (y * imageData.width + x) * 4;
      result.data[index] = gridColor.r;
      result.data[index + 1] = gridColor.g;
      result.data[index + 2] = gridColor.b;
      result.data[index + 3] = gridColor.a;
    }
  }

  // Draw horizontal lines
  for (let y = offsetY; y < imageData.height; y += cellHeight) {
    for (let x = 0; x < imageData.width; x++) {
      const index = (y * imageData.width + x) * 4;
      result.data[index] = gridColor.r;
      result.data[index + 1] = gridColor.g;
      result.data[index + 2] = gridColor.b;
      result.data[index + 3] = gridColor.a;
    }
  }

  return result;
}

/**
 * Check if a file is a valid image file
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
  return validTypes.includes(file.type);
}

/**
 * Get supported image file extensions
 */
export function getSupportedImageExtensions(): string {
  return ".png, .jpg, .jpeg, .gif, .webp";
}
