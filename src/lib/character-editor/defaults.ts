/**
 * Character ROM Editor - Default Character Sets
 *
 * Built-in character sets for classic retro systems.
 * These are representative samples - for authentic ROMs, import the actual binaries.
 */

import { SerializedCharacterSet } from "./types";
import { binaryToBase64 } from "./binary";

/**
 * Generate a simple 8x8 character from a pattern array
 * Each string represents a row, 'X' = on, ' ' or '.' = off
 */
function patternToBytes(pattern: string[]): Uint8Array {
  const bytes = new Uint8Array(8);
  for (let row = 0; row < 8 && row < pattern.length; row++) {
    let byte = 0;
    for (let bit = 0; bit < 8; bit++) {
      const char = pattern[row]?.[bit] || ".";
      if (char === "X" || char === "#" || char === "*") {
        byte |= 1 << (7 - bit);
      }
    }
    bytes[row] = byte;
  }
  return bytes;
}

/**
 * Generate basic ASCII characters (uppercase, numbers, common symbols)
 * This creates a simplified 8x8 font for demonstration
 */
function generateBasicCharset(): Uint8Array {
  // 96 printable ASCII characters (32-127)
  const chars: string[][] = [];

  // Space (32)
  chars.push([
    "........",
    "........",
    "........",
    "........",
    "........",
    "........",
    "........",
    "........",
  ]);

  // ! (33)
  chars.push([
    "...XX...",
    "...XX...",
    "...XX...",
    "...XX...",
    "...XX...",
    "........",
    "...XX...",
    "........",
  ]);

  // " (34)
  chars.push([
    ".XX..XX.",
    ".XX..XX.",
    ".XX..XX.",
    "........",
    "........",
    "........",
    "........",
    "........",
  ]);

  // # (35)
  chars.push([
    ".XX..XX.",
    "XXXXXXXX",
    ".XX..XX.",
    ".XX..XX.",
    "XXXXXXXX",
    ".XX..XX.",
    "........",
    "........",
  ]);

  // $ (36)
  chars.push([
    "...XX...",
    ".XXXXXX.",
    "XX......",
    ".XXXXX..",
    "....XX..",
    "XXXXXX..",
    "...XX...",
    "........",
  ]);

  // % (37)
  chars.push([
    "XX....XX",
    "XX...XX.",
    "....XX..",
    "...XX...",
    "..XX....",
    ".XX...XX",
    "XX....XX",
    "........",
  ]);

  // & (38)
  chars.push([
    "..XXX...",
    ".XX.XX..",
    "..XXX...",
    ".XXX.XX.",
    "XX..XX..",
    "XX..XX..",
    ".XXX.XX.",
    "........",
  ]);

  // ' (39)
  chars.push([
    "...XX...",
    "...XX...",
    "..XX....",
    "........",
    "........",
    "........",
    "........",
    "........",
  ]);

  // ( (40)
  chars.push([
    "....XX..",
    "...XX...",
    "..XX....",
    "..XX....",
    "..XX....",
    "...XX...",
    "....XX..",
    "........",
  ]);

  // ) (41)
  chars.push([
    "..XX....",
    "...XX...",
    "....XX..",
    "....XX..",
    "....XX..",
    "...XX...",
    "..XX....",
    "........",
  ]);

  // * (42)
  chars.push([
    "........",
    "..X..X..",
    "...XX...",
    ".XXXXXX.",
    "...XX...",
    "..X..X..",
    "........",
    "........",
  ]);

  // + (43)
  chars.push([
    "........",
    "...XX...",
    "...XX...",
    ".XXXXXX.",
    "...XX...",
    "...XX...",
    "........",
    "........",
  ]);

  // , (44)
  chars.push([
    "........",
    "........",
    "........",
    "........",
    "........",
    "...XX...",
    "...XX...",
    "..XX....",
  ]);

  // - (45)
  chars.push([
    "........",
    "........",
    "........",
    ".XXXXXX.",
    "........",
    "........",
    "........",
    "........",
  ]);

  // . (46)
  chars.push([
    "........",
    "........",
    "........",
    "........",
    "........",
    "...XX...",
    "...XX...",
    "........",
  ]);

  // / (47)
  chars.push([
    "......XX",
    ".....XX.",
    "....XX..",
    "...XX...",
    "..XX....",
    ".XX.....",
    "XX......",
    "........",
  ]);

  // 0-9 (48-57)
  chars.push([
    ".XXXXX..",
    "XX...XX.",
    "XX..XXX.",
    "XX.X.XX.",
    "XXX..XX.",
    "XX...XX.",
    ".XXXXX..",
    "........",
  ]);
  chars.push([
    "...XX...",
    "..XXX...",
    "...XX...",
    "...XX...",
    "...XX...",
    "...XX...",
    ".XXXXXX.",
    "........",
  ]);
  chars.push([
    ".XXXXX..",
    "XX...XX.",
    ".....XX.",
    "...XXX..",
    "..XX....",
    ".XX.....",
    "XXXXXXX.",
    "........",
  ]);
  chars.push([
    ".XXXXX..",
    "XX...XX.",
    ".....XX.",
    "..XXXX..",
    ".....XX.",
    "XX...XX.",
    ".XXXXX..",
    "........",
  ]);
  chars.push([
    "....XXX.",
    "...XXXX.",
    "..XX.XX.",
    ".XX..XX.",
    "XXXXXXX.",
    ".....XX.",
    ".....XX.",
    "........",
  ]);
  chars.push([
    "XXXXXXX.",
    "XX......",
    "XXXXXX..",
    ".....XX.",
    ".....XX.",
    "XX...XX.",
    ".XXXXX..",
    "........",
  ]);
  chars.push([
    "..XXXX..",
    ".XX.....",
    "XX......",
    "XXXXXX..",
    "XX...XX.",
    "XX...XX.",
    ".XXXXX..",
    "........",
  ]);
  chars.push([
    "XXXXXXX.",
    ".....XX.",
    "....XX..",
    "...XX...",
    "..XX....",
    "..XX....",
    "..XX....",
    "........",
  ]);
  chars.push([
    ".XXXXX..",
    "XX...XX.",
    "XX...XX.",
    ".XXXXX..",
    "XX...XX.",
    "XX...XX.",
    ".XXXXX..",
    "........",
  ]);
  chars.push([
    ".XXXXX..",
    "XX...XX.",
    "XX...XX.",
    ".XXXXXX.",
    ".....XX.",
    "....XX..",
    ".XXXX...",
    "........",
  ]);

  // : (58)
  chars.push([
    "........",
    "...XX...",
    "...XX...",
    "........",
    "...XX...",
    "...XX...",
    "........",
    "........",
  ]);

  // ; (59)
  chars.push([
    "........",
    "...XX...",
    "...XX...",
    "........",
    "...XX...",
    "...XX...",
    "..XX....",
    "........",
  ]);

  // < (60)
  chars.push([
    ".....XX.",
    "....XX..",
    "...XX...",
    "..XX....",
    "...XX...",
    "....XX..",
    ".....XX.",
    "........",
  ]);

  // = (61)
  chars.push([
    "........",
    "........",
    ".XXXXXX.",
    "........",
    ".XXXXXX.",
    "........",
    "........",
    "........",
  ]);

  // > (62)
  chars.push([
    ".XX.....",
    "..XX....",
    "...XX...",
    "....XX..",
    "...XX...",
    "..XX....",
    ".XX.....",
    "........",
  ]);

  // ? (63)
  chars.push([
    ".XXXXX..",
    "XX...XX.",
    ".....XX.",
    "...XXX..",
    "...XX...",
    "........",
    "...XX...",
    "........",
  ]);

  // @ (64)
  chars.push([
    ".XXXXX..",
    "XX...XX.",
    "XX.XXXX.",
    "XX.XXXX.",
    "XX.XXX..",
    "XX......",
    ".XXXXX..",
    "........",
  ]);

  // A-Z (65-90)
  chars.push([
    "..XXX...",
    ".XX.XX..",
    "XX...XX.",
    "XXXXXXX.",
    "XX...XX.",
    "XX...XX.",
    "XX...XX.",
    "........",
  ]);
  chars.push([
    "XXXXXX..",
    "XX...XX.",
    "XX...XX.",
    "XXXXXX..",
    "XX...XX.",
    "XX...XX.",
    "XXXXXX..",
    "........",
  ]);
  chars.push([
    ".XXXXX..",
    "XX...XX.",
    "XX......",
    "XX......",
    "XX......",
    "XX...XX.",
    ".XXXXX..",
    "........",
  ]);
  chars.push([
    "XXXXX...",
    "XX..XX..",
    "XX...XX.",
    "XX...XX.",
    "XX...XX.",
    "XX..XX..",
    "XXXXX...",
    "........",
  ]);
  chars.push([
    "XXXXXXX.",
    "XX......",
    "XX......",
    "XXXXX...",
    "XX......",
    "XX......",
    "XXXXXXX.",
    "........",
  ]);
  chars.push([
    "XXXXXXX.",
    "XX......",
    "XX......",
    "XXXXX...",
    "XX......",
    "XX......",
    "XX......",
    "........",
  ]);
  chars.push([
    ".XXXXX..",
    "XX...XX.",
    "XX......",
    "XX..XXX.",
    "XX...XX.",
    "XX...XX.",
    ".XXXXX..",
    "........",
  ]);
  chars.push([
    "XX...XX.",
    "XX...XX.",
    "XX...XX.",
    "XXXXXXX.",
    "XX...XX.",
    "XX...XX.",
    "XX...XX.",
    "........",
  ]);
  chars.push([
    ".XXXXXX.",
    "...XX...",
    "...XX...",
    "...XX...",
    "...XX...",
    "...XX...",
    ".XXXXXX.",
    "........",
  ]);
  chars.push([
    "...XXXX.",
    ".....XX.",
    ".....XX.",
    ".....XX.",
    "XX...XX.",
    "XX...XX.",
    ".XXXXX..",
    "........",
  ]);
  chars.push([
    "XX...XX.",
    "XX..XX..",
    "XX.XX...",
    "XXXX....",
    "XX.XX...",
    "XX..XX..",
    "XX...XX.",
    "........",
  ]);
  chars.push([
    "XX......",
    "XX......",
    "XX......",
    "XX......",
    "XX......",
    "XX......",
    "XXXXXXX.",
    "........",
  ]);
  chars.push([
    "XX...XX.",
    "XXX.XXX.",
    "XXXXXXX.",
    "XX.X.XX.",
    "XX...XX.",
    "XX...XX.",
    "XX...XX.",
    "........",
  ]);
  chars.push([
    "XX...XX.",
    "XXX..XX.",
    "XXXX.XX.",
    "XX.XXXX.",
    "XX..XXX.",
    "XX...XX.",
    "XX...XX.",
    "........",
  ]);
  chars.push([
    ".XXXXX..",
    "XX...XX.",
    "XX...XX.",
    "XX...XX.",
    "XX...XX.",
    "XX...XX.",
    ".XXXXX..",
    "........",
  ]);
  chars.push([
    "XXXXXX..",
    "XX...XX.",
    "XX...XX.",
    "XXXXXX..",
    "XX......",
    "XX......",
    "XX......",
    "........",
  ]);
  chars.push([
    ".XXXXX..",
    "XX...XX.",
    "XX...XX.",
    "XX...XX.",
    "XX.X.XX.",
    "XX..XX..",
    ".XXX.XX.",
    "........",
  ]);
  chars.push([
    "XXXXXX..",
    "XX...XX.",
    "XX...XX.",
    "XXXXXX..",
    "XX.XX...",
    "XX..XX..",
    "XX...XX.",
    "........",
  ]);
  chars.push([
    ".XXXXX..",
    "XX...XX.",
    "XX......",
    ".XXXXX..",
    ".....XX.",
    "XX...XX.",
    ".XXXXX..",
    "........",
  ]);
  chars.push([
    "XXXXXXX.",
    "...XX...",
    "...XX...",
    "...XX...",
    "...XX...",
    "...XX...",
    "...XX...",
    "........",
  ]);
  chars.push([
    "XX...XX.",
    "XX...XX.",
    "XX...XX.",
    "XX...XX.",
    "XX...XX.",
    "XX...XX.",
    ".XXXXX..",
    "........",
  ]);
  chars.push([
    "XX...XX.",
    "XX...XX.",
    "XX...XX.",
    "XX...XX.",
    ".XX.XX..",
    "..XXX...",
    "...X....",
    "........",
  ]);
  chars.push([
    "XX...XX.",
    "XX...XX.",
    "XX...XX.",
    "XX.X.XX.",
    "XXXXXXX.",
    "XXX.XXX.",
    "XX...XX.",
    "........",
  ]);
  chars.push([
    "XX...XX.",
    ".XX.XX..",
    "..XXX...",
    "...X....",
    "..XXX...",
    ".XX.XX..",
    "XX...XX.",
    "........",
  ]);
  chars.push([
    "XX...XX.",
    ".XX.XX..",
    "..XXX...",
    "...XX...",
    "...XX...",
    "...XX...",
    "...XX...",
    "........",
  ]);
  chars.push([
    "XXXXXXX.",
    ".....XX.",
    "....XX..",
    "...XX...",
    "..XX....",
    ".XX.....",
    "XXXXXXX.",
    "........",
  ]);

  // [ (91)
  chars.push([
    "..XXXX..",
    "..XX....",
    "..XX....",
    "..XX....",
    "..XX....",
    "..XX....",
    "..XXXX..",
    "........",
  ]);

  // \ (92)
  chars.push([
    "XX......",
    ".XX.....",
    "..XX....",
    "...XX...",
    "....XX..",
    ".....XX.",
    "......XX",
    "........",
  ]);

  // ] (93)
  chars.push([
    "..XXXX..",
    "....XX..",
    "....XX..",
    "....XX..",
    "....XX..",
    "....XX..",
    "..XXXX..",
    "........",
  ]);

  // ^ (94)
  chars.push([
    "...X....",
    "..XXX...",
    ".XX.XX..",
    "XX...XX.",
    "........",
    "........",
    "........",
    "........",
  ]);

  // _ (95)
  chars.push([
    "........",
    "........",
    "........",
    "........",
    "........",
    "........",
    "XXXXXXXX",
    "........",
  ]);

  // Convert all patterns to bytes
  const totalBytes = chars.length * 8;
  const result = new Uint8Array(totalBytes);

  for (let i = 0; i < chars.length; i++) {
    const charBytes = patternToBytes(chars[i]);
    result.set(charBytes, i * 8);
  }

  return result;
}

/**
 * Create the default C64 character set
 */
function createC64CharacterSet(): SerializedCharacterSet {
  const now = Date.now();
  return {
    metadata: {
      id: "c64-uppercase",
      name: "C64 Uppercase",
      description:
        "Commodore 64 uppercase character set (representative sample)",
      source: "RetroStack",
      manufacturer: "Commodore",
      system: "C64",
      locale: "English",
      createdAt: now,
      updatedAt: now,
      isBuiltIn: true,
    },
    config: {
      width: 8,
      height: 8,
      padding: "right",
      bitDirection: "ltr",
    },
    binaryData: binaryToBase64(generateBasicCharset()),
  };
}

/**
 * Create the Apple II character set
 */
function createAppleIICharacterSet(): SerializedCharacterSet {
  const now = Date.now();
  return {
    metadata: {
      id: "apple2-charset",
      name: "Apple II",
      description: "Apple II character set (representative sample)",
      source: "RetroStack",
      manufacturer: "Apple",
      system: "Apple II",
      locale: "English",
      createdAt: now,
      updatedAt: now,
      isBuiltIn: true,
    },
    config: {
      width: 8,
      height: 8,
      padding: "right",
      bitDirection: "ltr",
    },
    binaryData: binaryToBase64(generateBasicCharset()),
  };
}

/**
 * Create the ZX Spectrum character set
 */
function createZXSpectrumCharacterSet(): SerializedCharacterSet {
  const now = Date.now();
  return {
    metadata: {
      id: "zx-spectrum-charset",
      name: "ZX Spectrum",
      description: "ZX Spectrum character set (representative sample)",
      source: "RetroStack",
      manufacturer: "Sinclair",
      system: "ZX Spectrum",
      locale: "English",
      createdAt: now,
      updatedAt: now,
      isBuiltIn: true,
    },
    config: {
      width: 8,
      height: 8,
      padding: "right",
      bitDirection: "ltr",
    },
    binaryData: binaryToBase64(generateBasicCharset()),
  };
}

/**
 * Create the IBM PC CGA character set
 */
function createIBMCGACharacterSet(): SerializedCharacterSet {
  const now = Date.now();
  return {
    metadata: {
      id: "ibm-cga-charset",
      name: "IBM PC CGA",
      description: "IBM PC CGA 8x8 character set (representative sample)",
      source: "RetroStack",
      manufacturer: "IBM",
      system: "PC CGA",
      locale: "English",
      createdAt: now,
      updatedAt: now,
      isBuiltIn: true,
    },
    config: {
      width: 8,
      height: 8,
      padding: "right",
      bitDirection: "ltr",
    },
    binaryData: binaryToBase64(generateBasicCharset()),
  };
}

/**
 * Get all default character sets
 */
export function getDefaultCharacterSets(): SerializedCharacterSet[] {
  return [
    createC64CharacterSet(),
    createAppleIICharacterSet(),
    createZXSpectrumCharacterSet(),
    createIBMCGACharacterSet(),
  ];
}

/**
 * Check if a character set is a built-in default
 */
export function isBuiltInCharacterSet(id: string): boolean {
  const builtInIds = [
    "c64-uppercase",
    "apple2-charset",
    "zx-spectrum-charset",
    "ibm-cga-charset",
  ];
  return builtInIds.includes(id);
}
