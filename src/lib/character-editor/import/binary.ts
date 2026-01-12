/**
 * Character ROM Editor - Binary Conversion
 *
 * Handles conversion between binary ROM data and Character objects.
 * Supports configurable padding and bit direction.
 */

import {
  Character,
  CharacterSet,
  CharacterSetConfig,
  SerializedCharacterSet,
  bytesPerLine,
  bytesPerCharacter,
  createEmptyCharacter,
} from "../types";

/**
 * Convert a Uint8Array of bytes to a Character object
 *
 * Reverses the encoding from characterToBytes:
 * - MSB first (msb): pixel 0 from leftmost data position
 * - LSB first (lsb): pixel 0 from rightmost data position
 * - Big-endian (big): Byte 0 = pixels 0-7, Byte 1 = pixels 8-15 (default)
 * - Little-endian (little): Byte 0 = pixels 8-15, Byte 1 = pixels 0-7
 *
 * @param bytes - Raw binary data for one character
 * @param config - Character set configuration
 * @returns Character object with pixel data
 */
export function bytesToCharacter(
  bytes: Uint8Array,
  config: CharacterSetConfig
): Character {
  const { width, height, padding, bitDirection, byteOrder = "big" } = config;
  const bpl = bytesPerLine(width);
  const pixels: boolean[][] = [];

  for (let row = 0; row < height; row++) {
    const rowStart = row * bpl;
    const totalBits = bpl * 8;
    const paddingBits = totalBits - width;

    // Get row bytes
    const rowBytes: number[] = [];
    for (let byteIndex = 0; byteIndex < bpl; byteIndex++) {
      rowBytes.push(bytes[rowStart + byteIndex] || 0);
    }

    // Reverse bytes for little-endian (only affects multi-byte rows)
    if (byteOrder === "little" && bpl > 1) {
      rowBytes.reverse();
    }

    // Convert bytes to allBits (allBits[0] = bit 7 of byte 0, etc.)
    const allBits: boolean[] = [];
    for (let byteIndex = 0; byteIndex < bpl; byteIndex++) {
      const byte = rowBytes[byteIndex];
      for (let bit = 0; bit < 8; bit++) {
        allBits.push((byte & (1 << (7 - bit))) !== 0);
      }
    }

    // Extract pixels from allBits
    const rowPixels: boolean[] = [];
    for (let i = 0; i < width; i++) {
      let bitIndex: number;
      if (bitDirection === "msb") {
        // MSB first: pixel 0 at first data position
        bitIndex = (padding === "left" ? paddingBits : 0) + i;
      } else {
        // LSB first: pixel 0 at last data position
        bitIndex = (padding === "left" ? paddingBits : 0) + (width - 1 - i);
      }
      rowPixels.push(allBits[bitIndex]);
    }

    pixels.push(rowPixels);
  }

  return { pixels };
}

/**
 * Convert a Character object back to binary bytes
 *
 * Bit direction affects only the data bits:
 * - MSB first (msb): pixel 0 at leftmost data position
 * - LSB first (lsb): pixel 0 at rightmost data position (pixels reversed)
 *
 * Byte order affects multi-byte rows (width > 8):
 * - Big-endian (big): Byte 0 = pixels 0-7, Byte 1 = pixels 8-15 (default)
 * - Little-endian (little): Byte 0 = pixels 8-15, Byte 1 = pixels 0-7
 *
 * Padding is then added on the specified side.
 *
 * Example for 7-bit data `0001110`:
 * - MSB first, left padding:  `00001110`
 * - MSB first, right padding: `00011100`
 * - LSB first, left padding:  `00111000`
 * - LSB first, right padding: `01110000`
 *
 * @param character - Character with pixel data
 * @param config - Character set configuration
 * @returns Uint8Array of binary data
 */
export function characterToBytes(
  character: Character,
  config: CharacterSetConfig
): Uint8Array {
  const { width, height, padding, bitDirection, byteOrder = "big" } = config;
  const bpl = bytesPerLine(width);
  const bytes = new Uint8Array(height * bpl);

  for (let row = 0; row < height; row++) {
    const totalBits = bpl * 8;
    const paddingBits = totalBits - width;

    // Build the full bit array for this row
    // Index 0 = MSB (bit 7) of first byte, index 7 = LSB (bit 0) of first byte, etc.
    const allBits: boolean[] = new Array(totalBits).fill(false);

    for (let i = 0; i < width; i++) {
      const pixel = character.pixels[row]?.[i] || false;

      // Determine the position in allBits for this pixel
      let bitIndex: number;
      if (bitDirection === "msb") {
        // MSB first: pixel 0 at first data position, pixel (width-1) at last
        bitIndex = (padding === "left" ? paddingBits : 0) + i;
      } else {
        // LSB first: pixel 0 at last data position, pixel (width-1) at first
        bitIndex = (padding === "left" ? paddingBits : 0) + (width - 1 - i);
      }

      allBits[bitIndex] = pixel;
    }

    // Convert allBits to bytes (allBits[0] = bit 7 of byte 0, etc.)
    const rowBytes: number[] = [];
    for (let byteIndex = 0; byteIndex < bpl; byteIndex++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const bitArrayIndex = byteIndex * 8 + bit;
        if (allBits[bitArrayIndex]) {
          byte |= 1 << (7 - bit);
        }
      }
      rowBytes.push(byte);
    }

    // Reverse bytes for little-endian (only affects multi-byte rows)
    if (byteOrder === "little" && bpl > 1) {
      rowBytes.reverse();
    }

    // Write row bytes to output
    for (let byteIndex = 0; byteIndex < bpl; byteIndex++) {
      bytes[row * bpl + byteIndex] = rowBytes[byteIndex];
    }
  }

  return bytes;
}

/**
 * Parse a complete binary ROM into an array of Characters
 *
 * @param data - Complete binary data (ArrayBuffer or Uint8Array)
 * @param config - Character set configuration
 * @returns Array of Character objects
 */
export function parseCharacterRom(
  data: ArrayBuffer | Uint8Array,
  config: CharacterSetConfig
): Character[] {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const charSize = bytesPerCharacter(config);
  const charCount = Math.floor(bytes.length / charSize);
  const characters: Character[] = [];

  for (let i = 0; i < charCount; i++) {
    const charBytes = bytes.slice(i * charSize, (i + 1) * charSize);
    characters.push(bytesToCharacter(charBytes, config));
  }

  return characters;
}

/**
 * Serialize an array of Characters to binary ROM data
 *
 * @param characters - Array of Character objects
 * @param config - Character set configuration
 * @returns Uint8Array of binary data
 */
export function serializeCharacterRom(
  characters: Character[],
  config: CharacterSetConfig
): Uint8Array {
  const charSize = bytesPerCharacter(config);
  const bytes = new Uint8Array(characters.length * charSize);

  for (let i = 0; i < characters.length; i++) {
    const charBytes = characterToBytes(characters[i], config);
    bytes.set(charBytes, i * charSize);
  }

  return bytes;
}

/**
 * Convert binary data to Base64 string
 */
export function binaryToBase64(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to binary data
 */
export function base64ToBinary(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Serialize a CharacterSet to storage format
 */
export function serializeCharacterSet(
  characterSet: CharacterSet
): SerializedCharacterSet {
  const binaryData = serializeCharacterRom(
    characterSet.characters,
    characterSet.config
  );
  return {
    metadata: characterSet.metadata,
    config: characterSet.config,
    binaryData: binaryToBase64(binaryData),
  };
}

/**
 * Deserialize a CharacterSet from storage format
 */
export function deserializeCharacterSet(
  serialized: SerializedCharacterSet
): CharacterSet {
  const binaryData = base64ToBinary(serialized.binaryData);
  const characters = parseCharacterRom(binaryData, serialized.config);
  return {
    metadata: serialized.metadata,
    config: serialized.config,
    characters,
  };
}

/**
 * Convert a character between different configurations
 * Handles resizing and format differences
 */
export function convertCharacter(
  character: Character,
  sourceConfig: CharacterSetConfig,
  targetConfig: CharacterSetConfig,
  anchor: "tl" | "tr" | "bl" | "br" = "tl"
): Character {
  const sourceWidth = sourceConfig.width;
  const sourceHeight = sourceConfig.height;
  const targetWidth = targetConfig.width;
  const targetHeight = targetConfig.height;

  // If dimensions are the same, just return a copy
  if (sourceWidth === targetWidth && sourceHeight === targetHeight) {
    return {
      pixels: character.pixels.map((row) => [...row]),
    };
  }

  // Create new character with target dimensions
  const newChar = createEmptyCharacter(targetWidth, targetHeight);

  // Calculate offsets based on anchor
  let offsetX = 0;
  let offsetY = 0;

  switch (anchor) {
    case "tl":
      offsetX = 0;
      offsetY = 0;
      break;
    case "tr":
      offsetX = targetWidth - sourceWidth;
      offsetY = 0;
      break;
    case "bl":
      offsetX = 0;
      offsetY = targetHeight - sourceHeight;
      break;
    case "br":
      offsetX = targetWidth - sourceWidth;
      offsetY = targetHeight - sourceHeight;
      break;
  }

  // Copy pixels with offset
  for (let row = 0; row < sourceHeight; row++) {
    for (let col = 0; col < sourceWidth; col++) {
      const targetRow = row + offsetY;
      const targetCol = col + offsetX;

      if (
        targetRow >= 0 &&
        targetRow < targetHeight &&
        targetCol >= 0 &&
        targetCol < targetWidth
      ) {
        newChar.pixels[targetRow][targetCol] =
          character.pixels[row]?.[col] || false;
      }
    }
  }

  return newChar;
}

/**
 * Create a downloadable blob from character set
 */
export function createDownloadBlob(
  characters: Character[],
  config: CharacterSetConfig,
  exportConfig?: Partial<CharacterSetConfig>
): Blob {
  const effectiveConfig = { ...config, ...exportConfig };
  const data = serializeCharacterRom(characters, effectiveConfig);
  return new Blob([data.buffer as ArrayBuffer], { type: "application/octet-stream" });
}

/**
 * Trigger a file download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
