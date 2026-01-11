/**
 * Character ROM Editor - Sharing Utilities
 *
 * Functions for encoding/decoding character sets into shareable URLs.
 * Uses v2 compressed format with DEFLATE compression and base64url encoding.
 */

import { Character, CharacterSetConfig } from "../types";
import { serializeCharacterRom, parseCharacterRom } from "../import/binary";
import { base64urlEncode, base64urlDecode, compressData, decompressData } from "./compression";

/**
 * Share format version prefix
 */
const SHARE_VERSION_PREFIX = "2:";

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
 * Encode a character set for sharing using v2 compressed format.
 *
 * Binary format before compression:
 * [width:1][height:1][flags:1][name:UTF8\0][desc:UTF8\0][character data]
 *
 * flags byte: bit0=padding(left=1), bit1=bitDir(lsb=1)
 */
export function encodeCharacterSet(
  name: string,
  description: string,
  characters: Character[],
  config: CharacterSetConfig
): string {
  const binaryData = serializeCharacterRom(characters, config);

  // Encode name and description as UTF-8
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(name);
  const descBytes = encoder.encode(description);

  // Build flags byte
  const flags =
    (config.padding === "left" ? 1 : 0) |
    (config.bitDirection === "lsb" ? 2 : 0);

  // Calculate total size: 3 header bytes + name + null + desc + null + data
  const headerSize = 3 + nameBytes.length + 1 + descBytes.length + 1;
  const payload = new Uint8Array(headerSize + binaryData.length);

  // Write header
  let offset = 0;
  payload[offset++] = config.width;
  payload[offset++] = config.height;
  payload[offset++] = flags;

  // Write name + null terminator
  payload.set(nameBytes, offset);
  offset += nameBytes.length;
  payload[offset++] = 0;

  // Write description + null terminator
  payload.set(descBytes, offset);
  offset += descBytes.length;
  payload[offset++] = 0;

  // Write character data
  payload.set(binaryData, offset);

  // Compress and encode
  const compressed = compressData(payload);
  return SHARE_VERSION_PREFIX + base64urlEncode(compressed);
}

/**
 * Decode a shared character set from v2 compressed format.
 */
export function decodeCharacterSet(encoded: string): {
  name: string;
  description: string;
  characters: Character[];
  config: CharacterSetConfig;
} {
  try {
    // Validate version prefix
    if (!encoded.startsWith(SHARE_VERSION_PREFIX)) {
      throw new Error("Invalid share format: missing version prefix");
    }

    // Decode and decompress
    const base64Data = encoded.slice(SHARE_VERSION_PREFIX.length);
    const compressed = base64urlDecode(base64Data);
    const data = decompressData(compressed);

    // Parse header
    const width = data[0];
    const height = data[1];
    const flags = data[2];

    const padding = (flags & 1) ? "left" : "right";
    const bitDirection = (flags & 2) ? "lsb" : "msb";

    // Parse null-terminated strings
    const decoder = new TextDecoder();
    let offset = 3;

    // Find name (null-terminated)
    const nameEnd = data.indexOf(0, offset);
    if (nameEnd === -1) {
      throw new Error("Invalid share format: name not terminated");
    }
    const name = decoder.decode(data.slice(offset, nameEnd));
    offset = nameEnd + 1;

    // Find description (null-terminated)
    const descEnd = data.indexOf(0, offset);
    if (descEnd === -1) {
      throw new Error("Invalid share format: description not terminated");
    }
    const description = decoder.decode(data.slice(offset, descEnd));
    offset = descEnd + 1;

    // Remaining bytes are character data
    const binaryData = data.slice(offset);

    const config: CharacterSetConfig = {
      width,
      height,
      padding: padding as CharacterSetConfig["padding"],
      bitDirection: bitDirection as CharacterSetConfig["bitDirection"],
    };

    const characters = parseCharacterRom(binaryData, config);

    return {
      name,
      description,
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
 * Estimate the URL length for a character set with v2 compressed format.
 *
 * Compression ratio varies based on content:
 * - Sparse data (many empty chars): ~15-25% of original
 * - Mixed data: ~40-50% of original
 * - Dense random data: ~80-100% of original
 *
 * We use a conservative 50% compression ratio for estimates.
 */
export function estimateUrlLength(characterCount: number, charWidth: number, charHeight: number): number {
  // Each character needs (width * height) bits, packed into bytes
  const bitsPerChar = charWidth * charHeight;
  const bytesPerChar = Math.ceil(bitsPerChar / 8);
  const totalBytes = characterCount * bytesPerChar;

  // Header overhead: 3 bytes header + name/desc (estimate ~50 chars average)
  const headerOverhead = 3 + 50;

  // Conservative compression ratio: assume 50% compression
  const compressedBytes = Math.ceil((totalBytes + headerOverhead) * 0.5);

  // Base64url encoding adds ~33% overhead, plus "2:" prefix
  const base64Length = Math.ceil(compressedBytes * 1.34) + 2;

  // URL base path overhead
  const urlOverhead = 50;

  return base64Length + urlOverhead;
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
