/**
 * Character ROM Editor - Text/Code Import
 *
 * Parses byte values from pasted text (C/C++, JavaScript, Assembly, etc.)
 * Supports hex (0x00, $00), decimal, and binary (0b00000000) formats.
 */

import {
  Character,
  CharacterSetConfig,
  createDefaultConfig,
} from "../types";
import { parseCharacterRom } from "./binary";

/**
 * Text import options
 */
export interface TextImportOptions {
  charWidth: number;
  charHeight: number;
  padding: "left" | "right";
  bitDirection: "msb" | "lsb";
}

/**
 * Detected format of the parsed text
 */
export type DetectedFormat = "hex" | "decimal" | "binary" | "mixed";

/**
 * Result of parsing text to bytes
 */
export interface TextParseResult {
  /** Parsed byte values */
  bytes: Uint8Array;
  /** Parsed characters */
  characters: Character[];
  /** Configuration used for parsing */
  config: CharacterSetConfig;
  /** Detected number format */
  detectedFormat: DetectedFormat;
  /** Number of invalid values found (out of range) */
  invalidCount: number;
  /** Error message if parsing failed completely */
  error?: string;
}

/**
 * Get default text import options
 */
export function getDefaultTextImportOptions(): TextImportOptions {
  return {
    charWidth: 8,
    charHeight: 8,
    padding: "right",
    bitDirection: "msb",
  };
}

/**
 * Parse a single byte token and return its value
 * Returns null if the token is not a valid byte value
 */
function parseByteToken(token: string): number | null {
  let value: number;

  if (token.startsWith("0x") || token.startsWith("0X")) {
    // Hex with 0x prefix
    value = parseInt(token.slice(2), 16);
  } else if (token.startsWith("$")) {
    // Assembly-style hex with $ prefix
    value = parseInt(token.slice(1), 16);
  } else if (token.startsWith("0b") || token.startsWith("0B")) {
    // Binary with 0b prefix
    value = parseInt(token.slice(2), 2);
  } else {
    // Decimal
    value = parseInt(token, 10);
  }

  // Validate byte range (0-255)
  if (isNaN(value) || value < 0 || value > 255) {
    return null;
  }

  return value;
}

/**
 * Detect the format of a token
 */
function detectTokenFormat(token: string): DetectedFormat | null {
  if (token.startsWith("0x") || token.startsWith("0X") || token.startsWith("$")) {
    return "hex";
  } else if (token.startsWith("0b") || token.startsWith("0B")) {
    return "binary";
  } else if (/^\d+$/.test(token)) {
    return "decimal";
  }
  return null;
}

/**
 * Parse text input to extract byte values
 * Supports multiple formats: hex (0x00, $00), decimal, binary (0b00000000)
 */
export function parseTextToBytes(text: string): {
  bytes: number[];
  format: DetectedFormat;
  invalidCount: number;
  error?: string;
} {
  if (!text.trim()) {
    return {
      bytes: [],
      format: "hex",
      invalidCount: 0,
      error: "No input provided",
    };
  }

  // Match all potential byte values
  // - 0x followed by 1-2 hex digits
  // - $ followed by 1-2 hex digits
  // - 0b followed by 1-8 binary digits
  // - standalone decimal numbers (1-3 digits)
  const tokenPattern = /0x[0-9a-fA-F]{1,2}|\$[0-9a-fA-F]{1,2}|0b[01]{1,8}|\b\d{1,3}\b/g;

  const matches = text.match(tokenPattern);

  if (!matches || matches.length === 0) {
    return {
      bytes: [],
      format: "hex",
      invalidCount: 0,
      error: "No valid byte values found in input",
    };
  }

  const bytes: number[] = [];
  let invalidCount = 0;
  const formatCounts: Record<DetectedFormat, number> = {
    hex: 0,
    decimal: 0,
    binary: 0,
    mixed: 0,
  };

  for (const match of matches) {
    const value = parseByteToken(match);
    const format = detectTokenFormat(match);

    if (value !== null) {
      bytes.push(value);
      if (format) {
        formatCounts[format]++;
      }
    } else {
      invalidCount++;
    }
  }

  if (bytes.length === 0) {
    return {
      bytes: [],
      format: "hex",
      invalidCount,
      error: "No valid byte values found (all values were out of range 0-255)",
    };
  }

  // Determine dominant format
  let detectedFormat: DetectedFormat = "hex";
  const totalValid = formatCounts.hex + formatCounts.decimal + formatCounts.binary;

  if (formatCounts.hex > 0 && formatCounts.decimal === 0 && formatCounts.binary === 0) {
    detectedFormat = "hex";
  } else if (formatCounts.decimal > 0 && formatCounts.hex === 0 && formatCounts.binary === 0) {
    detectedFormat = "decimal";
  } else if (formatCounts.binary > 0 && formatCounts.hex === 0 && formatCounts.decimal === 0) {
    detectedFormat = "binary";
  } else if (totalValid > 0) {
    detectedFormat = "mixed";
  }

  return {
    bytes,
    format: detectedFormat,
    invalidCount,
  };
}

/**
 * Parse text input and convert to characters
 */
export function parseTextToCharacters(
  text: string,
  options: TextImportOptions
): TextParseResult {
  const parseResult = parseTextToBytes(text);

  if (parseResult.error || parseResult.bytes.length === 0) {
    return {
      bytes: new Uint8Array(0),
      characters: [],
      config: createDefaultConfig(),
      detectedFormat: parseResult.format,
      invalidCount: parseResult.invalidCount,
      error: parseResult.error,
    };
  }

  const bytes = new Uint8Array(parseResult.bytes);
  const config: CharacterSetConfig = {
    width: options.charWidth,
    height: options.charHeight,
    padding: options.padding,
    bitDirection: options.bitDirection,
  };

  const characters = parseCharacterRom(bytes, config);

  return {
    bytes,
    characters,
    config,
    detectedFormat: parseResult.format,
    invalidCount: parseResult.invalidCount,
  };
}

/**
 * Get a summary string for the parse result
 */
export function getParseResultSummary(result: TextParseResult): string {
  if (result.error) {
    return result.error;
  }

  const formatNames: Record<DetectedFormat, string> = {
    hex: "hexadecimal",
    decimal: "decimal",
    binary: "binary",
    mixed: "mixed formats",
  };

  let summary = `${result.bytes.length} bytes detected (${formatNames[result.detectedFormat]})`;

  if (result.characters.length > 0) {
    summary += ` → ${result.characters.length} character${result.characters.length !== 1 ? "s" : ""}`;
  }

  if (result.invalidCount > 0) {
    summary += ` (${result.invalidCount} invalid value${result.invalidCount !== 1 ? "s" : ""} skipped)`;
  }

  return summary;
}
