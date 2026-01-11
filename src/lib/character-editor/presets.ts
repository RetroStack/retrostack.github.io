/**
 * Character ROM Editor - Centralized Presets
 *
 * This file contains all preset definitions used across the character editor.
 * All preset-related components should import from this file.
 */

import { AnchorPoint } from "./types";

// ============================================================================
// Dimension Presets
// ============================================================================

/**
 * A dimension preset with examples of systems/chips that use this format
 */
export interface DimensionPresetWithExamples {
  /** Character width in pixels */
  width: number;
  /** Character height in pixels */
  height: number;
  /** Display label (e.g., "8x8") */
  label: string;
  /** Example systems/chips that use this format */
  examples: string[];
  /** Recommended font size for font import (optional) */
  recommendedFontSize?: number;
  /** Priority level (higher = stays visible longer). 3 = essential, 2 = important, 1 = normal, 0 = low */
  priority: number;
}

/**
 * Unified dimension presets with examples
 *
 * These presets are used across:
 * - ImportFromTextModal (character import from code)
 * - ImportFromFontModal (character import from fonts)
 * - DimensionPresetSelector (quick size selection)
 * - ResizeModal (character resize)
 *
 * Based on historical character generator ROM specifications.
 * Dimensions use glyph size (actual drawn pixels), not cell size.
 */
export const UNIFIED_DIMENSION_PRESETS: DimensionPresetWithExamples[] = [
  {
    width: 5,
    height: 7,
    label: "5x7",
    examples: ["Apple II", "TRS-80 CoCo", "Dragon 32", "MC6847"],
    recommendedFontSize: 6,
    priority: 3,
  },
  {
    width: 5,
    height: 8,
    label: "5x8",
    examples: ["TRS-80 Model I", "MCM6673"],
    recommendedFontSize: 7,
    priority: 2,
  },
  {
    width: 5,
    height: 9,
    label: "5x9",
    examples: ["BBC Micro Mode 7", "Philips P2000", "SAA5050 Teletext"],
    recommendedFontSize: 8,
    priority: 2,
  },
  {
    width: 6,
    height: 8,
    label: "6x8",
    examples: ["Custom"],
    recommendedFontSize: 7,
    priority: 0,
  },
  {
    width: 8,
    height: 8,
    label: "8x8",
    examples: ["C64", "VIC-20", "Atari 400/800", "ZX Spectrum", "TI-99/4A", "MSX", "ColecoVision"],
    recommendedFontSize: 8,
    priority: 3,
  },
  {
    width: 5,
    height: 10,
    label: "5x10",
    examples: ["HD44780U LCD"],
    recommendedFontSize: 9,
    priority: 1,
  },
  {
    width: 6,
    height: 10,
    label: "6x10",
    examples: [],
    recommendedFontSize: 9,
    priority: 0,
  },
  {
    width: 5,
    height: 12,
    label: "5x12",
    examples: [],
    recommendedFontSize: 10,
    priority: 0,
  },
  {
    width: 7,
    height: 12,
    label: "7x12",
    examples: [],
    recommendedFontSize: 11,
    priority: 0,
  },
  {
    width: 8,
    height: 12,
    label: "8x12",
    examples: ["EGA 43-line mode"],
    recommendedFontSize: 11,
    priority: 0,
  },
  {
    width: 8,
    height: 14,
    label: "8x14",
    examples: ["IBM EGA", "VGA 25-line"],
    recommendedFontSize: 13,
    priority: 1,
  },
  {
    width: 5,
    height: 16,
    label: "5x16",
    examples: [],
    recommendedFontSize: 14,
    priority: 0,
  },
  {
    width: 8,
    height: 16,
    label: "8x16",
    examples: ["IBM VGA", "PC BIOS"],
    recommendedFontSize: 14,
    priority: 2,
  },
  {
    width: 16,
    height: 16,
    label: "16x16",
    examples: ["CJK Characters", "Icons"],
    recommendedFontSize: 14,
    priority: 1,
  },
  {
    width: 32,
    height: 32,
    label: "32x32",
    examples: ["Large Icons", "Sprites"],
    recommendedFontSize: 28,
    priority: 0,
  },
];

/**
 * Quick dimension presets for toolbar buttons
 * Subset of the most commonly used presets
 */
export const QUICK_DIMENSION_PRESETS: DimensionPresetWithExamples[] = [
  UNIFIED_DIMENSION_PRESETS.find((p) => p.label === "8x8")!,
  UNIFIED_DIMENSION_PRESETS.find((p) => p.label === "8x16")!,
  UNIFIED_DIMENSION_PRESETS.find((p) => p.label === "5x7")!,
];

/**
 * Font import dimension presets (with font size recommendations)
 */
export const FONT_DIMENSION_PRESETS: DimensionPresetWithExamples[] = [
  UNIFIED_DIMENSION_PRESETS.find((p) => p.label === "8x8")!,
  UNIFIED_DIMENSION_PRESETS.find((p) => p.label === "8x16")!,
  UNIFIED_DIMENSION_PRESETS.find((p) => p.label === "6x8")!,
  UNIFIED_DIMENSION_PRESETS.find((p) => p.label === "16x16")!,
];

// ============================================================================
// Character Count Presets
// ============================================================================

/**
 * A character count preset with examples
 */
export interface CharacterCountPresetWithExamples {
  /** Number of characters */
  count: number;
  /** Display label (e.g., "256") */
  label: string;
  /** Example systems that use this count */
  examples: string[];
  /** Description of the count (e.g., "Full Set") */
  description?: string;
  /** Priority level (higher = stays visible longer). 3 = essential, 2 = important, 1 = normal, 0 = low */
  priority: number;
}

/**
 * Unified character count presets with examples
 * Based on historical character generator ROM specifications.
 * Character counts use per-bank values for multi-bank systems.
 */
export const UNIFIED_CHARACTER_COUNT_PRESETS: CharacterCountPresetWithExamples[] = [
  {
    count: 64,
    label: "64",
    examples: ["Apple II", "TRS-80 CoCo", "Dragon 32", "MC6847"],
    description: "Quarter ROM",
    priority: 2,
  },
  {
    count: 96,
    label: "96",
    examples: ["ZX Spectrum", "BBC Micro Mode 7", "SAA5050"],
    description: "Printable ASCII / Teletext",
    priority: 2,
  },
  {
    count: 128,
    label: "128",
    examples: ["Atari 400/800", "TRS-80 Model I"],
    description: "Half ROM",
    priority: 3,
  },
  {
    count: 213,
    label: "213",
    examples: ["Intellivision GROM"],
    description: "Intellivision",
    priority: 1,
  },
  {
    count: 256,
    label: "256",
    examples: ["C64", "VIC-20", "TI-99/4A", "MSX", "ColecoVision"],
    description: "Full Set",
    priority: 3,
  },
  {
    count: 512,
    label: "512",
    examples: ["Extended ROM"],
    description: "Extended",
    priority: 0,
  },
];

/**
 * Quick character count presets for toolbar buttons
 */
export const QUICK_CHARACTER_COUNT_PRESETS: CharacterCountPresetWithExamples[] =
  UNIFIED_CHARACTER_COUNT_PRESETS;

// ============================================================================
// Character Range Presets (for font import)
// ============================================================================

/**
 * A character range preset for font import
 */
export interface CharacterRangePreset {
  /** Preset name */
  name: string;
  /** Start character code */
  startCode: number;
  /** End character code */
  endCode: number;
  /** Number of characters in the range */
  count: number;
  /** Description of what the range contains */
  description?: string;
}

/**
 * Character range presets for font import
 */
export const CHARACTER_RANGE_PRESETS: CharacterRangePreset[] = [
  {
    name: "Printable ASCII",
    startCode: 32,
    endCode: 126,
    count: 95,
    description: "Space through tilde (~)",
  },
  {
    name: "Extended ASCII",
    startCode: 32,
    endCode: 255,
    count: 224,
    description: "Includes accented characters",
  },
  {
    name: "Uppercase Only",
    startCode: 65,
    endCode: 90,
    count: 26,
    description: "A-Z",
  },
  {
    name: "Lowercase Only",
    startCode: 97,
    endCode: 122,
    count: 26,
    description: "a-z",
  },
  {
    name: "Digits Only",
    startCode: 48,
    endCode: 57,
    count: 10,
    description: "0-9",
  },
  {
    name: "Full 256",
    startCode: 0,
    endCode: 255,
    count: 256,
    description: "All 256 codes with blanks",
  },
];

// ============================================================================
// Anchor Position Presets (for resize)
// ============================================================================

/**
 * Anchor position preset with label
 */
export interface AnchorPositionPreset {
  /** Anchor point code */
  position: AnchorPoint;
  /** Human-readable label */
  label: string;
  /** Short label for grid display */
  shortLabel: string;
}

/**
 * Anchor positions arranged in 3x3 grid order (row by row)
 */
export const ANCHOR_POSITION_PRESETS: AnchorPositionPreset[] = [
  { position: "tl", label: "Top Left", shortLabel: "TL" },
  { position: "tc", label: "Top Center", shortLabel: "TC" },
  { position: "tr", label: "Top Right", shortLabel: "TR" },
  { position: "ml", label: "Middle Left", shortLabel: "ML" },
  { position: "mc", label: "Middle Center", shortLabel: "MC" },
  { position: "mr", label: "Middle Right", shortLabel: "MR" },
  { position: "bl", label: "Bottom Left", shortLabel: "BL" },
  { position: "bc", label: "Bottom Center", shortLabel: "BC" },
  { position: "br", label: "Bottom Right", shortLabel: "BR" },
];

/**
 * Get anchor positions as an array of AnchorPoint values
 */
export function getAnchorPositions(): AnchorPoint[] {
  return ANCHOR_POSITION_PRESETS.map((p) => p.position);
}

/**
 * Get label for an anchor position
 */
export function getAnchorPositionLabel(position: AnchorPoint): string {
  const preset = ANCHOR_POSITION_PRESETS.find((p) => p.position === position);
  return preset?.label ?? position;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find a dimension preset by width and height
 */
export function findDimensionPreset(
  width: number,
  height: number
): DimensionPresetWithExamples | undefined {
  return UNIFIED_DIMENSION_PRESETS.find(
    (p) => p.width === width && p.height === height
  );
}

/**
 * Find a character count preset by count
 */
export function findCharacterCountPreset(
  count: number
): CharacterCountPresetWithExamples | undefined {
  return UNIFIED_CHARACTER_COUNT_PRESETS.find((p) => p.count === count);
}

/**
 * Check if dimensions match a preset
 */
export function isDimensionPreset(width: number, height: number): boolean {
  return UNIFIED_DIMENSION_PRESETS.some(
    (p) => p.width === width && p.height === height
  );
}

/**
 * Check if count matches a preset
 */
export function isCharacterCountPreset(count: number): boolean {
  return UNIFIED_CHARACTER_COUNT_PRESETS.some((p) => p.count === count);
}

/**
 * Get examples string for a dimension preset
 */
export function getDimensionExamplesString(
  width: number,
  height: number
): string {
  const preset = findDimensionPreset(width, height);
  if (!preset || preset.examples.length === 0) return "";
  return preset.examples.join(", ");
}

/**
 * Get examples string for a character count preset
 */
export function getCharacterCountExamplesString(count: number): string {
  const preset = findCharacterCountPreset(count);
  if (!preset || preset.examples.length === 0) return "";
  return preset.examples.join(", ");
}

/**
 * Format dimension preset for display with examples
 */
export function formatDimensionPreset(
  preset: DimensionPresetWithExamples,
  options: { showExamples?: boolean } = {}
): string {
  const { showExamples = true } = options;
  if (showExamples && preset.examples.length > 0) {
    return `${preset.label} (${preset.examples[0]}${preset.examples.length > 1 ? "..." : ""})`;
  }
  return preset.label;
}
