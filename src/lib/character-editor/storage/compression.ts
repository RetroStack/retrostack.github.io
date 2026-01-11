/**
 * Character ROM Editor - URL Compression Utilities
 *
 * Provides compression/decompression for share URLs using fflate.
 * Uses base64url encoding for URL-safe output.
 */

import { deflateSync, inflateSync } from "fflate";

/**
 * Encode a Uint8Array to base64url string (URL-safe, no padding)
 *
 * Base64url replaces + with -, / with _, and removes = padding.
 * This is safe for use in URL fragments without additional encoding.
 */
export function base64urlEncode(data: Uint8Array): string {
  // Convert Uint8Array to binary string
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }

  // Standard base64 encode, then convert to base64url
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decode a base64url string to Uint8Array
 */
export function base64urlDecode(str: string): Uint8Array {
  // Convert base64url to standard base64
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");

  // Add padding back if needed
  const pad = (4 - (base64.length % 4)) % 4;
  base64 += "=".repeat(pad);

  // Decode base64 to binary string
  const binary = atob(base64);

  // Convert binary string to Uint8Array
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Compress data using DEFLATE algorithm
 *
 * Uses maximum compression level (9) for smallest output.
 */
export function compressData(data: Uint8Array): Uint8Array {
  return deflateSync(data, { level: 9 });
}

/**
 * Decompress DEFLATE-compressed data
 */
export function decompressData(data: Uint8Array): Uint8Array {
  return inflateSync(data);
}
