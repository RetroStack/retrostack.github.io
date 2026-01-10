/**
 * Character ROM Editor - Binary Conversion Tests
 *
 * Comprehensive tests for binary conversion functions including:
 * - bytesToCharacter / characterToBytes
 * - parseCharacterRom / serializeCharacterRom
 * - binaryToBase64 / base64ToBinary
 * - serializeCharacterSet / deserializeCharacterSet
 */

import {
  bytesToCharacter,
  characterToBytes,
  parseCharacterRom,
  serializeCharacterRom,
  binaryToBase64,
  base64ToBinary,
  serializeCharacterSet,
  deserializeCharacterSet,
  convertCharacter,
  createDownloadBlob,
} from "@/lib/character-editor/import/binary";
import {
  createMockCharacter,
  createMockCharacters,
  createMockConfig,
  createMockMetadata,
  createMockCharacterSet,
  charactersEqual,
  characterArraysEqual,
} from "@/lib/character-editor/__tests__/testUtils";
import type { Character, CharacterSetConfig } from "@/lib/character-editor/types";

// ============================================================================
// bytesToCharacter Tests
// ============================================================================

describe("bytesToCharacter", () => {
  describe("standard 8x8 character with ltr bit direction", () => {
    const config = createMockConfig({ width: 8, height: 8, bitDirection: "ltr", padding: "right" });

    it("converts all zeros to empty character", () => {
      const bytes = new Uint8Array(8).fill(0);
      const character = bytesToCharacter(bytes, config);

      expect(character.pixels.length).toBe(8);
      expect(character.pixels.every((row) => row.every((pixel) => pixel === false))).toBe(true);
    });

    it("converts all ones to filled character", () => {
      const bytes = new Uint8Array(8).fill(0xff);
      const character = bytesToCharacter(bytes, config);

      expect(character.pixels.length).toBe(8);
      expect(character.pixels.every((row) => row.every((pixel) => pixel === true))).toBe(true);
    });

    it("converts alternating pattern correctly with ltr", () => {
      // 0xAA = 10101010 in binary
      const bytes = new Uint8Array(8).fill(0xaa);
      const character = bytesToCharacter(bytes, config);

      // With ltr, bit 7 (MSB) comes first, so 0xAA = [1,0,1,0,1,0,1,0]
      for (let row = 0; row < 8; row++) {
        expect(character.pixels[row]).toEqual([true, false, true, false, true, false, true, false]);
      }
    });

    it("converts 0x55 pattern correctly with ltr", () => {
      // 0x55 = 01010101 in binary
      const bytes = new Uint8Array(8).fill(0x55);
      const character = bytesToCharacter(bytes, config);

      // With ltr, bit 7 (MSB) comes first, so 0x55 = [0,1,0,1,0,1,0,1]
      for (let row = 0; row < 8; row++) {
        expect(character.pixels[row]).toEqual([false, true, false, true, false, true, false, true]);
      }
    });

    it("converts single high bit correctly", () => {
      // 0x80 = 10000000 in binary (MSB set)
      const bytes = new Uint8Array(8).fill(0x80);
      const character = bytesToCharacter(bytes, config);

      for (let row = 0; row < 8; row++) {
        expect(character.pixels[row]).toEqual([true, false, false, false, false, false, false, false]);
      }
    });

    it("converts single low bit correctly", () => {
      // 0x01 = 00000001 in binary (LSB set)
      const bytes = new Uint8Array(8).fill(0x01);
      const character = bytesToCharacter(bytes, config);

      for (let row = 0; row < 8; row++) {
        expect(character.pixels[row]).toEqual([false, false, false, false, false, false, false, true]);
      }
    });
  });

  describe("rtl bit direction", () => {
    const config = createMockConfig({ width: 8, height: 8, bitDirection: "rtl", padding: "right" });

    it("converts alternating pattern with rtl direction", () => {
      // 0xAA = 10101010 in binary
      const bytes = new Uint8Array(8).fill(0xaa);
      const character = bytesToCharacter(bytes, config);

      // With rtl, bit 0 (LSB) comes first, so 0xAA = [0,1,0,1,0,1,0,1]
      for (let row = 0; row < 8; row++) {
        expect(character.pixels[row]).toEqual([false, true, false, true, false, true, false, true]);
      }
    });

    it("converts 0x55 pattern with rtl direction", () => {
      // 0x55 = 01010101 in binary
      const bytes = new Uint8Array(8).fill(0x55);
      const character = bytesToCharacter(bytes, config);

      // With rtl, bit 0 (LSB) comes first, so 0x55 = [1,0,1,0,1,0,1,0]
      for (let row = 0; row < 8; row++) {
        expect(character.pixels[row]).toEqual([true, false, true, false, true, false, true, false]);
      }
    });

    it("converts single high bit with rtl", () => {
      // 0x80 = 10000000 in binary
      const bytes = new Uint8Array(8).fill(0x80);
      const character = bytesToCharacter(bytes, config);

      // With rtl, bit 0 comes first, so 0x80 = [0,0,0,0,0,0,0,1]
      for (let row = 0; row < 8; row++) {
        expect(character.pixels[row]).toEqual([false, false, false, false, false, false, false, true]);
      }
    });
  });

  describe("left padding", () => {
    it("handles 6-bit width with left padding", () => {
      const config = createMockConfig({ width: 6, height: 8, bitDirection: "ltr", padding: "left" });
      // 0xFF = 11111111, with 6-bit width and left padding, take last 6 bits
      const bytes = new Uint8Array(8).fill(0xff);
      const character = bytesToCharacter(bytes, config);

      expect(character.pixels[0].length).toBe(6);
      expect(character.pixels[0].every((p) => p === true)).toBe(true);
    });

    it("handles 5-bit width with left padding correctly", () => {
      const config = createMockConfig({ width: 5, height: 8, bitDirection: "ltr", padding: "left" });
      // 0x1F = 00011111, with left padding skip first 3 bits, take last 5
      const bytes = new Uint8Array(8).fill(0x1f);
      const character = bytesToCharacter(bytes, config);

      expect(character.pixels[0].length).toBe(5);
      // Last 5 bits of 0x1F are all 1s
      expect(character.pixels[0]).toEqual([true, true, true, true, true]);
    });
  });

  describe("right padding", () => {
    it("handles 6-bit width with right padding", () => {
      const config = createMockConfig({ width: 6, height: 8, bitDirection: "ltr", padding: "right" });
      // 0xFC = 11111100, with 6-bit width and right padding, take first 6 bits
      const bytes = new Uint8Array(8).fill(0xfc);
      const character = bytesToCharacter(bytes, config);

      expect(character.pixels[0].length).toBe(6);
      expect(character.pixels[0].every((p) => p === true)).toBe(true);
    });

    it("handles 5-bit width with right padding correctly", () => {
      const config = createMockConfig({ width: 5, height: 8, bitDirection: "ltr", padding: "right" });
      // 0xF8 = 11111000, with right padding take first 5 bits
      const bytes = new Uint8Array(8).fill(0xf8);
      const character = bytesToCharacter(bytes, config);

      expect(character.pixels[0].length).toBe(5);
      expect(character.pixels[0]).toEqual([true, true, true, true, true]);
    });
  });

  describe("various dimensions", () => {
    it("converts 8x16 character correctly", () => {
      const config = createMockConfig({ width: 8, height: 16, bitDirection: "ltr", padding: "right" });
      const bytes = new Uint8Array(16).fill(0xff);
      const character = bytesToCharacter(bytes, config);

      expect(character.pixels.length).toBe(16);
      expect(character.pixels[0].length).toBe(8);
    });

    it("converts 16x8 character correctly (requires 2 bytes per row)", () => {
      const config = createMockConfig({ width: 16, height: 8, bitDirection: "ltr", padding: "right" });
      // 16 bytes total: 2 bytes per row * 8 rows
      const bytes = new Uint8Array(16).fill(0xff);
      const character = bytesToCharacter(bytes, config);

      expect(character.pixels.length).toBe(8);
      expect(character.pixels[0].length).toBe(16);
      expect(character.pixels[0].every((p) => p === true)).toBe(true);
    });

    it("converts 12x10 character correctly", () => {
      const config = createMockConfig({ width: 12, height: 10, bitDirection: "ltr", padding: "right" });
      // 12 bits = 2 bytes per row, 10 rows = 20 bytes
      const bytes = new Uint8Array(20).fill(0xff);
      const character = bytesToCharacter(bytes, config);

      expect(character.pixels.length).toBe(10);
      expect(character.pixels[0].length).toBe(12);
    });

    it("converts 4x4 character correctly", () => {
      const config = createMockConfig({ width: 4, height: 4, bitDirection: "ltr", padding: "right" });
      const bytes = new Uint8Array(4).fill(0xf0); // 11110000
      const character = bytesToCharacter(bytes, config);

      expect(character.pixels.length).toBe(4);
      expect(character.pixels[0].length).toBe(4);
      expect(character.pixels[0]).toEqual([true, true, true, true]);
    });
  });

  describe("edge cases", () => {
    it("handles empty bytes array gracefully", () => {
      const config = createMockConfig({ width: 8, height: 8 });
      const bytes = new Uint8Array(0);
      const character = bytesToCharacter(bytes, config);

      // Should create character with empty rows (filled with false)
      expect(character.pixels.length).toBe(8);
      expect(character.pixels[0].every((p) => p === false)).toBe(true);
    });

    it("handles insufficient bytes gracefully", () => {
      const config = createMockConfig({ width: 8, height: 8 });
      const bytes = new Uint8Array(4).fill(0xff); // Only 4 bytes for 8x8 char
      const character = bytesToCharacter(bytes, config);

      expect(character.pixels.length).toBe(8);
      // First 4 rows should have data
      expect(character.pixels[0].every((p) => p === true)).toBe(true);
      // Last 4 rows should be empty (missing bytes = 0)
      expect(character.pixels[7].every((p) => p === false)).toBe(true);
    });
  });
});

// ============================================================================
// characterToBytes Tests
// ============================================================================

describe("characterToBytes", () => {
  describe("standard 8x8 character with ltr bit direction", () => {
    const config = createMockConfig({ width: 8, height: 8, bitDirection: "ltr", padding: "right" });

    it("converts empty character to all zeros", () => {
      const character = createMockCharacter(8, 8, "empty");
      const bytes = characterToBytes(character, config);

      expect(bytes.length).toBe(8);
      expect(Array.from(bytes).every((b) => b === 0)).toBe(true);
    });

    it("converts filled character to all ones", () => {
      const character = createMockCharacter(8, 8, "filled");
      const bytes = characterToBytes(character, config);

      expect(bytes.length).toBe(8);
      expect(Array.from(bytes).every((b) => b === 0xff)).toBe(true);
    });

    it("converts checkerboard pattern correctly", () => {
      const character = createMockCharacter(8, 8, "checkerboard");
      const bytes = characterToBytes(character, config);

      // Row 0: [T,F,T,F,T,F,T,F] = 0xAA
      expect(bytes[0]).toBe(0xaa);
      // Row 1: [F,T,F,T,F,T,F,T] = 0x55
      expect(bytes[1]).toBe(0x55);
    });

    it("converts diagonal pattern correctly", () => {
      const character = createMockCharacter(8, 8, "diagonal");
      const bytes = characterToBytes(character, config);

      // Row 0: [T,F,F,F,F,F,F,F] = 0x80
      expect(bytes[0]).toBe(0x80);
      // Row 1: [F,T,F,F,F,F,F,F] = 0x40
      expect(bytes[1]).toBe(0x40);
      // Row 7: [F,F,F,F,F,F,F,T] = 0x01
      expect(bytes[7]).toBe(0x01);
    });
  });

  describe("rtl bit direction", () => {
    const config = createMockConfig({ width: 8, height: 8, bitDirection: "rtl", padding: "right" });

    it("converts checkerboard with rtl direction", () => {
      const character = createMockCharacter(8, 8, "checkerboard");
      const bytes = characterToBytes(character, config);

      // Row 0: [T,F,T,F,T,F,T,F] with rtl = 0x55
      expect(bytes[0]).toBe(0x55);
      // Row 1: [F,T,F,T,F,T,F,T] with rtl = 0xAA
      expect(bytes[1]).toBe(0xaa);
    });

    it("converts diagonal with rtl direction", () => {
      const character = createMockCharacter(8, 8, "diagonal");
      const bytes = characterToBytes(character, config);

      // Row 0: [T,F,F,F,F,F,F,F] with rtl = 0x01
      expect(bytes[0]).toBe(0x01);
      // Row 7: [F,F,F,F,F,F,F,T] with rtl = 0x80
      expect(bytes[7]).toBe(0x80);
    });
  });

  describe("padding variations", () => {
    it("handles 6-bit width with right padding", () => {
      const config = createMockConfig({ width: 6, height: 1, bitDirection: "ltr", padding: "right" });
      const character: Character = { pixels: [[true, true, true, true, true, true]] };
      const bytes = characterToBytes(character, config);

      // 6 ones followed by 2 zeros = 11111100 = 0xFC
      expect(bytes[0]).toBe(0xfc);
    });

    it("handles 6-bit width with left padding", () => {
      const config = createMockConfig({ width: 6, height: 1, bitDirection: "ltr", padding: "left" });
      const character: Character = { pixels: [[true, true, true, true, true, true]] };
      const bytes = characterToBytes(character, config);

      // 2 zeros followed by 6 ones = 00111111 = 0x3F
      expect(bytes[0]).toBe(0x3f);
    });

    it("handles 5-bit width with right padding", () => {
      const config = createMockConfig({ width: 5, height: 1, bitDirection: "ltr", padding: "right" });
      const character: Character = { pixels: [[true, false, true, false, true]] };
      const bytes = characterToBytes(character, config);

      // 10101 followed by 000 = 10101000 = 0xA8
      expect(bytes[0]).toBe(0xa8);
    });
  });

  describe("various dimensions", () => {
    it("converts 16x8 character (2 bytes per row)", () => {
      const config = createMockConfig({ width: 16, height: 8, bitDirection: "ltr", padding: "right" });
      const character = createMockCharacter(16, 8, "filled");
      const bytes = characterToBytes(character, config);

      expect(bytes.length).toBe(16);
      expect(Array.from(bytes).every((b) => b === 0xff)).toBe(true);
    });

    it("converts 8x16 character correctly", () => {
      const config = createMockConfig({ width: 8, height: 16, bitDirection: "ltr", padding: "right" });
      const character = createMockCharacter(8, 16, "filled");
      const bytes = characterToBytes(character, config);

      expect(bytes.length).toBe(16);
    });

    it("converts 12x10 character correctly", () => {
      const config = createMockConfig({ width: 12, height: 10, bitDirection: "ltr", padding: "right" });
      const character = createMockCharacter(12, 10, "empty");
      const bytes = characterToBytes(character, config);

      // 12 bits = 2 bytes per row, 10 rows = 20 bytes
      expect(bytes.length).toBe(20);
    });
  });

  describe("edge cases", () => {
    it("handles character with undefined rows", () => {
      const config = createMockConfig({ width: 8, height: 4 });
      const character: Character = { pixels: [] };
      const bytes = characterToBytes(character, config);

      expect(bytes.length).toBe(4);
      expect(Array.from(bytes).every((b) => b === 0)).toBe(true);
    });

    it("handles character with sparse pixel data", () => {
      const config = createMockConfig({ width: 8, height: 2 });
      const character: Character = { pixels: [[true], []] };
      const bytes = characterToBytes(character, config);

      expect(bytes.length).toBe(2);
      // First row has only one pixel set
      expect(bytes[0]).toBe(0x80);
      // Second row is empty
      expect(bytes[1]).toBe(0);
    });
  });
});

// ============================================================================
// Round-trip Tests (bytesToCharacter <-> characterToBytes)
// ============================================================================

describe("bytesToCharacter and characterToBytes round-trip", () => {
  const configs: { name: string; config: CharacterSetConfig }[] = [
    { name: "8x8 ltr right", config: createMockConfig({ width: 8, height: 8, bitDirection: "ltr", padding: "right" }) },
    { name: "8x8 ltr left", config: createMockConfig({ width: 8, height: 8, bitDirection: "ltr", padding: "left" }) },
    { name: "8x8 rtl right", config: createMockConfig({ width: 8, height: 8, bitDirection: "rtl", padding: "right" }) },
    { name: "8x8 rtl left", config: createMockConfig({ width: 8, height: 8, bitDirection: "rtl", padding: "left" }) },
    { name: "6x8 ltr right", config: createMockConfig({ width: 6, height: 8, bitDirection: "ltr", padding: "right" }) },
    { name: "6x8 ltr left", config: createMockConfig({ width: 6, height: 8, bitDirection: "ltr", padding: "left" }) },
    { name: "16x16 ltr right", config: createMockConfig({ width: 16, height: 16, bitDirection: "ltr", padding: "right" }) },
    { name: "8x16 ltr right", config: createMockConfig({ width: 8, height: 16, bitDirection: "ltr", padding: "right" }) },
  ];

  configs.forEach(({ name, config }) => {
    describe(`${name} configuration`, () => {
      it("round-trips empty character", () => {
        const original = createMockCharacter(config.width, config.height, "empty");
        const bytes = characterToBytes(original, config);
        const restored = bytesToCharacter(bytes, config);

        expect(charactersEqual(original, restored)).toBe(true);
      });

      it("round-trips filled character", () => {
        const original = createMockCharacter(config.width, config.height, "filled");
        const bytes = characterToBytes(original, config);
        const restored = bytesToCharacter(bytes, config);

        expect(charactersEqual(original, restored)).toBe(true);
      });

      it("round-trips checkerboard pattern", () => {
        const original = createMockCharacter(config.width, config.height, "checkerboard");
        const bytes = characterToBytes(original, config);
        const restored = bytesToCharacter(bytes, config);

        expect(charactersEqual(original, restored)).toBe(true);
      });

      it("round-trips diagonal pattern", () => {
        const original = createMockCharacter(config.width, config.height, "diagonal");
        const bytes = characterToBytes(original, config);
        const restored = bytesToCharacter(bytes, config);

        expect(charactersEqual(original, restored)).toBe(true);
      });
    });
  });

  it("bytes -> character -> bytes returns original bytes", () => {
    const config = createMockConfig({ width: 8, height: 8, bitDirection: "ltr", padding: "right" });
    const originalBytes = new Uint8Array([0x3c, 0x42, 0x81, 0x81, 0x81, 0x81, 0x42, 0x3c]); // A circle pattern
    const character = bytesToCharacter(originalBytes, config);
    const restoredBytes = characterToBytes(character, config);

    expect(Array.from(restoredBytes)).toEqual(Array.from(originalBytes));
  });
});

// ============================================================================
// parseCharacterRom Tests
// ============================================================================

describe("parseCharacterRom", () => {
  const config = createMockConfig({ width: 8, height: 8, bitDirection: "ltr", padding: "right" });

  it("parses empty ROM data", () => {
    const data = new Uint8Array(0);
    const characters = parseCharacterRom(data, config);

    expect(characters).toEqual([]);
  });

  it("parses single character ROM", () => {
    const data = new Uint8Array(8).fill(0xff);
    const characters = parseCharacterRom(data, config);

    expect(characters.length).toBe(1);
    expect(characters[0].pixels.every((row) => row.every((p) => p === true))).toBe(true);
  });

  it("parses multiple characters", () => {
    const data = new Uint8Array(24);
    data.fill(0xff, 0, 8); // First char: all filled
    data.fill(0x00, 8, 16); // Second char: all empty
    data.fill(0xaa, 16, 24); // Third char: pattern

    const characters = parseCharacterRom(data, config);

    expect(characters.length).toBe(3);
    expect(characters[0].pixels[0].every((p) => p === true)).toBe(true);
    expect(characters[1].pixels[0].every((p) => p === false)).toBe(true);
    expect(characters[2].pixels[0]).toEqual([true, false, true, false, true, false, true, false]);
  });

  it("handles ArrayBuffer input", () => {
    const buffer = new ArrayBuffer(8);
    const view = new Uint8Array(buffer);
    view.fill(0xff);

    const characters = parseCharacterRom(buffer, config);

    expect(characters.length).toBe(1);
    expect(characters[0].pixels[0].every((p) => p === true)).toBe(true);
  });

  it("handles partial character data (truncates)", () => {
    const data = new Uint8Array(12); // 8 bytes for one char + 4 extra bytes
    data.fill(0xff);

    const characters = parseCharacterRom(data, config);

    // Should only parse complete characters
    expect(characters.length).toBe(1);
  });

  it("parses large ROM (256 characters)", () => {
    const data = new Uint8Array(256 * 8);
    for (let i = 0; i < data.length; i++) {
      data[i] = i % 256;
    }

    const characters = parseCharacterRom(data, config);

    expect(characters.length).toBe(256);
  });

  it("parses with 16-bit wide characters", () => {
    const wideConfig = createMockConfig({ width: 16, height: 8, bitDirection: "ltr", padding: "right" });
    const data = new Uint8Array(16).fill(0xff); // One 16x8 character

    const characters = parseCharacterRom(data, wideConfig);

    expect(characters.length).toBe(1);
    expect(characters[0].pixels[0].length).toBe(16);
    expect(characters[0].pixels[0].every((p) => p === true)).toBe(true);
  });
});

// ============================================================================
// serializeCharacterRom Tests
// ============================================================================

describe("serializeCharacterRom", () => {
  const config = createMockConfig({ width: 8, height: 8, bitDirection: "ltr", padding: "right" });

  it("serializes empty character array", () => {
    const characters: Character[] = [];
    const bytes = serializeCharacterRom(characters, config);

    expect(bytes.length).toBe(0);
  });

  it("serializes single character", () => {
    const characters = [createMockCharacter(8, 8, "filled")];
    const bytes = serializeCharacterRom(characters, config);

    expect(bytes.length).toBe(8);
    expect(Array.from(bytes).every((b) => b === 0xff)).toBe(true);
  });

  it("serializes multiple characters", () => {
    const characters = createMockCharacters(4, 8, 8, ["empty", "filled"]);
    const bytes = serializeCharacterRom(characters, config);

    expect(bytes.length).toBe(32); // 4 chars * 8 bytes
  });

  it("serializes large character set (256 characters)", () => {
    const characters = createMockCharacters(256, 8, 8);
    const bytes = serializeCharacterRom(characters, config);

    expect(bytes.length).toBe(2048); // 256 * 8
  });
});

// ============================================================================
// parseCharacterRom <-> serializeCharacterRom Round-trip
// ============================================================================

describe("parseCharacterRom and serializeCharacterRom round-trip", () => {
  const configs = [
    createMockConfig({ width: 8, height: 8, bitDirection: "ltr", padding: "right" }),
    createMockConfig({ width: 8, height: 8, bitDirection: "rtl", padding: "left" }),
    createMockConfig({ width: 6, height: 8, bitDirection: "ltr", padding: "right" }),
    createMockConfig({ width: 16, height: 16, bitDirection: "ltr", padding: "right" }),
  ];

  configs.forEach((config) => {
    it(`round-trips characters with config ${config.width}x${config.height} ${config.bitDirection} ${config.padding}`, () => {
      const original = createMockCharacters(16, config.width, config.height, [
        "empty",
        "filled",
        "checkerboard",
        "diagonal",
      ]);
      const bytes = serializeCharacterRom(original, config);
      const restored = parseCharacterRom(bytes, config);

      expect(characterArraysEqual(original, restored)).toBe(true);
    });
  });

  it("round-trips with raw bytes", () => {
    const config = createMockConfig({ width: 8, height: 8 });
    const originalBytes = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      originalBytes[i] = Math.floor(Math.random() * 256);
    }

    const characters = parseCharacterRom(originalBytes, config);
    const restoredBytes = serializeCharacterRom(characters, config);

    expect(Array.from(restoredBytes)).toEqual(Array.from(originalBytes));
  });
});

// ============================================================================
// binaryToBase64 Tests
// ============================================================================

describe("binaryToBase64", () => {
  it("encodes empty array", () => {
    const data = new Uint8Array(0);
    const base64 = binaryToBase64(data);

    expect(base64).toBe("");
  });

  it("encodes single byte", () => {
    const data = new Uint8Array([65]); // 'A'
    const base64 = binaryToBase64(data);

    expect(base64).toBe("QQ==");
  });

  it("encodes known string", () => {
    // "Hello" in bytes
    const data = new Uint8Array([72, 101, 108, 108, 111]);
    const base64 = binaryToBase64(data);

    expect(base64).toBe("SGVsbG8=");
  });

  it("encodes binary data with all byte values", () => {
    const data = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      data[i] = i;
    }
    const base64 = binaryToBase64(data);

    // Should produce valid base64
    expect(base64).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
  });

  it("encodes zeros correctly", () => {
    const data = new Uint8Array([0, 0, 0]);
    const base64 = binaryToBase64(data);

    expect(base64).toBe("AAAA");
  });

  it("encodes 0xFF bytes correctly", () => {
    const data = new Uint8Array([255, 255, 255]);
    const base64 = binaryToBase64(data);

    expect(base64).toBe("////");
  });
});

// ============================================================================
// base64ToBinary Tests
// ============================================================================

describe("base64ToBinary", () => {
  it("decodes empty string", () => {
    const bytes = base64ToBinary("");

    expect(bytes.length).toBe(0);
  });

  it("decodes single byte", () => {
    const bytes = base64ToBinary("QQ==");

    expect(bytes.length).toBe(1);
    expect(bytes[0]).toBe(65); // 'A'
  });

  it("decodes known string", () => {
    const bytes = base64ToBinary("SGVsbG8=");

    expect(Array.from(bytes)).toEqual([72, 101, 108, 108, 111]); // "Hello"
  });

  it("decodes without padding", () => {
    // "Man" = TWFu (no padding needed)
    const bytes = base64ToBinary("TWFu");

    expect(Array.from(bytes)).toEqual([77, 97, 110]);
  });

  it("decodes with single padding", () => {
    // "Ma" = TWE= (single padding)
    const bytes = base64ToBinary("TWE=");

    expect(Array.from(bytes)).toEqual([77, 97]);
  });

  it("decodes binary data correctly", () => {
    const bytes = base64ToBinary("////");

    expect(Array.from(bytes)).toEqual([255, 255, 255]);
  });

  it("decodes zeros correctly", () => {
    const bytes = base64ToBinary("AAAA");

    expect(Array.from(bytes)).toEqual([0, 0, 0]);
  });

  it("throws on invalid base64", () => {
    expect(() => base64ToBinary("!!!invalid!!!")).toThrow();
  });
});

// ============================================================================
// binaryToBase64 <-> base64ToBinary Round-trip
// ============================================================================

describe("binaryToBase64 and base64ToBinary round-trip", () => {
  it("round-trips empty data", () => {
    const original = new Uint8Array(0);
    const base64 = binaryToBase64(original);
    const restored = base64ToBinary(base64);

    expect(Array.from(restored)).toEqual(Array.from(original));
  });

  it("round-trips single byte", () => {
    const original = new Uint8Array([42]);
    const base64 = binaryToBase64(original);
    const restored = base64ToBinary(base64);

    expect(Array.from(restored)).toEqual(Array.from(original));
  });

  it("round-trips all byte values", () => {
    const original = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      original[i] = i;
    }
    const base64 = binaryToBase64(original);
    const restored = base64ToBinary(base64);

    expect(Array.from(restored)).toEqual(Array.from(original));
  });

  it("round-trips large random data", () => {
    const original = new Uint8Array(1024);
    for (let i = 0; i < original.length; i++) {
      original[i] = Math.floor(Math.random() * 256);
    }
    const base64 = binaryToBase64(original);
    const restored = base64ToBinary(base64);

    expect(Array.from(restored)).toEqual(Array.from(original));
  });

  it("round-trips typical ROM data size (2KB)", () => {
    const original = new Uint8Array(2048);
    for (let i = 0; i < original.length; i++) {
      original[i] = (i * 7) % 256; // Predictable pattern
    }
    const base64 = binaryToBase64(original);
    const restored = base64ToBinary(base64);

    expect(Array.from(restored)).toEqual(Array.from(original));
  });
});

// ============================================================================
// serializeCharacterSet Tests
// ============================================================================

describe("serializeCharacterSet", () => {
  it("serializes empty character set", () => {
    const characterSet = createMockCharacterSet({ characterCount: 0 });
    const serialized = serializeCharacterSet(characterSet);

    expect(serialized.metadata).toEqual(characterSet.metadata);
    expect(serialized.config).toEqual(characterSet.config);
    expect(serialized.binaryData).toBe("");
  });

  it("serializes character set with metadata", () => {
    const metadata = createMockMetadata({
      name: "Test ROM",
      manufacturer: "Commodore",
      system: "C64",
    });
    const characterSet = createMockCharacterSet({
      metadata,
      characterCount: 16,
    });
    const serialized = serializeCharacterSet(characterSet);

    expect(serialized.metadata.name).toBe("Test ROM");
    expect(serialized.metadata.manufacturer).toBe("Commodore");
    expect(serialized.metadata.system).toBe("C64");
  });

  it("serializes config correctly", () => {
    const config = createMockConfig({
      width: 6,
      height: 10,
      bitDirection: "rtl",
      padding: "left",
    });
    const characterSet = createMockCharacterSet({ config, characterCount: 8 });
    const serialized = serializeCharacterSet(characterSet);

    expect(serialized.config).toEqual(config);
  });

  it("produces valid base64 binary data", () => {
    const characterSet = createMockCharacterSet({ characterCount: 32 });
    const serialized = serializeCharacterSet(characterSet);

    expect(serialized.binaryData).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    expect(serialized.binaryData.length).toBeGreaterThan(0);
  });

  it("serializes 256-character set", () => {
    const characterSet = createMockCharacterSet({ characterCount: 256 });
    const serialized = serializeCharacterSet(characterSet);

    // 256 chars * 8 bytes = 2048 bytes, base64 of that is ~2730 chars
    expect(serialized.binaryData.length).toBeGreaterThan(2000);
  });
});

// ============================================================================
// deserializeCharacterSet Tests
// ============================================================================

describe("deserializeCharacterSet", () => {
  it("deserializes empty character set", () => {
    const serialized = {
      metadata: createMockMetadata(),
      config: createMockConfig(),
      binaryData: "",
    };
    const characterSet = deserializeCharacterSet(serialized);

    expect(characterSet.characters).toEqual([]);
    expect(characterSet.metadata).toEqual(serialized.metadata);
    expect(characterSet.config).toEqual(serialized.config);
  });

  it("deserializes character set with characters", () => {
    const config = createMockConfig();
    const characters = createMockCharacters(8, config.width, config.height, ["filled"]);
    const binaryData = binaryToBase64(serializeCharacterRom(characters, config));

    const serialized = {
      metadata: createMockMetadata(),
      config,
      binaryData,
    };
    const characterSet = deserializeCharacterSet(serialized);

    expect(characterSet.characters.length).toBe(8);
    expect(characterSet.characters[0].pixels[0].every((p) => p === true)).toBe(true);
  });

  it("preserves metadata on deserialization", () => {
    const metadata = createMockMetadata({
      name: "Restored ROM",
      manufacturer: "Apple",
      isBuiltIn: true,
    });
    const serialized = {
      metadata,
      config: createMockConfig(),
      binaryData: "",
    };
    const characterSet = deserializeCharacterSet(serialized);

    expect(characterSet.metadata.name).toBe("Restored ROM");
    expect(characterSet.metadata.manufacturer).toBe("Apple");
    expect(characterSet.metadata.isBuiltIn).toBe(true);
  });

  it("preserves config on deserialization", () => {
    const config = createMockConfig({
      width: 12,
      height: 10,
      bitDirection: "rtl",
      padding: "left",
    });
    const serialized = {
      metadata: createMockMetadata(),
      config,
      binaryData: "",
    };
    const characterSet = deserializeCharacterSet(serialized);

    expect(characterSet.config.width).toBe(12);
    expect(characterSet.config.height).toBe(10);
    expect(characterSet.config.bitDirection).toBe("rtl");
    expect(characterSet.config.padding).toBe("left");
  });

  it("throws on invalid base64 data", () => {
    const serialized = {
      metadata: createMockMetadata(),
      config: createMockConfig(),
      binaryData: "!!!not-valid-base64!!!",
    };

    expect(() => deserializeCharacterSet(serialized)).toThrow();
  });
});

// ============================================================================
// serializeCharacterSet <-> deserializeCharacterSet Round-trip
// ============================================================================

describe("serializeCharacterSet and deserializeCharacterSet round-trip", () => {
  it("round-trips empty character set", () => {
    const original = createMockCharacterSet({ characterCount: 0 });
    const serialized = serializeCharacterSet(original);
    const restored = deserializeCharacterSet(serialized);

    expect(restored.metadata).toEqual(original.metadata);
    expect(restored.config).toEqual(original.config);
    expect(restored.characters).toEqual([]);
  });

  it("round-trips character set with single character", () => {
    const original = createMockCharacterSet({
      characterCount: 1,
      characters: [createMockCharacter(8, 8, "checkerboard")],
    });
    const serialized = serializeCharacterSet(original);
    const restored = deserializeCharacterSet(serialized);

    expect(characterArraysEqual(original.characters, restored.characters)).toBe(true);
  });

  it("round-trips full 256-character set", () => {
    const original = createMockCharacterSet({
      characterCount: 256,
      metadata: {
        name: "Full Character Set",
        manufacturer: "Test Corp",
      },
    });
    const serialized = serializeCharacterSet(original);
    const restored = deserializeCharacterSet(serialized);

    expect(restored.characters.length).toBe(256);
    expect(characterArraysEqual(original.characters, restored.characters)).toBe(true);
    expect(restored.metadata.name).toBe("Full Character Set");
  });

  it("round-trips with various patterns", () => {
    const patterns: ("empty" | "filled" | "checkerboard" | "diagonal")[] = [
      "empty",
      "filled",
      "checkerboard",
      "diagonal",
    ];
    const original = createMockCharacterSet({
      characters: createMockCharacters(4, 8, 8, patterns),
    });
    const serialized = serializeCharacterSet(original);
    const restored = deserializeCharacterSet(serialized);

    expect(characterArraysEqual(original.characters, restored.characters)).toBe(true);
  });

  it("round-trips with non-standard dimensions", () => {
    const config = createMockConfig({ width: 6, height: 10 });
    const original = createMockCharacterSet({
      config,
      characterCount: 32,
    });
    const serialized = serializeCharacterSet(original);
    const restored = deserializeCharacterSet(serialized);

    expect(restored.config.width).toBe(6);
    expect(restored.config.height).toBe(10);
    expect(restored.characters.length).toBe(32);
    expect(restored.characters[0].pixels.length).toBe(10);
    expect(restored.characters[0].pixels[0].length).toBe(6);
  });

  it("round-trips with all config variations", () => {
    const configs = [
      createMockConfig({ bitDirection: "ltr", padding: "right" }),
      createMockConfig({ bitDirection: "ltr", padding: "left" }),
      createMockConfig({ bitDirection: "rtl", padding: "right" }),
      createMockConfig({ bitDirection: "rtl", padding: "left" }),
    ];

    configs.forEach((config) => {
      const original = createMockCharacterSet({
        config,
        characterCount: 8,
      });
      const serialized = serializeCharacterSet(original);
      const restored = deserializeCharacterSet(serialized);

      expect(characterArraysEqual(original.characters, restored.characters)).toBe(true);
      expect(restored.config).toEqual(original.config);
    });
  });
});

// ============================================================================
// convertCharacter Tests
// ============================================================================

describe("convertCharacter", () => {
  it("returns copy when dimensions are same", () => {
    const sourceConfig = createMockConfig({ width: 8, height: 8 });
    const targetConfig = createMockConfig({ width: 8, height: 8 });
    const original = createMockCharacter(8, 8, "checkerboard");

    const converted = convertCharacter(original, sourceConfig, targetConfig);

    expect(charactersEqual(original, converted)).toBe(true);
    // Ensure it is a copy, not the same reference
    expect(converted).not.toBe(original);
    expect(converted.pixels).not.toBe(original.pixels);
  });

  it("expands character with top-left anchor", () => {
    const sourceConfig = createMockConfig({ width: 4, height: 4 });
    const targetConfig = createMockConfig({ width: 8, height: 8 });
    const original = createMockCharacter(4, 4, "filled");

    const converted = convertCharacter(original, sourceConfig, targetConfig, "tl");

    expect(converted.pixels.length).toBe(8);
    expect(converted.pixels[0].length).toBe(8);
    // Top-left 4x4 should be filled
    expect(converted.pixels[0][0]).toBe(true);
    expect(converted.pixels[3][3]).toBe(true);
    // Bottom-right should be empty
    expect(converted.pixels[7][7]).toBe(false);
    expect(converted.pixels[4][4]).toBe(false);
  });

  it("expands character with bottom-right anchor", () => {
    const sourceConfig = createMockConfig({ width: 4, height: 4 });
    const targetConfig = createMockConfig({ width: 8, height: 8 });
    const original = createMockCharacter(4, 4, "filled");

    const converted = convertCharacter(original, sourceConfig, targetConfig, "br");

    // Top-left should be empty
    expect(converted.pixels[0][0]).toBe(false);
    expect(converted.pixels[3][3]).toBe(false);
    // Bottom-right 4x4 should be filled
    expect(converted.pixels[4][4]).toBe(true);
    expect(converted.pixels[7][7]).toBe(true);
  });

  it("shrinks character with top-left anchor", () => {
    const sourceConfig = createMockConfig({ width: 8, height: 8 });
    const targetConfig = createMockConfig({ width: 4, height: 4 });
    const original = createMockCharacter(8, 8, "diagonal");

    const converted = convertCharacter(original, sourceConfig, targetConfig, "tl");

    expect(converted.pixels.length).toBe(4);
    expect(converted.pixels[0].length).toBe(4);
    // Should preserve top-left diagonal
    expect(converted.pixels[0][0]).toBe(true);
    expect(converted.pixels[1][1]).toBe(true);
    expect(converted.pixels[2][2]).toBe(true);
    expect(converted.pixels[3][3]).toBe(true);
  });

  it("shrinks character with bottom-right anchor (clips top-left)", () => {
    const sourceConfig = createMockConfig({ width: 8, height: 8 });
    const targetConfig = createMockConfig({ width: 4, height: 4 });
    const original = createMockCharacter(8, 8, "diagonal");

    const converted = convertCharacter(original, sourceConfig, targetConfig, "br");

    expect(converted.pixels.length).toBe(4);
    // Should preserve bottom-right portion of diagonal
    expect(converted.pixels[0][0]).toBe(true); // maps to original[4][4]
    expect(converted.pixels[3][3]).toBe(true); // maps to original[7][7]
  });

  it("handles width-only change", () => {
    const sourceConfig = createMockConfig({ width: 8, height: 8 });
    const targetConfig = createMockConfig({ width: 16, height: 8 });
    const original = createMockCharacter(8, 8, "filled");

    const converted = convertCharacter(original, sourceConfig, targetConfig, "tl");

    expect(converted.pixels.length).toBe(8);
    expect(converted.pixels[0].length).toBe(16);
    // First 8 columns should be filled
    expect(converted.pixels[0].slice(0, 8).every((p) => p === true)).toBe(true);
    // Last 8 columns should be empty
    expect(converted.pixels[0].slice(8).every((p) => p === false)).toBe(true);
  });

  it("handles height-only change", () => {
    const sourceConfig = createMockConfig({ width: 8, height: 8 });
    const targetConfig = createMockConfig({ width: 8, height: 16 });
    const original = createMockCharacter(8, 8, "filled");

    const converted = convertCharacter(original, sourceConfig, targetConfig, "tl");

    expect(converted.pixels.length).toBe(16);
    expect(converted.pixels[0].length).toBe(8);
    // First 8 rows should be filled
    expect(converted.pixels[0].every((p) => p === true)).toBe(true);
    expect(converted.pixels[7].every((p) => p === true)).toBe(true);
    // Last 8 rows should be empty
    expect(converted.pixels[8].every((p) => p === false)).toBe(true);
    expect(converted.pixels[15].every((p) => p === false)).toBe(true);
  });

  it("uses top-left anchor by default", () => {
    const sourceConfig = createMockConfig({ width: 4, height: 4 });
    const targetConfig = createMockConfig({ width: 8, height: 8 });
    const original = createMockCharacter(4, 4, "filled");

    const converted = convertCharacter(original, sourceConfig, targetConfig);

    // Should behave same as explicit "tl" anchor
    expect(converted.pixels[0][0]).toBe(true);
    expect(converted.pixels[7][7]).toBe(false);
  });
});

// ============================================================================
// createDownloadBlob Tests
// ============================================================================

describe("createDownloadBlob", () => {
  it("creates blob with correct type", () => {
    const config = createMockConfig();
    const characters = createMockCharacters(8, config.width, config.height);
    const blob = createDownloadBlob(characters, config);

    expect(blob.type).toBe("application/octet-stream");
  });

  it("creates blob with correct size", () => {
    const config = createMockConfig({ width: 8, height: 8 });
    const characters = createMockCharacters(16, 8, 8);
    const blob = createDownloadBlob(characters, config);

    // 16 chars * 8 bytes per char = 128 bytes
    expect(blob.size).toBe(128);
  });

  it("applies export config overrides", () => {
    const config = createMockConfig({ width: 8, height: 8, bitDirection: "ltr" });
    const exportConfig = { bitDirection: "rtl" as const };
    const characters = [createMockCharacter(8, 8, "checkerboard")];

    const blobLtr = createDownloadBlob(characters, config);
    const blobRtl = createDownloadBlob(characters, config, exportConfig);

    // Blobs should have same size but different content
    expect(blobLtr.size).toBe(blobRtl.size);
  });

  it("creates empty blob for empty characters", () => {
    const config = createMockConfig();
    const characters: Character[] = [];
    const blob = createDownloadBlob(characters, config);

    expect(blob.size).toBe(0);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("binary conversion integration", () => {
  it("complete workflow: create -> serialize -> store -> restore -> edit -> export", () => {
    // 1. Create a character set
    const original = createMockCharacterSet({
      metadata: { name: "Integration Test ROM" },
      characterCount: 64,
    });

    // 2. Serialize for storage
    const serialized = serializeCharacterSet(original);
    expect(typeof serialized.binaryData).toBe("string");

    // 3. Restore from storage
    const restored = deserializeCharacterSet(serialized);
    expect(characterArraysEqual(original.characters, restored.characters)).toBe(true);

    // 4. Modify a character
    restored.characters[0].pixels[0][0] = !restored.characters[0].pixels[0][0];

    // 5. Re-serialize (simulating save)
    const reSerialized = serializeCharacterSet(restored);
    expect(reSerialized.binaryData).not.toBe(serialized.binaryData);

    // 6. Export to binary
    const blob = createDownloadBlob(restored.characters, restored.config);
    expect(blob.size).toBe(64 * 8); // 64 chars * 8 bytes
  });

  it("handles real-world C64 character ROM dimensions", () => {
    // C64 uses 8x8 characters with 256 chars per ROM
    const c64Config = createMockConfig({
      width: 8,
      height: 8,
      bitDirection: "ltr",
      padding: "right",
    });

    const characterSet = createMockCharacterSet({
      config: c64Config,
      characterCount: 256,
      metadata: {
        name: "C64 Character ROM",
        manufacturer: "Commodore",
        system: "C64",
      },
    });

    const serialized = serializeCharacterSet(characterSet);
    const restored = deserializeCharacterSet(serialized);

    expect(restored.characters.length).toBe(256);
    expect(characterArraysEqual(characterSet.characters, restored.characters)).toBe(true);
  });

  it("handles Apple II character ROM dimensions", () => {
    // Apple II uses 7x8 characters (but stored as 8x8 with padding)
    const appleConfig = createMockConfig({
      width: 7,
      height: 8,
      bitDirection: "ltr",
      padding: "right",
    });

    const characterSet = createMockCharacterSet({
      config: appleConfig,
      characterCount: 128,
      metadata: {
        name: "Apple II Character ROM",
        manufacturer: "Apple",
        system: "Apple II",
      },
    });

    const serialized = serializeCharacterSet(characterSet);
    const restored = deserializeCharacterSet(serialized);

    expect(restored.characters.length).toBe(128);
    expect(restored.characters[0].pixels[0].length).toBe(7);
    expect(characterArraysEqual(characterSet.characters, restored.characters)).toBe(true);
  });

  it("handles VIC-20 character ROM dimensions", () => {
    // VIC-20 uses 8x16 for uppercase/graphics characters
    const vicConfig = createMockConfig({
      width: 8,
      height: 16,
      bitDirection: "ltr",
      padding: "right",
    });

    const characterSet = createMockCharacterSet({
      config: vicConfig,
      characterCount: 128,
    });

    const serialized = serializeCharacterSet(characterSet);
    const restored = deserializeCharacterSet(serialized);

    expect(restored.characters.length).toBe(128);
    expect(restored.characters[0].pixels.length).toBe(16);
  });
});
