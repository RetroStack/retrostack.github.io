/**
 * Character ROM Editor - Sharing Utilities
 *
 * Functions for encoding/decoding character sets into shareable URLs
 */

import { Character, CharacterSetConfig } from "./types";
import { serializeCharacterRom, parseCharacterRom, binaryToBase64, base64ToBinary } from "./binary";

/**
 * Data structure for shared character sets
 */
export interface SharedCharacterSet {
  /** Version of the share format */
  v: number;
  /** Name */
  n: string;
  /** Description */
  d: string;
  /** Config: width, height, padding, bitDirection */
  c: [number, number, string, string];
  /** Binary data as base64 */
  b: string;
}

/**
 * Maximum URL length recommendation
 * URLs over this length may not work in all browsers/platforms
 */
export const MAX_RECOMMENDED_URL_LENGTH = 2000;

/**
 * Maximum URL length (absolute limit)
 */
export const MAX_URL_LENGTH = 8000;

/**
 * Encode a character set for sharing
 */
export function encodeCharacterSet(
  name: string,
  description: string,
  characters: Character[],
  config: CharacterSetConfig
): string {
  const binaryData = serializeCharacterRom(characters, config);
  const base64Data = binaryToBase64(binaryData);

  const shareData: SharedCharacterSet = {
    v: 1,
    n: name,
    d: description,
    c: [config.width, config.height, config.padding, config.bitDirection],
    b: base64Data,
  };

  const json = JSON.stringify(shareData);
  // Use encodeURIComponent to handle special characters
  const encoded = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  ));

  return encoded;
}

/**
 * Decode a shared character set
 */
export function decodeCharacterSet(encoded: string): {
  name: string;
  description: string;
  characters: Character[];
  config: CharacterSetConfig;
} {
  try {
    const json = decodeURIComponent(
      atob(encoded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const shareData: SharedCharacterSet = JSON.parse(json);

    // Validate version
    if (shareData.v !== 1) {
      throw new Error("Unsupported share format version");
    }

    const config: CharacterSetConfig = {
      width: shareData.c[0],
      height: shareData.c[1],
      padding: shareData.c[2] as CharacterSetConfig["padding"],
      bitDirection: shareData.c[3] as CharacterSetConfig["bitDirection"],
    };

    const binaryData = base64ToBinary(shareData.b);
    const characters = parseCharacterRom(binaryData, config);

    return {
      name: shareData.n,
      description: shareData.d,
      characters,
      config,
    };
  } catch (error) {
    throw new Error(`Failed to decode shared character set: ${error}`);
  }
}

/**
 * Create a share URL from encoded data
 */
export function createShareUrl(encoded: string): string {
  // Use hash to avoid server-side processing
  const baseUrl = typeof window !== "undefined"
    ? `${window.location.origin}/tools/character-rom-editor/shared`
    : "/tools/character-rom-editor/shared";

  return `${baseUrl}#${encoded}`;
}

/**
 * Extract encoded data from a share URL
 */
export function extractFromUrl(url: string): string | null {
  try {
    const hashIndex = url.indexOf("#");
    if (hashIndex === -1) return null;
    return url.slice(hashIndex + 1);
  } catch {
    return null;
  }
}

/**
 * Get the hash from the current URL
 */
export function getHashFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  return hash ? hash.slice(1) : null;
}

/**
 * Check if a share URL is within recommended length
 */
export function isUrlWithinRecommendedLength(url: string): boolean {
  return url.length <= MAX_RECOMMENDED_URL_LENGTH;
}

/**
 * Check if a share URL is within absolute maximum length
 */
export function isUrlWithinMaxLength(url: string): boolean {
  return url.length <= MAX_URL_LENGTH;
}

/**
 * Get URL length status
 */
export function getUrlLengthStatus(url: string): "ok" | "warning" | "error" {
  if (url.length <= MAX_RECOMMENDED_URL_LENGTH) return "ok";
  if (url.length <= MAX_URL_LENGTH) return "warning";
  return "error";
}

/**
 * Estimate the URL length for a character set
 */
export function estimateUrlLength(characterCount: number, charWidth: number, charHeight: number): number {
  // Each character needs (width * height) bits, packed into bytes
  const bitsPerChar = charWidth * charHeight;
  const bytesPerChar = Math.ceil(bitsPerChar / 8);
  const totalBytes = characterCount * bytesPerChar;

  // Base64 encoding adds ~33% overhead, JSON/URL encoding adds more
  const base64Length = Math.ceil(totalBytes * 1.37);
  const jsonOverhead = 100; // Rough estimate for JSON wrapper
  const urlOverhead = 100; // Rough estimate for URL structure

  return base64Length + jsonOverhead + urlOverhead;
}

/**
 * Check if a character set can be shared
 */
export function canShare(characterCount: number, charWidth: number, charHeight: number): {
  canShare: boolean;
  estimatedLength: number;
  status: "ok" | "warning" | "error";
  message: string;
} {
  const estimatedLength = estimateUrlLength(characterCount, charWidth, charHeight);

  if (estimatedLength <= MAX_RECOMMENDED_URL_LENGTH) {
    return {
      canShare: true,
      estimatedLength,
      status: "ok",
      message: "Character set can be shared",
    };
  }

  if (estimatedLength <= MAX_URL_LENGTH) {
    return {
      canShare: true,
      estimatedLength,
      status: "warning",
      message: "URL may be too long for some platforms. Consider reducing characters.",
    };
  }

  return {
    canShare: false,
    estimatedLength,
    status: "error",
    message: `Character set is too large to share (${characterCount} characters). Maximum shareable size depends on character dimensions.`,
  };
}
