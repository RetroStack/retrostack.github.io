/**
 * Character ROM Editor - Types and Utility Functions Tests
 *
 * Tests for the core type utility functions including byte calculations,
 * character creation, cloning, and ID generation.
 */

import {
  bytesPerLine,
  bytesPerCharacter,
  getCharacterCount,
  createEmptyCharacter,
  cloneCharacter,
  createDefaultConfig,
  generateId,
  type CharacterSetConfig,
  type SerializedCharacterSet,
  type Character,
} from "@/lib/character-editor/types";
import {
  createMockSerializedCharacterSet,
  createMockConfig,
  createMockCharacter,
} from "./testUtils";

// ============================================================================
// bytesPerLine
// ============================================================================

describe("bytesPerLine", () => {
  describe("standard byte-aligned widths", () => {
    it("returns 1 byte for width of 8", () => {
      expect(bytesPerLine(8)).toBe(1);
    });

    it("returns 2 bytes for width of 16", () => {
      expect(bytesPerLine(16)).toBe(2);
    });

    it("returns 3 bytes for width of 24", () => {
      expect(bytesPerLine(24)).toBe(3);
    });
  });

  describe("non-byte-aligned widths (requires padding)", () => {
    it("returns 1 byte for width less than 8", () => {
      expect(bytesPerLine(1)).toBe(1);
      expect(bytesPerLine(4)).toBe(1);
      expect(bytesPerLine(7)).toBe(1);
    });

    it("returns 2 bytes for widths between 9 and 16", () => {
      expect(bytesPerLine(9)).toBe(2);
      expect(bytesPerLine(12)).toBe(2);
      expect(bytesPerLine(15)).toBe(2);
    });

    it("returns 2 bytes for width of 12 (common non-standard width)", () => {
      // This is a common width for some character ROMs
      expect(bytesPerLine(12)).toBe(2);
    });

    it("returns 2 bytes for width of 10 (another common non-standard width)", () => {
      expect(bytesPerLine(10)).toBe(2);
    });
  });

  describe("edge cases", () => {
    it("returns 1 byte for minimum width of 1", () => {
      expect(bytesPerLine(1)).toBe(1);
    });

    it("handles width of 0 gracefully", () => {
      expect(bytesPerLine(0)).toBe(0);
    });

    it("handles very large widths", () => {
      expect(bytesPerLine(32)).toBe(4);
      expect(bytesPerLine(64)).toBe(8);
      expect(bytesPerLine(100)).toBe(13);
    });
  });
});

// ============================================================================
// bytesPerCharacter
// ============================================================================

describe("bytesPerCharacter", () => {
  describe("standard 8x8 characters", () => {
    it("returns 8 bytes for 8x8 character with right padding", () => {
      const config: CharacterSetConfig = {
        width: 8,
        height: 8,
        padding: "right",
        bitDirection: "msb",
      };
      expect(bytesPerCharacter(config)).toBe(8);
    });

    it("returns 8 bytes for 8x8 character with left padding", () => {
      const config: CharacterSetConfig = {
        width: 8,
        height: 8,
        padding: "left",
        bitDirection: "msb",
      };
      expect(bytesPerCharacter(config)).toBe(8);
    });

    it("returns 8 bytes for 8x8 character with lsb bit direction", () => {
      const config: CharacterSetConfig = {
        width: 8,
        height: 8,
        padding: "right",
        bitDirection: "lsb",
      };
      expect(bytesPerCharacter(config)).toBe(8);
    });
  });

  describe("tall characters (8x16)", () => {
    it("returns 16 bytes for 8x16 character", () => {
      const config: CharacterSetConfig = {
        width: 8,
        height: 16,
        padding: "right",
        bitDirection: "msb",
      };
      expect(bytesPerCharacter(config)).toBe(16);
    });
  });

  describe("wide characters (16x8)", () => {
    it("returns 16 bytes for 16x8 character", () => {
      const config: CharacterSetConfig = {
        width: 16,
        height: 8,
        padding: "right",
        bitDirection: "msb",
      };
      expect(bytesPerCharacter(config)).toBe(16);
    });
  });

  describe("large characters (16x16)", () => {
    it("returns 32 bytes for 16x16 character", () => {
      const config: CharacterSetConfig = {
        width: 16,
        height: 16,
        padding: "right",
        bitDirection: "msb",
      };
      expect(bytesPerCharacter(config)).toBe(32);
    });
  });

  describe("non-standard dimensions", () => {
    it("returns correct bytes for 12x10 character (2 bytes per line * 10 lines = 20)", () => {
      const config: CharacterSetConfig = {
        width: 12,
        height: 10,
        padding: "right",
        bitDirection: "msb",
      };
      expect(bytesPerCharacter(config)).toBe(20);
    });

    it("returns correct bytes for 7x8 character (Apple II style)", () => {
      const config: CharacterSetConfig = {
        width: 7,
        height: 8,
        padding: "right",
        bitDirection: "msb",
      };
      // 7 bits needs 1 byte per line, 8 lines = 8 bytes
      expect(bytesPerCharacter(config)).toBe(8);
    });

    it("returns correct bytes for 5x7 character", () => {
      const config: CharacterSetConfig = {
        width: 5,
        height: 7,
        padding: "right",
        bitDirection: "msb",
      };
      expect(bytesPerCharacter(config)).toBe(7);
    });
  });

  describe("edge cases", () => {
    it("returns 1 byte for 1x1 character", () => {
      const config: CharacterSetConfig = {
        width: 1,
        height: 1,
        padding: "right",
        bitDirection: "msb",
      };
      expect(bytesPerCharacter(config)).toBe(1);
    });

    it("handles zero width gracefully", () => {
      const config: CharacterSetConfig = {
        width: 0,
        height: 8,
        padding: "right",
        bitDirection: "msb",
      };
      expect(bytesPerCharacter(config)).toBe(0);
    });

    it("handles zero height gracefully", () => {
      const config: CharacterSetConfig = {
        width: 8,
        height: 0,
        padding: "right",
        bitDirection: "msb",
      };
      expect(bytesPerCharacter(config)).toBe(0);
    });
  });
});

// ============================================================================
// getCharacterCount
// ============================================================================

describe("getCharacterCount", () => {
  describe("standard character counts", () => {
    it("returns correct count for 256-character set (8x8)", () => {
      const serialized = createMockSerializedCharacterSet({
        config: { width: 8, height: 8 },
        characterCount: 256,
      });
      expect(getCharacterCount(serialized)).toBe(256);
    });

    it("returns correct count for 128-character set (8x8)", () => {
      const serialized = createMockSerializedCharacterSet({
        config: { width: 8, height: 8 },
        characterCount: 128,
      });
      expect(getCharacterCount(serialized)).toBe(128);
    });

    it("returns correct count for 64-character set", () => {
      const serialized = createMockSerializedCharacterSet({
        config: { width: 8, height: 8 },
        characterCount: 64,
      });
      expect(getCharacterCount(serialized)).toBe(64);
    });
  });

  describe("non-standard configurations", () => {
    it("returns correct count for 8x16 character set", () => {
      const serialized = createMockSerializedCharacterSet({
        config: { width: 8, height: 16 },
        characterCount: 128,
      });
      expect(getCharacterCount(serialized)).toBe(128);
    });

    it("returns correct count for 16x16 character set", () => {
      const serialized = createMockSerializedCharacterSet({
        config: { width: 16, height: 16 },
        characterCount: 64,
      });
      expect(getCharacterCount(serialized)).toBe(64);
    });
  });

  describe("base64 padding handling", () => {
    it("correctly calculates count when base64 has no padding", () => {
      // Create a set where binary length is divisible by 3
      const serialized = createMockSerializedCharacterSet({
        config: { width: 8, height: 8 },
        characterCount: 3, // 3 * 8 bytes = 24 bytes (divisible by 3)
      });
      expect(getCharacterCount(serialized)).toBe(3);
    });

    it("correctly calculates count when base64 has single padding (=)", () => {
      // Binary length % 3 === 2 results in single padding
      const serialized = createMockSerializedCharacterSet({
        config: { width: 8, height: 8 },
        characterCount: 2, // 2 * 8 bytes = 16 bytes (16 % 3 === 1)
      });
      expect(getCharacterCount(serialized)).toBe(2);
    });

    it("correctly calculates count when base64 has double padding (==)", () => {
      // Binary length % 3 === 1 results in double padding
      const serialized = createMockSerializedCharacterSet({
        config: { width: 8, height: 8 },
        characterCount: 1, // 1 * 8 bytes = 8 bytes (8 % 3 === 2)
      });
      expect(getCharacterCount(serialized)).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("returns 0 for empty binary data", () => {
      const serialized: SerializedCharacterSet = {
        metadata: {
          id: "test",
          name: "Empty",
          description: "",
          source: "test",
          manufacturer: "",
          system: "",
          chip: "",
          locale: "",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isBuiltIn: false,
        },
        config: {
          width: 8,
          height: 8,
          padding: "right",
          bitDirection: "msb",
        },
        binaryData: "", // Empty base64
      };
      expect(getCharacterCount(serialized)).toBe(0);
    });

    it("returns 0 when bytes per character is 0", () => {
      const serialized: SerializedCharacterSet = {
        metadata: {
          id: "test",
          name: "Zero Width",
          description: "",
          source: "test",
          manufacturer: "",
          system: "",
          chip: "",
          locale: "",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isBuiltIn: false,
        },
        config: {
          width: 0,
          height: 8,
          padding: "right",
          bitDirection: "msb",
        },
        binaryData: "AAAA",
      };
      expect(getCharacterCount(serialized)).toBe(0);
    });
  });
});

// ============================================================================
// createEmptyCharacter
// ============================================================================

describe("createEmptyCharacter", () => {
  describe("standard dimensions", () => {
    it("creates 8x8 character with all pixels false", () => {
      const char = createEmptyCharacter(8, 8);

      expect(char.pixels).toHaveLength(8);
      expect(char.pixels[0]).toHaveLength(8);

      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          expect(char.pixels[row][col]).toBe(false);
        }
      }
    });

    it("creates 8x16 character with correct dimensions", () => {
      const char = createEmptyCharacter(8, 16);

      expect(char.pixels).toHaveLength(16);
      expect(char.pixels[0]).toHaveLength(8);

      for (let row = 0; row < 16; row++) {
        for (let col = 0; col < 8; col++) {
          expect(char.pixels[row][col]).toBe(false);
        }
      }
    });

    it("creates 16x16 character with correct dimensions", () => {
      const char = createEmptyCharacter(16, 16);

      expect(char.pixels).toHaveLength(16);
      expect(char.pixels[0]).toHaveLength(16);
    });
  });

  describe("non-standard dimensions", () => {
    it("creates 7x8 character (Apple II style)", () => {
      const char = createEmptyCharacter(7, 8);

      expect(char.pixels).toHaveLength(8);
      expect(char.pixels[0]).toHaveLength(7);
    });

    it("creates 12x10 character", () => {
      const char = createEmptyCharacter(12, 10);

      expect(char.pixels).toHaveLength(10);
      expect(char.pixels[0]).toHaveLength(12);
    });

    it("creates asymmetric character (5x12)", () => {
      const char = createEmptyCharacter(5, 12);

      expect(char.pixels).toHaveLength(12);
      expect(char.pixels[0]).toHaveLength(5);
    });
  });

  describe("edge cases", () => {
    it("creates 1x1 character", () => {
      const char = createEmptyCharacter(1, 1);

      expect(char.pixels).toHaveLength(1);
      expect(char.pixels[0]).toHaveLength(1);
      expect(char.pixels[0][0]).toBe(false);
    });

    it("creates character with very large dimensions", () => {
      const char = createEmptyCharacter(32, 32);

      expect(char.pixels).toHaveLength(32);
      expect(char.pixels[0]).toHaveLength(32);
      expect(char.pixels[31][31]).toBe(false);
    });

    it("creates character with 0 width", () => {
      const char = createEmptyCharacter(0, 8);

      expect(char.pixels).toHaveLength(8);
      expect(char.pixels[0]).toHaveLength(0);
    });

    it("creates character with 0 height", () => {
      const char = createEmptyCharacter(8, 0);

      expect(char.pixels).toHaveLength(0);
    });
  });

  describe("pixel structure", () => {
    it("creates independent rows (not sharing references)", () => {
      const char = createEmptyCharacter(8, 8);

      // Modify one row
      char.pixels[0][0] = true;

      // Other rows should not be affected
      expect(char.pixels[1][0]).toBe(false);
      expect(char.pixels[7][0]).toBe(false);
    });
  });
});

// ============================================================================
// cloneCharacter
// ============================================================================

describe("cloneCharacter", () => {
  describe("basic cloning", () => {
    it("creates an exact copy of empty character", () => {
      const original = createMockCharacter(8, 8, "empty");
      const cloned = cloneCharacter(original);

      expect(cloned.pixels).toHaveLength(original.pixels.length);
      for (let row = 0; row < original.pixels.length; row++) {
        expect(cloned.pixels[row]).toHaveLength(original.pixels[row].length);
        for (let col = 0; col < original.pixels[row].length; col++) {
          expect(cloned.pixels[row][col]).toBe(original.pixels[row][col]);
        }
      }
    });

    it("creates an exact copy of filled character", () => {
      const original = createMockCharacter(8, 8, "filled");
      const cloned = cloneCharacter(original);

      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          expect(cloned.pixels[row][col]).toBe(true);
        }
      }
    });

    it("creates an exact copy of checkerboard character", () => {
      const original = createMockCharacter(8, 8, "checkerboard");
      const cloned = cloneCharacter(original);

      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const expected = (row + col) % 2 === 0;
          expect(cloned.pixels[row][col]).toBe(expected);
        }
      }
    });
  });

  describe("deep clone verification (isolation)", () => {
    it("modifying clone does not affect original", () => {
      const original = createMockCharacter(8, 8, "empty");
      const cloned = cloneCharacter(original);

      // Modify the clone
      cloned.pixels[0][0] = true;
      cloned.pixels[4][4] = true;
      cloned.pixels[7][7] = true;

      // Original should be unchanged
      expect(original.pixels[0][0]).toBe(false);
      expect(original.pixels[4][4]).toBe(false);
      expect(original.pixels[7][7]).toBe(false);
    });

    it("modifying original does not affect clone", () => {
      const original = createMockCharacter(8, 8, "filled");
      const cloned = cloneCharacter(original);

      // Modify the original
      original.pixels[0][0] = false;
      original.pixels[4][4] = false;

      // Clone should be unchanged
      expect(cloned.pixels[0][0]).toBe(true);
      expect(cloned.pixels[4][4]).toBe(true);
    });

    it("row arrays are independent (not shared references)", () => {
      const original = createMockCharacter(8, 8, "diagonal");
      const cloned = cloneCharacter(original);

      // Verify rows are different array objects
      for (let row = 0; row < 8; row++) {
        expect(cloned.pixels[row]).not.toBe(original.pixels[row]);
      }
    });

    it("pixels 2D array is independent", () => {
      const original = createMockCharacter(8, 8, "empty");
      const cloned = cloneCharacter(original);

      expect(cloned.pixels).not.toBe(original.pixels);
    });
  });

  describe("cloning different dimensions", () => {
    it("clones 16x16 character correctly", () => {
      const original = createMockCharacter(16, 16, "checkerboard");
      const cloned = cloneCharacter(original);

      expect(cloned.pixels).toHaveLength(16);
      expect(cloned.pixels[0]).toHaveLength(16);

      // Verify deep clone
      cloned.pixels[15][15] = !original.pixels[15][15];
      expect(cloned.pixels[15][15]).not.toBe(original.pixels[15][15]);
    });

    it("clones 7x8 character (non-byte-aligned width)", () => {
      const original = createMockCharacter(7, 8, "filled");
      const cloned = cloneCharacter(original);

      expect(cloned.pixels).toHaveLength(8);
      expect(cloned.pixels[0]).toHaveLength(7);
    });

    it("clones 1x1 character", () => {
      const original: Character = { pixels: [[true]] };
      const cloned = cloneCharacter(original);

      expect(cloned.pixels[0][0]).toBe(true);

      cloned.pixels[0][0] = false;
      expect(original.pixels[0][0]).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("clones character with empty rows", () => {
      const original: Character = { pixels: [] };
      const cloned = cloneCharacter(original);

      expect(cloned.pixels).toHaveLength(0);
    });

    it("clones character with empty columns", () => {
      const original: Character = { pixels: [[], [], []] };
      const cloned = cloneCharacter(original);

      expect(cloned.pixels).toHaveLength(3);
      expect(cloned.pixels[0]).toHaveLength(0);
    });
  });
});

// ============================================================================
// createDefaultConfig
// ============================================================================

describe("createDefaultConfig", () => {
  it("returns correct default width", () => {
    const config = createDefaultConfig();
    expect(config.width).toBe(8);
  });

  it("returns correct default height", () => {
    const config = createDefaultConfig();
    expect(config.height).toBe(8);
  });

  it("returns correct default padding", () => {
    const config = createDefaultConfig();
    expect(config.padding).toBe("right");
  });

  it("returns correct default bit direction", () => {
    const config = createDefaultConfig();
    expect(config.bitDirection).toBe("msb");
  });

  it("returns a new object on each call (not shared reference)", () => {
    const config1 = createDefaultConfig();
    const config2 = createDefaultConfig();

    expect(config1).not.toBe(config2);
  });

  it("modifying returned config does not affect subsequent calls", () => {
    const config1 = createDefaultConfig();
    config1.width = 16;
    config1.height = 16;

    const config2 = createDefaultConfig();
    expect(config2.width).toBe(8);
    expect(config2.height).toBe(8);
  });

  it("returns all required properties of CharacterSetConfig", () => {
    const config = createDefaultConfig();

    expect(config).toHaveProperty("width");
    expect(config).toHaveProperty("height");
    expect(config).toHaveProperty("padding");
    expect(config).toHaveProperty("bitDirection");
  });

  it("has type-safe values", () => {
    const config = createDefaultConfig();

    // Type assertions
    const width: number = config.width;
    const height: number = config.height;
    const padding: "left" | "right" = config.padding;
    const bitDirection: "msb" | "lsb" = config.bitDirection;

    expect(typeof width).toBe("number");
    expect(typeof height).toBe("number");
    expect(["left", "right"]).toContain(padding);
    expect(["msb", "lsb"]).toContain(bitDirection);
  });
});

// ============================================================================
// generateId
// ============================================================================

describe("generateId", () => {
  describe("uniqueness", () => {
    it("generates unique IDs across multiple calls", () => {
      const ids = new Set<string>();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        ids.add(generateId());
      }

      expect(ids.size).toBe(iterations);
    });

    it("generates different IDs on consecutive calls", () => {
      const id1 = generateId();
      const id2 = generateId();
      const id3 = generateId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });
  });

  describe("format validation", () => {
    it("returns a non-empty string", () => {
      const id = generateId();

      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });

    it("returns a valid UUID format", () => {
      const id = generateId();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // where y is 8, 9, A, or B
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });

    it("generates 36-character UUIDs", () => {
      const id = generateId();
      expect(id.length).toBe(36);
    });
  });

  describe("consistency", () => {
    it("always returns lowercase UUIDs", () => {
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const id = generateId();
        expect(id).toBe(id.toLowerCase());
      }
    });

    it("contains only valid UUID characters", () => {
      const iterations = 100;
      const validChars = /^[0-9a-f-]+$/;

      for (let i = 0; i < iterations; i++) {
        const id = generateId();
        expect(id).toMatch(validChars);
      }
    });
  });

  describe("safe for use as identifiers", () => {
    it("can be used as object keys", () => {
      const obj: Record<string, number> = {};
      const id1 = generateId();
      const id2 = generateId();

      obj[id1] = 1;
      obj[id2] = 2;

      expect(obj[id1]).toBe(1);
      expect(obj[id2]).toBe(2);
    });

    it("can be used in Set for deduplication", () => {
      const set = new Set<string>();
      const id = generateId();

      set.add(id);
      set.add(id);

      expect(set.size).toBe(1);
    });

    it("is safe for use in URL paths", () => {
      const id = generateId();
      const encodedId = encodeURIComponent(id);

      // UUIDs should not require encoding
      expect(id).toBe(encodedId);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("type utilities integration", () => {
  it("bytesPerCharacter uses bytesPerLine correctly", () => {
    const config = createMockConfig({ width: 12, height: 8 });

    const bpl = bytesPerLine(config.width);
    const bpc = bytesPerCharacter(config);

    expect(bpc).toBe(bpl * config.height);
  });

  it("createEmptyCharacter creates character matching config dimensions", () => {
    const config = createDefaultConfig();
    const char = createEmptyCharacter(config.width, config.height);

    expect(char.pixels).toHaveLength(config.height);
    expect(char.pixels[0]).toHaveLength(config.width);
  });

  it("cloneCharacter preserves dimensions from createEmptyCharacter", () => {
    const original = createEmptyCharacter(10, 12);
    const cloned = cloneCharacter(original);

    expect(cloned.pixels).toHaveLength(12);
    expect(cloned.pixels[0]).toHaveLength(10);
  });

  it("generateId creates valid IDs for metadata", () => {
    const id = generateId();
    const now = Date.now();

    // Simulate creating metadata with generated ID
    const metadata = {
      id,
      name: "Test",
      description: "",
      source: "test",
      manufacturer: "",
      system: "",
      chip: "",
      locale: "",
      createdAt: now,
      updatedAt: now,
      isBuiltIn: false,
    };

    expect(metadata.id).toBe(id);
    expect(metadata.id.length).toBe(36);
  });

  it("full workflow: create config, characters, and serialize", () => {
    // Create default config
    const config = createDefaultConfig();

    // Create empty characters
    const characters: Character[] = [];
    for (let i = 0; i < 4; i++) {
      characters.push(createEmptyCharacter(config.width, config.height));
    }

    // Verify byte calculations
    const expectedBytesPerChar = bytesPerCharacter(config);
    expect(expectedBytesPerChar).toBe(8);

    // Create serialized set using test utility
    const serialized = createMockSerializedCharacterSet({
      config,
      characterCount: 4,
    });

    // Verify character count calculation
    expect(getCharacterCount(serialized)).toBe(4);
  });
});
