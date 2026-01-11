/**
 * Character ROM Editor - Export Formats
 *
 * Provides export to various formats:
 * - Binary ROM (existing)
 * - C/C++ Header
 * - Assembly Include
 * - PNG Image
 */

import {
  Character,
  CharacterSetConfig,
  bytesPerLine,
  bytesPerCharacter,
} from "./types";
import { characterToBytes } from "./import/binary";
import { jsPDF } from "jspdf";

/**
 * Export format types
 */
export type ExportFormat = "binary" | "code" | "png" | "reference-sheet";

/**
 * Code export output format (C Header or Assembly)
 */
export type CodeOutputFormat = "c-header" | "assembly";

/**
 * Reference sheet output format (PNG or PDF)
 */
export type ReferenceSheetOutputFormat = "png" | "pdf";

/**
 * Export format metadata
 */
export interface ExportFormatInfo {
  id: ExportFormat;
  name: string;
  description: string;
  extension: string;
  mimeType: string;
}

/**
 * Available export formats
 */
export const EXPORT_FORMATS: ExportFormatInfo[] = [
  {
    id: "binary",
    name: "Binary ROM",
    description: "Raw binary data for direct ROM programming",
    extension: ".bin",
    mimeType: "application/octet-stream",
  },
  {
    id: "code",
    name: "Source Code",
    description: "C/C++ header or assembly include file",
    extension: ".h",
    mimeType: "text/x-c",
  },
  {
    id: "png",
    name: "PNG Image",
    description: "Character sheet image",
    extension: ".png",
    mimeType: "image/png",
  },
  {
    id: "reference-sheet",
    name: "Reference Sheet",
    description: "Printable reference with character codes",
    extension: ".png",
    mimeType: "image/png",
  },
];

/**
 * C/C++ Header export options
 */
export interface CHeaderOptions {
  arrayName: string;
  includeGuards: boolean;
  includeComments: boolean;
  bytesPerLine: number;
}

/**
 * Assembly export options
 */
export interface AssemblyOptions {
  labelName: string;
  directive: ".byte" | "db" | ".db" | "DC.B";
  useHex: boolean;
  includeComments: boolean;
  bytesPerLine: number;
}

/**
 * PNG export options
 */
export interface PngOptions {
  columns: number;
  scale: number;
  showGrid: boolean;
  gridColor: string;
  foregroundColor: string;
  backgroundColor: string;
  transparent: boolean;
  /** Whether scanlines effect is enabled */
  scanlines: boolean;
  /** Scanlines intensity (0-100) */
  scanlinesIntensity: number;
  /** Whether bloom/glow effect is enabled */
  bloom: boolean;
  /** Bloom intensity (0-100) */
  bloomIntensity: number;
}

/**
 * Reference sheet export options
 */
export interface ReferenceSheetOptions {
  outputFormat: ReferenceSheetOutputFormat;
  columns: number;
  scale: number;
  layout: "grid" | "table";
  showHex: boolean;
  showDecimal: boolean;
  showOctal: boolean;
  showBinary: boolean;
  showAscii: boolean;
  showNonPrintableAscii: boolean;
  showGroupLabel: boolean;
  foregroundColor: string;
  backgroundColor: string;
  sheetBackgroundColor: string;
  labelColor: string;
  title: string;
  showTitle: boolean;
  // Individual label colors
  titleColor: string;
  groupLabelColor: string;
  hexColor: string;
  decimalColor: string;
  octalColor: string;
  binaryColor: string;
  asciiColor: string;
  nonPrintableAsciiColor: string;
  /** Whether scanlines effect is enabled */
  scanlines: boolean;
  /** Scanlines intensity (0-100) */
  scanlinesIntensity: number;
  /** Whether bloom/glow effect is enabled */
  bloom: boolean;
  /** Bloom intensity (0-100) */
  bloomIntensity: number;
}

/**
 * Default C Header options
 */
export function getDefaultCHeaderOptions(name: string): CHeaderOptions {
  // Sanitize name for C identifier
  const sanitized = name
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^[0-9]/, "_$&")
    .toUpperCase();

  return {
    arrayName: sanitized || "CHARSET",
    includeGuards: true,
    includeComments: true,
    bytesPerLine: 8,
  };
}

/**
 * Default Assembly options
 */
export function getDefaultAssemblyOptions(name: string): AssemblyOptions {
  const sanitized = name
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^[0-9]/, "_$&")
    .toLowerCase();

  return {
    labelName: sanitized || "charset",
    directive: ".byte",
    useHex: true,
    includeComments: true,
    bytesPerLine: 8,
  };
}

/**
 * Default PNG options
 */
export function getDefaultPngOptions(): PngOptions {
  return {
    columns: 16,
    scale: 4,
    showGrid: true,
    gridColor: "#4a4a4a",
    foregroundColor: "#ffffff",
    backgroundColor: "#000000",
    transparent: false,
    scanlines: false,
    scanlinesIntensity: 50,
    bloom: false,
    bloomIntensity: 40,
  };
}

/**
 * Default Reference Sheet options
 */
export function getDefaultReferenceSheetOptions(name: string): ReferenceSheetOptions {
  return {
    outputFormat: "png",
    columns: 16,
    scale: 4,
    layout: "grid",
    showHex: true,
    showDecimal: false,
    showOctal: false,
    showBinary: false,
    showAscii: true,
    showNonPrintableAscii: false,
    showGroupLabel: true,
    foregroundColor: "#ffffff",
    backgroundColor: "#000000",
    sheetBackgroundColor: "#1a1a2e",
    labelColor: "#888888",
    title: name || "Character Set",
    showTitle: true,
    // Individual label colors
    titleColor: "#ffffff",
    groupLabelColor: "#ffffff",
    hexColor: "#888888",
    decimalColor: "#888888",
    octalColor: "#888888",
    binaryColor: "#888888",
    asciiColor: "#ffffff",
    nonPrintableAsciiColor: "#666666",
    scanlines: false,
    scanlinesIntensity: 50,
    bloom: false,
    bloomIntensity: 40,
  };
}

/**
 * Generate C/C++ header file content
 */
export function exportToCHeader(
  characters: Character[],
  config: CharacterSetConfig,
  options: CHeaderOptions
): string {
  const lines: string[] = [];
  const guardName = `${options.arrayName}_H`;
  const charSize = bytesPerCharacter(config);

  // Header comment
  if (options.includeComments) {
    lines.push("/**");
    lines.push(` * ${options.arrayName} - Character ROM Data`);
    lines.push(` * Generated by RetroStack Character ROM Editor`);
    lines.push(` * `);
    lines.push(` * Character dimensions: ${config.width}x${config.height}`);
    lines.push(` * Total characters: ${characters.length}`);
    lines.push(` * Bytes per character: ${charSize}`);
    lines.push(" */");
    lines.push("");
  }

  // Include guards
  if (options.includeGuards) {
    lines.push(`#ifndef ${guardName}`);
    lines.push(`#define ${guardName}`);
    lines.push("");
  }

  // Array declaration
  const totalBytes = characters.length * charSize;
  lines.push(
    `const unsigned char ${options.arrayName}[${totalBytes}] = {`
  );

  // Generate byte data
  for (let i = 0; i < characters.length; i++) {
    const bytes = characterToBytes(characters[i], config);
    const byteStrings: string[] = [];

    for (let j = 0; j < bytes.length; j++) {
      byteStrings.push(`0x${bytes[j].toString(16).padStart(2, "0").toUpperCase()}`);
    }

    // Split into lines
    for (let j = 0; j < byteStrings.length; j += options.bytesPerLine) {
      const chunk = byteStrings.slice(j, j + options.bytesPerLine);
      const isLast = i === characters.length - 1 && j + options.bytesPerLine >= byteStrings.length;
      const lineContent = `  ${chunk.join(", ")}${isLast ? "" : ","}`;

      if (options.includeComments && j === 0) {
        lines.push(`${lineContent}  /* Char ${i} */`);
      } else {
        lines.push(lineContent);
      }
    }
  }

  lines.push("};");
  lines.push("");

  // Close include guards
  if (options.includeGuards) {
    lines.push(`#endif /* ${guardName} */`);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Generate assembly include file content
 */
export function exportToAssembly(
  characters: Character[],
  config: CharacterSetConfig,
  options: AssemblyOptions
): string {
  const lines: string[] = [];
  const charSize = bytesPerCharacter(config);

  // Header comment
  if (options.includeComments) {
    lines.push("; " + "=".repeat(60));
    lines.push(`; ${options.labelName} - Character ROM Data`);
    lines.push("; Generated by RetroStack Character ROM Editor");
    lines.push("; ");
    lines.push(`; Character dimensions: ${config.width}x${config.height}`);
    lines.push(`; Total characters: ${characters.length}`);
    lines.push(`; Bytes per character: ${charSize}`);
    lines.push("; " + "=".repeat(60));
    lines.push("");
  }

  // Label
  lines.push(`${options.labelName}:`);

  // Generate byte data
  for (let i = 0; i < characters.length; i++) {
    const bytes = characterToBytes(characters[i], config);
    const byteStrings: string[] = [];

    for (let j = 0; j < bytes.length; j++) {
      if (options.useHex) {
        byteStrings.push(`$${bytes[j].toString(16).padStart(2, "0").toUpperCase()}`);
      } else {
        byteStrings.push(bytes[j].toString());
      }
    }

    // Split into lines
    for (let j = 0; j < byteStrings.length; j += options.bytesPerLine) {
      const chunk = byteStrings.slice(j, j + options.bytesPerLine);
      const lineContent = `    ${options.directive} ${chunk.join(", ")}`;

      if (options.includeComments && j === 0) {
        lines.push(`${lineContent}  ; Char ${i}`);
      } else {
        lines.push(lineContent);
      }
    }
  }

  lines.push("");

  return lines.join("\n");
}

/**
 * Generate PNG image as data URL
 * Returns a promise that resolves to a data URL
 */
export async function exportToPng(
  characters: Character[],
  config: CharacterSetConfig,
  options: PngOptions
): Promise<Blob> {
  const { columns, scale, showGrid, gridColor, foregroundColor, backgroundColor, transparent, scanlines, scanlinesIntensity, bloom, bloomIntensity } =
    options;

  const rows = Math.ceil(characters.length / columns);
  const charWidth = config.width;
  const charHeight = config.height;

  // Calculate canvas size
  const gridThickness = showGrid ? 1 : 0;
  const canvasWidth =
    columns * charWidth * scale + (showGrid ? (columns + 1) * gridThickness : 0);
  const canvasHeight =
    rows * charHeight * scale + (showGrid ? (rows + 1) * gridThickness : 0);

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create canvas context");
  }

  // Fill background
  if (transparent) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  } else {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // Set up bloom effect if enabled (only for character pixels)
  const hasBloom = bloom && bloomIntensity > 0;
  if (hasBloom) {
    ctx.shadowColor = foregroundColor;
    // Map intensity 0-100 to blur radius 0-2 (scaled by pixel size)
    ctx.shadowBlur = (bloomIntensity / 100) * scale * 2;
  }

  // Draw characters
  for (let i = 0; i < characters.length; i++) {
    const character = characters[i];
    const col = i % columns;
    const row = Math.floor(i / columns);

    const baseX = showGrid
      ? col * (charWidth * scale + gridThickness) + gridThickness
      : col * charWidth * scale;
    const baseY = showGrid
      ? row * (charHeight * scale + gridThickness) + gridThickness
      : row * charHeight * scale;

    // Draw character pixels
    ctx.fillStyle = foregroundColor;
    for (let py = 0; py < charHeight; py++) {
      for (let px = 0; px < charWidth; px++) {
        const isOn = character.pixels[py]?.[px] || false;

        if (isOn) {
          ctx.fillRect(baseX + px * scale, baseY + py * scale, scale, scale);
        } else if (!transparent && !hasBloom) {
          // Only draw background pixels if no bloom (bloom looks better without explicit bg pixels)
          ctx.save();
          ctx.shadowBlur = 0;
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(baseX + px * scale, baseY + py * scale, scale, scale);
          ctx.restore();
          ctx.fillStyle = foregroundColor;
        }
      }
    }
  }

  // Reset bloom before drawing scanlines and grid
  if (hasBloom) {
    ctx.shadowBlur = 0;
  }

  // Draw scanlines overlay if enabled
  if (scanlines && scanlinesIntensity > 0) {
    // Map intensity 0-100 to opacity 0-0.5
    const opacity = (scanlinesIntensity / 100) * 0.5;
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;

    if (showGrid) {
      // When grid is shown, draw scanlines per character cell to avoid affecting grid lines
      for (let i = 0; i < characters.length; i++) {
        const col = i % columns;
        const row = Math.floor(i / columns);

        const baseX = col * (charWidth * scale + gridThickness) + gridThickness;
        const baseY = row * (charHeight * scale + gridThickness) + gridThickness;

        const cellW = charWidth * scale;
        const cellH = charHeight * scale;

        // Draw horizontal scanlines within this character cell
        for (let y = 0; y < cellH; y += 2) {
          ctx.fillRect(baseX, baseY + y, cellW, 1);
        }
      }
    } else {
      // No grid - draw scanlines across the entire canvas (full CRT effect)
      for (let y = 0; y < canvasHeight; y += 2) {
        ctx.fillRect(0, y, canvasWidth, 1);
      }
    }
  }

  // Draw grid lines LAST (on top of everything, no bloom)
  if (showGrid) {
    ctx.fillStyle = gridColor;

    // Vertical lines
    for (let col = 0; col <= columns; col++) {
      const x = col * (charWidth * scale + gridThickness);
      ctx.fillRect(x, 0, gridThickness, canvasHeight);
    }

    // Horizontal lines
    for (let row = 0; row <= rows; row++) {
      const y = row * (charHeight * scale + gridThickness);
      ctx.fillRect(0, y, canvasWidth, gridThickness);
    }
  }

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create PNG blob"));
        }
      },
      "image/png"
    );
  });
}

/**
 * Get printable ASCII character or control code name
 */
function getAsciiLabel(code: number): string {
  if (code >= 32 && code <= 126) {
    return String.fromCharCode(code);
  }
  // Control characters
  const controlNames: Record<number, string> = {
    0: "NUL", 1: "SOH", 2: "STX", 3: "ETX", 4: "EOT", 5: "ENQ", 6: "ACK", 7: "BEL",
    8: "BS", 9: "TAB", 10: "LF", 11: "VT", 12: "FF", 13: "CR", 14: "SO", 15: "SI",
    16: "DLE", 17: "DC1", 18: "DC2", 19: "DC3", 20: "DC4", 21: "NAK", 22: "SYN", 23: "ETB",
    24: "CAN", 25: "EM", 26: "SUB", 27: "ESC", 28: "FS", 29: "GS", 30: "RS", 31: "US",
    127: "DEL",
  };
  return controlNames[code] || "";
}

/**
 * Generate Reference Sheet Canvas
 * Creates a canvas with the printable reference
 */
function generateReferenceSheetCanvas(
  characters: Character[],
  config: CharacterSetConfig,
  options: ReferenceSheetOptions
): HTMLCanvasElement {
  const {
    columns,
    scale,
    layout,
    showHex,
    showDecimal,
    showOctal,
    showBinary,
    showAscii,
    showNonPrintableAscii,
    showGroupLabel,
    foregroundColor,
    backgroundColor,
    sheetBackgroundColor,
    labelColor,
    title,
    showTitle,
    titleColor,
    groupLabelColor,
    hexColor,
    decimalColor,
    octalColor,
    binaryColor,
    asciiColor,
    nonPrintableAsciiColor,
    scanlines,
    scanlinesIntensity,
    bloom,
    bloomIntensity,
  } = options;

  const charWidth = config.width;
  const charHeight = config.height;

  // Resolution multiplier for high-quality output
  const resMult = 2;

  // Create canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create canvas context");
  }

  if (layout === "table") {
    // Table layout - like ASCII conversion chart
    const rowsPerSection = 32;
    const numSections = Math.ceil(characters.length / rowsPerSection);
    const rowHeight = Math.max(charHeight * scale + 8, 24) * resMult;

    // Calculate column widths (scaled for resolution)
    const charColWidth = (charWidth * scale + 16) * resMult;
    const decColWidth = 48 * resMult;
    const binColWidth = 90 * resMult;
    const octColWidth = 52 * resMult;
    const hexColWidth = 44 * resMult;
    const asciiColWidth = 52 * resMult;

    // Calculate which columns to show
    const visibleCols = [
      { show: true, width: charColWidth, header: "Char" },
      { show: showDecimal, width: decColWidth, header: "Dec" },
      { show: showBinary, width: binColWidth, header: "Binary" },
      { show: showOctal, width: octColWidth, header: "Oct" },
      { show: showHex, width: hexColWidth, header: "Hex" },
      { show: showAscii || showNonPrintableAscii, width: asciiColWidth, header: "ASCII" },
    ].filter(c => c.show);

    const sectionWidth = visibleCols.reduce((sum, c) => sum + c.width, 0) + 20 * resMult;
    const headerHeight = showTitle ? 80 * resMult : 0;
    const groupLabelHeight = showGroupLabel ? 24 * resMult : 0;
    const tableHeaderHeight = 40 * resMult + groupLabelHeight;
    const sectionGap = 30 * resMult;

    const canvasWidth = numSections * sectionWidth + (numSections - 1) * sectionGap + 40 * resMult;
    const canvasHeight = headerHeight + tableHeaderHeight + rowsPerSection * rowHeight + 60 * resMult;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Fill background
    ctx.fillStyle = sheetBackgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw title
    if (showTitle && title) {
      ctx.fillStyle = titleColor;
      ctx.font = `bold ${32 * resMult}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(title, canvasWidth / 2, 52 * resMult);

      ctx.fillStyle = labelColor;
      ctx.font = `${20 * resMult}px monospace`;
      ctx.fillText(
        `${characters.length} characters, ${charWidth}x${charHeight} pixels`,
        canvasWidth / 2,
        76 * resMult
      );
    }

    // ASCII group labels
    const getGroupLabel = (startIndex: number): string => {
      if (startIndex >= 0 && startIndex < 32) return "Control";
      if (startIndex >= 32 && startIndex < 64) return "Numbers & Special";
      if (startIndex >= 64 && startIndex < 96) return "Uppercase";
      if (startIndex >= 96 && startIndex < 128) return "Lowercase";
      if (startIndex >= 128 && startIndex < 160) return "Extended Control";
      if (startIndex >= 160 && startIndex < 192) return "Extended Special";
      if (startIndex >= 192 && startIndex < 224) return "Extended Upper";
      if (startIndex >= 224 && startIndex < 256) return "Extended Lower";
      return `${startIndex}-${startIndex + 31}`;
    };

    // Draw sections
    for (let section = 0; section < numSections; section++) {
      const sectionX = 20 * resMult + section * (sectionWidth + sectionGap);
      const startIdx = section * rowsPerSection;

      // Draw group label
      if (showGroupLabel) {
        ctx.fillStyle = groupLabelColor;
        ctx.font = `bold ${16 * resMult}px monospace`;
        ctx.textAlign = "center";
        const groupLabel = getGroupLabel(startIdx);
        ctx.fillText(groupLabel, sectionX + sectionWidth / 2 - 10 * resMult, headerHeight + 16 * resMult);
      }

      // Draw table header
      ctx.fillStyle = labelColor;
      ctx.font = `bold ${18 * resMult}px monospace`;
      ctx.textAlign = "center";

      let colX = sectionX;
      for (const col of visibleCols) {
        ctx.fillText(col.header, colX + col.width / 2, headerHeight + tableHeaderHeight - 12 * resMult);
        colX += col.width;
      }

      // Draw header line
      ctx.strokeStyle = labelColor;
      ctx.lineWidth = 2 * resMult;
      ctx.beginPath();
      ctx.moveTo(sectionX, headerHeight + tableHeaderHeight);
      ctx.lineTo(sectionX + sectionWidth - 20 * resMult, headerHeight + tableHeaderHeight);
      ctx.stroke();

      // Draw rows
      for (let row = 0; row < rowsPerSection; row++) {
        const charIdx = startIdx + row;
        if (charIdx >= characters.length) break;

        const character = characters[charIdx];
        const rowY = headerHeight + tableHeaderHeight + row * rowHeight + rowHeight / 2;

        colX = sectionX;
        ctx.font = `${18 * resMult}px monospace`;
        ctx.textAlign = "center";

        // Character graphic
        const charDrawX = colX + (charColWidth - charWidth * scale * resMult) / 2;
        const charDrawY = rowY - (charHeight * scale * resMult) / 2;

        // Draw character background (no bloom)
        ctx.shadowBlur = 0;
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(charDrawX - 2 * resMult, charDrawY - 2 * resMult, charWidth * scale * resMult + 4 * resMult, charHeight * scale * resMult + 4 * resMult);

        // Set up bloom effect for character pixels only
        if (bloom && bloomIntensity > 0) {
          ctx.shadowColor = foregroundColor;
          ctx.shadowBlur = (bloomIntensity / 100) * scale * resMult * 2;
        }

        ctx.fillStyle = foregroundColor;
        for (let py = 0; py < charHeight; py++) {
          for (let px = 0; px < charWidth; px++) {
            const isOn = character.pixels[py]?.[px] || false;
            if (isOn) {
              ctx.fillRect(charDrawX + px * scale * resMult, charDrawY + py * scale * resMult, scale * resMult, scale * resMult);
            }
          }
        }

        // Reset shadow before scanlines
        if (bloom && bloomIntensity > 0) {
          ctx.shadowBlur = 0;
        }

        // Draw scanlines on the entire character cell including border
        if (scanlines && scanlinesIntensity > 0) {
          const opacity = (scanlinesIntensity / 100) * 0.5;
          ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
          // Include the 2px border around the character
          const cellX = charDrawX - 2 * resMult;
          const cellY = charDrawY - 2 * resMult;
          const cellW = charWidth * scale * resMult + 4 * resMult;
          const cellH = charHeight * scale * resMult + 4 * resMult;
          for (let sy = 0; sy < cellH; sy += 2 * resMult) {
            ctx.fillRect(cellX, cellY + sy, cellW, resMult);
          }
        }

        colX += charColWidth;

        // Decimal
        if (showDecimal) {
          ctx.fillStyle = decimalColor;
          ctx.fillText(charIdx.toString(), colX + decColWidth / 2, rowY + 6 * resMult);
          colX += decColWidth;
        }

        // Binary
        if (showBinary) {
          ctx.fillStyle = binaryColor;
          ctx.font = `${14 * resMult}px monospace`;
          ctx.fillText(charIdx.toString(2).padStart(8, "0"), colX + binColWidth / 2, rowY + 6 * resMult);
          ctx.font = `${18 * resMult}px monospace`;
          colX += binColWidth;
        }

        // Octal
        if (showOctal) {
          ctx.fillStyle = octalColor;
          ctx.fillText(charIdx.toString(8).padStart(3, "0"), colX + octColWidth / 2, rowY + 6 * resMult);
          colX += octColWidth;
        }

        // Hex
        if (showHex) {
          ctx.fillStyle = hexColor;
          ctx.fillText(charIdx.toString(16).toUpperCase().padStart(2, "0"), colX + hexColWidth / 2, rowY + 6 * resMult);
          colX += hexColWidth;
        }

        // ASCII
        if (showAscii || showNonPrintableAscii) {
          const isPrintable = charIdx >= 32 && charIdx <= 126;
          const shouldShow = (isPrintable && showAscii) || (!isPrintable && showNonPrintableAscii);

          if (shouldShow) {
            const asciiLabel = getAsciiLabel(charIdx);
            if (asciiLabel) {
              ctx.fillStyle = isPrintable ? asciiColor : nonPrintableAsciiColor;
              ctx.fillText(asciiLabel, colX + asciiColWidth / 2, rowY + 6 * resMult);
            }
          }
        }
      }
    }

    // Draw border
    ctx.strokeStyle = labelColor;
    ctx.lineWidth = 2 * resMult;
    ctx.strokeRect(resMult, resMult, canvasWidth - 2 * resMult, canvasHeight - 2 * resMult);
  } else {
    // Grid layout (original)
    const rows = Math.ceil(characters.length / columns);

    // Calculate dimensions (with resolution multiplier)
    const cellPadding = 8 * resMult;
    const labelHeight = 28 * resMult;
    const hasAsciiLabels = showAscii || showNonPrintableAscii;
    const labelLines = (showHex ? 1 : 0) + (showDecimal ? 1 : 0) + (showOctal ? 1 : 0) + (showBinary ? 1 : 0) + (hasAsciiLabels ? 1 : 0);
    const totalLabelHeight = labelHeight * Math.max(1, labelLines);

    const cellWidth = charWidth * scale * resMult + cellPadding * 2;
    const cellHeight = charHeight * scale * resMult + cellPadding * 2 + totalLabelHeight;

    const headerHeight = showTitle ? 80 * resMult : 0;
    const rowHeaderWidth = 80 * resMult;
    const colHeaderHeight = 40 * resMult;

    const canvasWidth = rowHeaderWidth + columns * cellWidth + cellPadding;
    const canvasHeight = headerHeight + colHeaderHeight + rows * cellHeight + cellPadding;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Fill background
    ctx.fillStyle = sheetBackgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw title
    if (showTitle && title) {
      ctx.fillStyle = titleColor;
      ctx.font = `bold ${32 * resMult}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(title, canvasWidth / 2, 52 * resMult);

      ctx.fillStyle = labelColor;
      ctx.font = `${20 * resMult}px monospace`;
      ctx.fillText(
        `${characters.length} characters, ${charWidth}x${charHeight} pixels`,
        canvasWidth / 2,
        76 * resMult
      );
    }

    // Draw column headers
    ctx.fillStyle = labelColor;
    ctx.font = `${20 * resMult}px monospace`;
    ctx.textAlign = "center";
    for (let col = 0; col < columns; col++) {
      const x = rowHeaderWidth + col * cellWidth + cellWidth / 2;
      const y = headerHeight + colHeaderHeight - 12 * resMult;
      ctx.fillText(col.toString(16).toUpperCase(), x, y);
    }

    // Draw row headers
    ctx.textAlign = "right";
    for (let row = 0; row < rows; row++) {
      const x = rowHeaderWidth - 16 * resMult;
      const y = headerHeight + colHeaderHeight + row * cellHeight + cellHeight / 2;
      const rowValue = row * columns;
      ctx.fillText(rowValue.toString(16).toUpperCase().padStart(2, "0") + "_", x, y);
    }

    // Draw characters
    for (let i = 0; i < characters.length; i++) {
      const character = characters[i];
      const col = i % columns;
      const row = Math.floor(i / columns);

      const cellX = rowHeaderWidth + col * cellWidth;
      const cellY = headerHeight + colHeaderHeight + row * cellHeight;

      // Draw cell background (no bloom)
      ctx.shadowBlur = 0;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(
        cellX + 2 * resMult,
        cellY + 2 * resMult,
        cellWidth - 4 * resMult,
        charHeight * scale * resMult + cellPadding * 2 - 4 * resMult
      );

      // Draw character pixels
      const charX = cellX + cellPadding;
      const charY = cellY + cellPadding;

      // Set up bloom effect for character pixels only
      if (bloom && bloomIntensity > 0) {
        ctx.shadowColor = foregroundColor;
        ctx.shadowBlur = (bloomIntensity / 100) * scale * resMult * 2;
      }

      ctx.fillStyle = foregroundColor;
      for (let py = 0; py < charHeight; py++) {
        for (let px = 0; px < charWidth; px++) {
          const isOn = character.pixels[py]?.[px] || false;
          if (isOn) {
            ctx.fillRect(charX + px * scale * resMult, charY + py * scale * resMult, scale * resMult, scale * resMult);
          }
        }
      }

      // Reset shadow before scanlines
      if (bloom && bloomIntensity > 0) {
        ctx.shadowBlur = 0;
      }

      // Draw scanlines on the entire character cell including background/padding
      if (scanlines && scanlinesIntensity > 0) {
        const opacity = (scanlinesIntensity / 100) * 0.5;
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        // Cover the entire background area (matches the fillRect above)
        const bgX = cellX + 2 * resMult;
        const bgY = cellY + 2 * resMult;
        const bgW = cellWidth - 4 * resMult;
        const bgH = charHeight * scale * resMult + cellPadding * 2 - 4 * resMult;
        for (let sy = 0; sy < bgH; sy += 2 * resMult) {
          ctx.fillRect(bgX, bgY + sy, bgW, resMult);
        }
      }

      // Draw labels
      ctx.font = `${18 * resMult}px monospace`;
      ctx.textAlign = "center";

      let labelY = cellY + cellPadding + charHeight * scale * resMult + 24 * resMult;
      const labelX = cellX + cellWidth / 2;

      if (showHex) {
        ctx.fillStyle = hexColor;
        ctx.fillText(
          "$" + i.toString(16).toUpperCase().padStart(2, "0"),
          labelX,
          labelY
        );
        labelY += 20 * resMult;
      }

      if (showDecimal) {
        ctx.fillStyle = decimalColor;
        ctx.fillText(i.toString(), labelX, labelY);
        labelY += 20 * resMult;
      }

      if (showOctal) {
        ctx.fillStyle = octalColor;
        ctx.fillText(i.toString(8).padStart(3, "0"), labelX, labelY);
        labelY += 20 * resMult;
      }

      if (showBinary) {
        ctx.fillStyle = binaryColor;
        ctx.font = `${14 * resMult}px monospace`;
        ctx.fillText(i.toString(2).padStart(8, "0"), labelX, labelY);
        ctx.font = `${18 * resMult}px monospace`;
        labelY += 20 * resMult;
      }

      if (showAscii || showNonPrintableAscii) {
        const isPrintable = i >= 32 && i <= 126;
        const shouldShow = (isPrintable && showAscii) || (!isPrintable && showNonPrintableAscii);

        if (shouldShow) {
          const asciiLabel = getAsciiLabel(i);
          if (asciiLabel) {
            ctx.fillStyle = isPrintable ? asciiColor : nonPrintableAsciiColor;
            ctx.fillText(asciiLabel, labelX, labelY);
          }
        }
      }
    }

    // Draw border
    ctx.strokeStyle = labelColor;
    ctx.lineWidth = 2 * resMult;
    ctx.strokeRect(resMult, resMult, canvasWidth - 2 * resMult, canvasHeight - 2 * resMult);
  }

  // Note: Scanlines are drawn per-character cell inline with the character rendering above
  // to avoid affecting text labels and other UI elements

  // Add footer with generator info
  ctx.fillStyle = "#444444";
  ctx.font = `${16 * resMult}px monospace`;
  ctx.textAlign = "right";
  ctx.fillText(
    "Generated by RetroStack Character ROM Editor",
    canvas.width - 16 * resMult,
    canvas.height - 8 * resMult
  );

  return canvas;
}

/**
 * Generate Reference Sheet PNG
 * Creates a printable reference with character codes
 */
export async function exportToReferenceSheet(
  characters: Character[],
  config: CharacterSetConfig,
  options: ReferenceSheetOptions
): Promise<Blob> {
  const canvas = generateReferenceSheetCanvas(characters, config, options);

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create PNG blob"));
        }
      },
      "image/png"
    );
  });
}

/**
 * Generate Reference Sheet PDF
 * Creates a PDF document with the reference sheet
 */
export async function exportToReferenceSheetPdf(
  characters: Character[],
  config: CharacterSetConfig,
  options: ReferenceSheetOptions
): Promise<Blob> {
  const canvas = generateReferenceSheetCanvas(characters, config, options);

  // Get canvas dimensions
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // Determine PDF orientation and size
  const isLandscape = imgWidth > imgHeight;
  const orientation = isLandscape ? "landscape" : "portrait";

  // Create PDF with appropriate size
  // Use the image aspect ratio to determine page dimensions
  const maxWidth = isLandscape ? 297 : 210; // A4 dimensions in mm
  const maxHeight = isLandscape ? 210 : 297;

  // Calculate scale to fit image on page with margins
  const margin = 10; // mm
  const availableWidth = maxWidth - 2 * margin;
  const availableHeight = maxHeight - 2 * margin;

  const scaleX = availableWidth / (imgWidth / 3.78); // Convert px to mm (assuming 96 DPI)
  const scaleY = availableHeight / (imgHeight / 3.78);
  const pdfScale = Math.min(scaleX, scaleY, 1); // Don't scale up

  const pdfWidth = (imgWidth / 3.78) * pdfScale;
  const pdfHeight = (imgHeight / 3.78) * pdfScale;

  // Center the image on the page
  const xOffset = margin + (availableWidth - pdfWidth) / 2;
  const yOffset = margin + (availableHeight - pdfHeight) / 2;

  // Create PDF
  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  // Add canvas as image
  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", xOffset, yOffset, pdfWidth, pdfHeight);

  // Return as blob
  return pdf.output("blob");
}

/**
 * Get hex preview of first N bytes
 */
export function getHexPreview(
  characters: Character[],
  config: CharacterSetConfig,
  maxBytes: number = 16
): string {
  if (characters.length === 0) return "";

  const bytes: number[] = [];
  let charIndex = 0;

  while (bytes.length < maxBytes && charIndex < characters.length) {
    const charBytes = characterToBytes(characters[charIndex], config);
    for (let i = 0; i < charBytes.length && bytes.length < maxBytes; i++) {
      bytes.push(charBytes[i]);
    }
    charIndex++;
  }

  return bytes.map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");
}

/**
 * Get hex preview with raw bytes for direct byte access
 */
export function getHexPreviewWithBytes(
  characters: Character[],
  config: CharacterSetConfig,
  maxBytes: number = 16
): { hex: string; bytes: number[] } {
  if (characters.length === 0) return { hex: "", bytes: [] };

  const bytes: number[] = [];
  let charIndex = 0;

  while (bytes.length < maxBytes && charIndex < characters.length) {
    const charBytes = characterToBytes(characters[charIndex], config);
    for (let i = 0; i < charBytes.length && bytes.length < maxBytes; i++) {
      bytes.push(charBytes[i]);
    }
    charIndex++;
  }

  const hex = bytes.map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");
  return { hex, bytes };
}

/**
 * Generate a sample row visualization showing bit layout
 */
export function getBitLayoutVisualization(
  character: Character,
  config: CharacterSetConfig,
  row: number = 0
): { bits: string; hex: string; padding: string } {
  const bytes = characterToBytes(character, config);
  const bpl = bytesPerLine(config.width);
  const rowBytes = bytes.slice(row * bpl, (row + 1) * bpl);

  // Get bits as string
  let bits = "";
  for (const byte of rowBytes) {
    bits += byte.toString(2).padStart(8, "0");
  }

  // Mark padding bits
  const totalBits = bpl * 8;
  const paddingBits = totalBits - config.width;
  let padding = "";

  if (config.padding === "left") {
    padding = "P".repeat(paddingBits) + "D".repeat(config.width);
  } else {
    padding = "D".repeat(config.width) + "P".repeat(paddingBits);
  }

  // Get hex representation
  const hex = Array.from(rowBytes)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");

  return { bits, hex, padding };
}
