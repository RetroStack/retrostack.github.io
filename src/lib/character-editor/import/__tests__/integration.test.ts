/**
 * Character ROM Editor - Import/Export Integration Tests
 *
 * End-to-end workflow tests verifying data integrity across:
 * - Binary round-trips (parse -> serialize -> parse)
 * - Text import -> binary export
 * - Character set lifecycle (create -> serialize -> deserialize -> modify -> re-serialize)
 * - Cross-format consistency (C header, assembly, binary)
 */

// Mock jsPDF to avoid TextEncoder issues in test environment
jest.mock("jspdf", () => ({
  jsPDF: jest.fn(),
}));

import {
  parseCharacterRom,
  serializeCharacterRom,
  serializeCharacterSet,
  deserializeCharacterSet,
  binaryToBase64,
  base64ToBinary,
  characterToBytes,
} from "@/lib/character-editor/import/binary";
import {
  parseTextToBytes,
  parseTextToCharacters,
  getDefaultTextImportOptions,
} from "@/lib/character-editor/import/textImport";
import {
  exportToCHeader,
  exportToAssembly,
  getDefaultCHeaderOptions,
  getDefaultAssemblyOptions,
} from "@/lib/character-editor/exports";
import {
  invertCharacter,
  flipHorizontal,
  flipVertical,
  shiftCharacter,
  rotateCharacter,
} from "@/lib/character-editor/transforms";
import {
  createMockCharacter,
  createMockCharacters,
  createMockConfig,
  createMockMetadata,
  createMockCharacterSet,
  charactersEqual,
  characterArraysEqual,
} from "@/lib/character-editor/__tests__/testUtils";
import type { Character, CharacterSet, CharacterSetConfig } from "@/lib/character-editor/types";

// ============================================================================
// Binary Round-Trip Tests
// ============================================================================

describe("Binary Round-Trip Integration", () => {
  describe("parse -> modify -> serialize -> parse preserves modifications", () => {
    it("modifies and preserves single pixel change", () => {
      const config = createMockConfig({ width: 8, height: 8 });
      const originalBytes = new Uint8Array(8).fill(0x00);

      // Parse original data
      const characters = parseCharacterRom(originalBytes, config);
      expect(characters.length).toBe(1);
      expect(characters[0].pixels[0][0]).toBe(false);

      // Modify a pixel
      characters[0].pixels[0][0] = true;

      // Serialize back
      const modifiedBytes = serializeCharacterRom(characters, config);

      // Parse again
      const restoredCharacters = parseCharacterRom(modifiedBytes, config);

      // Verify modification is preserved
      expect(restoredCharacters[0].pixels[0][0]).toBe(true);
      // Other pixels should remain unchanged
      expect(restoredCharacters[0].pixels[0][1]).toBe(false);
      expect(restoredCharacters[0].pixels[7][7]).toBe(false);
    });

    it("modifies and preserves multiple pixel changes across characters", () => {
      const config = createMockConfig({ width: 8, height: 8 });
      const originalBytes = new Uint8Array(24).fill(0x00); // 3 characters

      // Parse
      const characters = parseCharacterRom(originalBytes, config);
      expect(characters.length).toBe(3);

      // Modify different pixels in each character
      characters[0].pixels[0][0] = true;
      characters[1].pixels[3][4] = true;
      characters[2].pixels[7][7] = true;

      // Serialize and re-parse
      const modifiedBytes = serializeCharacterRom(characters, config);
      const restored = parseCharacterRom(modifiedBytes, config);

      // Verify all modifications
      expect(restored[0].pixels[0][0]).toBe(true);
      expect(restored[1].pixels[3][4]).toBe(true);
      expect(restored[2].pixels[7][7]).toBe(true);

      // Verify unmodified pixels remain unchanged
      expect(restored[0].pixels[7][7]).toBe(false);
      expect(restored[1].pixels[0][0]).toBe(false);
      expect(restored[2].pixels[0][0]).toBe(false);
    });

    it("preserves modifications with non-standard dimensions", () => {
      const config = createMockConfig({ width: 6, height: 10 });
      const bytesPerChar = Math.ceil(6 / 8) * 10; // 1 byte per row * 10 rows = 10 bytes
      const originalBytes = new Uint8Array(bytesPerChar * 2).fill(0x00);

      const characters = parseCharacterRom(originalBytes, config);
      expect(characters.length).toBe(2);

      // Modify edge pixels
      characters[0].pixels[0][5] = true; // Last column
      characters[1].pixels[9][0] = true; // Last row

      const modifiedBytes = serializeCharacterRom(characters, config);
      const restored = parseCharacterRom(modifiedBytes, config);

      expect(restored[0].pixels[0][5]).toBe(true);
      expect(restored[1].pixels[9][0]).toBe(true);
    });
  });

  describe("import binary -> export binary -> import preserves data", () => {
    it("preserves data through binary round-trip", () => {
      const config = createMockConfig({ width: 8, height: 8 });

      // Create original binary with specific pattern
      const originalBytes = new Uint8Array([
        0x3c, 0x42, 0x81, 0x81, 0x81, 0x81, 0x42, 0x3c, // Character 0: circle
        0xff, 0x81, 0x81, 0x81, 0x81, 0x81, 0x81, 0xff, // Character 1: box
      ]);

      // Import
      const imported = parseCharacterRom(originalBytes, config);

      // Export
      const exported = serializeCharacterRom(imported, config);

      // Import again
      const reimported = parseCharacterRom(exported, config);

      // Verify byte-for-byte equality
      expect(Array.from(exported)).toEqual(Array.from(originalBytes));
      expect(characterArraysEqual(imported, reimported)).toBe(true);
    });

    it("preserves data with different configurations", () => {
      const configs = [
        createMockConfig({ width: 8, height: 8, bitDirection: "ltr", padding: "right" }),
        createMockConfig({ width: 8, height: 8, bitDirection: "rtl", padding: "left" }),
        createMockConfig({ width: 6, height: 8, bitDirection: "ltr", padding: "left" }),
        createMockConfig({ width: 16, height: 16, bitDirection: "ltr", padding: "right" }),
      ];

      configs.forEach((config) => {
        const characters = createMockCharacters(8, config.width, config.height, [
          "empty",
          "filled",
          "checkerboard",
          "diagonal",
        ]);

        // Serialize -> Deserialize -> Serialize
        const bytes1 = serializeCharacterRom(characters, config);
        const parsed = parseCharacterRom(bytes1, config);
        const bytes2 = serializeCharacterRom(parsed, config);

        expect(Array.from(bytes1)).toEqual(Array.from(bytes2));
        expect(characterArraysEqual(characters, parsed)).toBe(true);
      });
    });

    it("handles large ROM (256 characters) round-trip", () => {
      const config = createMockConfig({ width: 8, height: 8 });
      const originalBytes = new Uint8Array(256 * 8);

      // Fill with pattern based on character index
      for (let charIdx = 0; charIdx < 256; charIdx++) {
        for (let row = 0; row < 8; row++) {
          originalBytes[charIdx * 8 + row] = (charIdx + row) % 256;
        }
      }

      const imported = parseCharacterRom(originalBytes, config);
      const exported = serializeCharacterRom(imported, config);

      expect(Array.from(exported)).toEqual(Array.from(originalBytes));
    });
  });
});

// ============================================================================
// Text Import -> Binary Export Integration
// ============================================================================

describe("Text Import to Binary Export Integration", () => {
  describe("parse hex text -> get characters -> serialize to binary -> parse returns same characters", () => {
    it("converts C-style hex to binary and back", () => {
      const hexInput = "0x00, 0x7E, 0x42, 0x42, 0x7E, 0x42, 0x42, 0x00";
      const options = getDefaultTextImportOptions();

      // Parse text to characters
      const parseResult = parseTextToCharacters(hexInput, options);
      expect(parseResult.error).toBeUndefined();
      expect(parseResult.characters.length).toBe(1);

      // Serialize to binary
      const binaryData = serializeCharacterRom(parseResult.characters, parseResult.config);

      // Parse binary back to characters
      const restored = parseCharacterRom(binaryData, parseResult.config);

      // Verify characters match
      expect(characterArraysEqual(parseResult.characters, restored)).toBe(true);
    });

    it("converts assembly-style hex to binary and back", () => {
      const asmInput = "$00, $7E, $42, $42, $7E, $42, $42, $00";
      const options = getDefaultTextImportOptions();

      const parseResult = parseTextToCharacters(asmInput, options);
      expect(parseResult.error).toBeUndefined();

      const binaryData = serializeCharacterRom(parseResult.characters, parseResult.config);
      const restored = parseCharacterRom(binaryData, parseResult.config);

      expect(characterArraysEqual(parseResult.characters, restored)).toBe(true);
    });

    it("converts decimal text to binary and back", () => {
      const decimalInput = "0, 126, 66, 66, 126, 66, 66, 0";
      const options = getDefaultTextImportOptions();

      const parseResult = parseTextToCharacters(decimalInput, options);
      expect(parseResult.error).toBeUndefined();

      const binaryData = serializeCharacterRom(parseResult.characters, parseResult.config);
      const restored = parseCharacterRom(binaryData, parseResult.config);

      expect(characterArraysEqual(parseResult.characters, restored)).toBe(true);
    });

    it("converts binary text to binary and back", () => {
      const binaryInput = "0b00000000, 0b01111110, 0b01000010, 0b01000010, 0b01111110, 0b01000010, 0b01000010, 0b00000000";
      const options = getDefaultTextImportOptions();

      const parseResult = parseTextToCharacters(binaryInput, options);
      expect(parseResult.error).toBeUndefined();

      const binaryData = serializeCharacterRom(parseResult.characters, parseResult.config);
      const restored = parseCharacterRom(binaryData, parseResult.config);

      expect(characterArraysEqual(parseResult.characters, restored)).toBe(true);
    });

    it("handles multi-character text import to binary", () => {
      const multiCharInput = `
        0x00, 0x7E, 0x42, 0x42, 0x7E, 0x42, 0x42, 0x00,
        0xFF, 0x81, 0x81, 0x81, 0x81, 0x81, 0x81, 0xFF,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
      `;
      const options = getDefaultTextImportOptions();

      const parseResult = parseTextToCharacters(multiCharInput, options);
      expect(parseResult.error).toBeUndefined();
      expect(parseResult.characters.length).toBe(3);

      const binaryData = serializeCharacterRom(parseResult.characters, parseResult.config);
      const restored = parseCharacterRom(binaryData, parseResult.config);

      expect(characterArraysEqual(parseResult.characters, restored)).toBe(true);
    });

    it("byte values from text match serialized binary values", () => {
      const hexInput = "0xAA, 0x55, 0xF0, 0x0F, 0xFF, 0x00, 0x81, 0x42";
      const expectedBytes = [0xaa, 0x55, 0xf0, 0x0f, 0xff, 0x00, 0x81, 0x42];
      const options = getDefaultTextImportOptions();

      const parseResult = parseTextToCharacters(hexInput, options);

      // Raw parsed bytes should match expected
      expect(Array.from(parseResult.bytes)).toEqual(expectedBytes);

      // Serialized bytes should also match
      const serialized = serializeCharacterRom(parseResult.characters, parseResult.config);
      expect(Array.from(serialized)).toEqual(expectedBytes);
    });
  });
});

// ============================================================================
// Character Set Lifecycle Tests
// ============================================================================

describe("Character Set Lifecycle Integration", () => {
  describe("create -> serialize -> deserialize preserves complete state", () => {
    it("preserves metadata through serialization cycle", () => {
      const original = createMockCharacterSet({
        metadata: {
          name: "Test Character ROM",
          description: "A test character set for integration testing",
          manufacturer: "Commodore",
          system: "C64",
          chip: "901225-01",
          locale: "English",
          source: "test",
        },
        characterCount: 16,
      });

      const serialized = serializeCharacterSet(original);
      const restored = deserializeCharacterSet(serialized);

      expect(restored.metadata.name).toBe(original.metadata.name);
      expect(restored.metadata.description).toBe(original.metadata.description);
      expect(restored.metadata.manufacturer).toBe(original.metadata.manufacturer);
      expect(restored.metadata.system).toBe(original.metadata.system);
      expect(restored.metadata.chip).toBe(original.metadata.chip);
      expect(restored.metadata.locale).toBe(original.metadata.locale);
      expect(restored.metadata.id).toBe(original.metadata.id);
      expect(restored.metadata.createdAt).toBe(original.metadata.createdAt);
    });

    it("preserves config through serialization cycle", () => {
      const original = createMockCharacterSet({
        config: {
          width: 6,
          height: 10,
          bitDirection: "rtl",
          padding: "left",
        },
        characterCount: 8,
      });

      const serialized = serializeCharacterSet(original);
      const restored = deserializeCharacterSet(serialized);

      expect(restored.config).toEqual(original.config);
    });

    it("preserves characters through serialization cycle", () => {
      const patterns: ("empty" | "filled" | "checkerboard" | "diagonal")[] = [
        "empty",
        "filled",
        "checkerboard",
        "diagonal",
      ];
      const original = createMockCharacterSet({
        characters: createMockCharacters(8, 8, 8, patterns),
      });

      const serialized = serializeCharacterSet(original);
      const restored = deserializeCharacterSet(serialized);

      expect(characterArraysEqual(original.characters, restored.characters)).toBe(true);
    });
  });

  describe("modify characters in deserialized set -> re-serialize -> deserialize preserves modifications", () => {
    it("preserves single character modification", () => {
      const original = createMockCharacterSet({ characterCount: 8 });

      // First serialize/deserialize cycle
      const serialized1 = serializeCharacterSet(original);
      const restored1 = deserializeCharacterSet(serialized1);

      // Modify a character
      restored1.characters[0] = createMockCharacter(8, 8, "filled");
      restored1.metadata.updatedAt = Date.now();

      // Second serialize/deserialize cycle
      const serialized2 = serializeCharacterSet(restored1);
      const restored2 = deserializeCharacterSet(serialized2);

      // Verify modification persisted
      expect(charactersEqual(restored2.characters[0], createMockCharacter(8, 8, "filled"))).toBe(true);
      // Verify other characters unchanged
      expect(charactersEqual(restored2.characters[1], original.characters[1])).toBe(true);
    });

    it("preserves pixel-level modifications", () => {
      const original = createMockCharacterSet({
        characters: createMockCharacters(4, 8, 8, ["empty"]),
      });

      const serialized1 = serializeCharacterSet(original);
      const restored1 = deserializeCharacterSet(serialized1);

      // Modify specific pixels
      restored1.characters[0].pixels[0][0] = true;
      restored1.characters[1].pixels[4][4] = true;
      restored1.characters[2].pixels[7][7] = true;
      restored1.characters[3].pixels[0][7] = true;

      const serialized2 = serializeCharacterSet(restored1);
      const restored2 = deserializeCharacterSet(serialized2);

      expect(restored2.characters[0].pixels[0][0]).toBe(true);
      expect(restored2.characters[1].pixels[4][4]).toBe(true);
      expect(restored2.characters[2].pixels[7][7]).toBe(true);
      expect(restored2.characters[3].pixels[0][7]).toBe(true);
    });

    it("preserves transform operations on characters", () => {
      const original = createMockCharacterSet({
        characters: [createMockCharacter(8, 8, "diagonal")],
      });

      const serialized1 = serializeCharacterSet(original);
      const restored1 = deserializeCharacterSet(serialized1);

      // Apply transforms
      const inverted = invertCharacter(restored1.characters[0]);
      restored1.characters[0] = inverted;

      const serialized2 = serializeCharacterSet(restored1);
      const restored2 = deserializeCharacterSet(serialized2);

      // Verify transform was preserved (diagonal inverted should have specific pattern)
      expect(charactersEqual(restored2.characters[0], inverted)).toBe(true);
    });

    it("handles multiple modification cycles", () => {
      let characterSet = createMockCharacterSet({ characterCount: 4 });

      // Multiple modification cycles
      for (let cycle = 0; cycle < 5; cycle++) {
        const serialized = serializeCharacterSet(characterSet);
        characterSet = deserializeCharacterSet(serialized);

        // Modify a pixel each cycle
        characterSet.characters[cycle % 4].pixels[cycle % 8][cycle % 8] = true;
      }

      // Verify all modifications are present
      expect(characterSet.characters[0].pixels[0][0]).toBe(true);
      expect(characterSet.characters[1].pixels[1][1]).toBe(true);
      expect(characterSet.characters[2].pixels[2][2]).toBe(true);
      expect(characterSet.characters[3].pixels[3][3]).toBe(true);
      expect(characterSet.characters[0].pixels[4][4]).toBe(true);
    });
  });

  describe("base64 encoding preserves binary data integrity", () => {
    it("base64 round-trip preserves exact bytes", () => {
      const originalBytes = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        originalBytes[i] = i;
      }

      const base64 = binaryToBase64(originalBytes);
      const restored = base64ToBinary(base64);

      expect(Array.from(restored)).toEqual(Array.from(originalBytes));
    });

    it("character set binaryData field contains valid base64", () => {
      const characterSet = createMockCharacterSet({ characterCount: 32 });
      const serialized = serializeCharacterSet(characterSet);

      // Verify base64 format
      expect(serialized.binaryData).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);

      // Verify it decodes correctly
      const decoded = base64ToBinary(serialized.binaryData);
      expect(decoded.length).toBe(32 * 8); // 32 chars * 8 bytes each
    });
  });
});

// ============================================================================
// Cross-Format Consistency Tests
// ============================================================================

describe("Cross-Format Consistency Integration", () => {
  describe("C header and assembly exports contain same byte values", () => {
    it("byte values match between C header and assembly output", () => {
      const characters = createMockCharacters(8, 8, 8, ["filled", "empty", "checkerboard", "diagonal"]);
      const config = createMockConfig();

      const cHeader = exportToCHeader(characters, config, getDefaultCHeaderOptions("test"));
      const assembly = exportToAssembly(characters, config, getDefaultAssemblyOptions("test"));

      // Extract hex values from C header (0xNN format)
      const cHexMatches = cHeader.match(/0x[0-9A-Fa-f]{2}/g) || [];
      const cHexValues = cHexMatches.map((h) => parseInt(h.slice(2), 16));

      // Extract hex values from assembly ($NN format)
      const asmHexMatches = assembly.match(/\$[0-9A-Fa-f]{2}/g) || [];
      const asmHexValues = asmHexMatches.map((h) => parseInt(h.slice(1), 16));

      expect(cHexValues).toEqual(asmHexValues);
    });

    it("byte count matches between exports", () => {
      const characters = createMockCharacters(16, 8, 8, ["checkerboard"]);
      const config = createMockConfig();

      const cHeader = exportToCHeader(characters, config, getDefaultCHeaderOptions("test"));
      const assembly = exportToAssembly(characters, config, getDefaultAssemblyOptions("test"));

      const cHexMatches = cHeader.match(/0x[0-9A-Fa-f]{2}/g) || [];
      const asmHexMatches = assembly.match(/\$[0-9A-Fa-f]{2}/g) || [];

      expect(cHexMatches.length).toBe(asmHexMatches.length);
      expect(cHexMatches.length).toBe(16 * 8); // 16 chars * 8 bytes
    });
  });

  describe("binary data matches hex values in text exports", () => {
    it("serialized binary matches C header hex values", () => {
      const characters = createMockCharacters(4, 8, 8, ["filled", "empty"]);
      const config = createMockConfig();

      // Get binary data
      const binaryData = serializeCharacterRom(characters, config);

      // Get C header and extract hex values
      const cHeader = exportToCHeader(characters, config, getDefaultCHeaderOptions("test"));
      const cHexMatches = cHeader.match(/0x[0-9A-Fa-f]{2}/g) || [];
      const cHexValues = cHexMatches.map((h) => parseInt(h.slice(2), 16));

      // Compare
      expect(Array.from(binaryData)).toEqual(cHexValues);
    });

    it("serialized binary matches assembly hex values", () => {
      const characters = createMockCharacters(4, 8, 8, ["diagonal", "checkerboard"]);
      const config = createMockConfig();

      const binaryData = serializeCharacterRom(characters, config);

      const assembly = exportToAssembly(characters, config, getDefaultAssemblyOptions("test"));
      const asmHexMatches = assembly.match(/\$[0-9A-Fa-f]{2}/g) || [];
      const asmHexValues = asmHexMatches.map((h) => parseInt(h.slice(1), 16));

      expect(Array.from(binaryData)).toEqual(asmHexValues);
    });

    it("individual character bytes match across all formats", () => {
      const characters = [createMockCharacter(8, 8, "checkerboard")];
      const config = createMockConfig();

      // Direct binary conversion
      const directBytes = characterToBytes(characters[0], config);

      // From serialization
      const serializedBytes = serializeCharacterRom(characters, config);

      // From C header export
      const cHeader = exportToCHeader(characters, config, getDefaultCHeaderOptions("test"));
      const cHexMatches = cHeader.match(/0x[0-9A-Fa-f]{2}/g) || [];
      const cBytes = cHexMatches.map((h) => parseInt(h.slice(2), 16));

      // From assembly export
      const assembly = exportToAssembly(characters, config, getDefaultAssemblyOptions("test"));
      const asmHexMatches = assembly.match(/\$[0-9A-Fa-f]{2}/g) || [];
      const asmBytes = asmHexMatches.map((h) => parseInt(h.slice(1), 16));

      // All should match
      expect(Array.from(directBytes)).toEqual(Array.from(serializedBytes));
      expect(Array.from(directBytes)).toEqual(cBytes);
      expect(Array.from(directBytes)).toEqual(asmBytes);
    });
  });

  describe("text import produces same result as direct binary import", () => {
    it("hex text import matches direct binary parsing", () => {
      const config = createMockConfig();
      const bytes = new Uint8Array([0xaa, 0x55, 0xf0, 0x0f, 0xff, 0x00, 0x81, 0x42]);

      // Parse binary directly
      const binaryParsed = parseCharacterRom(bytes, config);

      // Create hex text from same bytes
      const hexText = Array.from(bytes)
        .map((b) => "0x" + b.toString(16).padStart(2, "0").toUpperCase())
        .join(", ");

      // Parse hex text
      const textParsed = parseTextToCharacters(hexText, getDefaultTextImportOptions());

      expect(characterArraysEqual(binaryParsed, textParsed.characters)).toBe(true);
    });

    it("decimal text import matches direct binary parsing", () => {
      const config = createMockConfig();
      const bytes = new Uint8Array([0, 126, 66, 66, 126, 0, 0, 0]);

      const binaryParsed = parseCharacterRom(bytes, config);

      const decimalText = Array.from(bytes).join(", ");
      const textParsed = parseTextToCharacters(decimalText, getDefaultTextImportOptions());

      expect(characterArraysEqual(binaryParsed, textParsed.characters)).toBe(true);
    });

    it("assembly-style hex text import matches direct binary parsing", () => {
      const config = createMockConfig();
      const bytes = new Uint8Array([0x3c, 0x42, 0x81, 0x81, 0x81, 0x81, 0x42, 0x3c]);

      const binaryParsed = parseCharacterRom(bytes, config);

      const asmText = Array.from(bytes)
        .map((b) => "$" + b.toString(16).padStart(2, "0").toUpperCase())
        .join(", ");
      const textParsed = parseTextToCharacters(asmText, getDefaultTextImportOptions());

      expect(characterArraysEqual(binaryParsed, textParsed.characters)).toBe(true);
    });
  });
});

// ============================================================================
// Complete Workflow Integration Tests
// ============================================================================

describe("Complete Workflow Integration", () => {
  it("text import -> edit -> export C header -> reimport produces consistent data", () => {
    // Import from text
    const originalText = "0x00, 0x7E, 0x42, 0x42, 0x7E, 0x42, 0x42, 0x00";
    const parseResult = parseTextToCharacters(originalText, getDefaultTextImportOptions());
    expect(parseResult.characters.length).toBe(1);

    // Modify the character
    const modified = invertCharacter(parseResult.characters[0]);

    // Export to C header
    const cHeader = exportToCHeader([modified], parseResult.config, getDefaultCHeaderOptions("test"));

    // Extract hex values from C header
    const cHexMatches = cHeader.match(/0x[0-9A-Fa-f]{2}/g) || [];
    const reimportText = cHexMatches.join(", ");

    // Reimport
    const reimportResult = parseTextToCharacters(reimportText, getDefaultTextImportOptions());

    // Verify consistency
    expect(charactersEqual(reimportResult.characters[0], modified)).toBe(true);
  });

  it("binary import -> transform -> serialize -> deserialize -> export maintains integrity", () => {
    // Create binary data
    const config = createMockConfig();
    const originalBytes = new Uint8Array([
      0x3c, 0x42, 0x81, 0x81, 0x81, 0x81, 0x42, 0x3c, // Circle
      0xff, 0x81, 0x81, 0x81, 0x81, 0x81, 0x81, 0xff, // Box
    ]);

    // Parse binary
    const characters = parseCharacterRom(originalBytes, config);

    // Apply transforms
    characters[0] = flipHorizontal(characters[0]);
    characters[1] = flipVertical(characters[1]);

    // Create character set and serialize
    const characterSet: CharacterSet = {
      metadata: createMockMetadata({ name: "Transformed Set" }),
      config,
      characters,
    };
    const serialized = serializeCharacterSet(characterSet);

    // Deserialize
    const restored = deserializeCharacterSet(serialized);

    // Export to assembly
    const assembly = exportToAssembly(restored.characters, restored.config, getDefaultAssemblyOptions("test"));

    // Extract bytes from assembly
    const asmHexMatches = assembly.match(/\$[0-9A-Fa-f]{2}/g) || [];
    const exportedBytes = asmHexMatches.map((h) => parseInt(h.slice(1), 16));

    // Verify the transformed characters serialize correctly
    const expectedBytes = serializeCharacterRom(characters, config);
    expect(exportedBytes).toEqual(Array.from(expectedBytes));
  });

  it("handles real-world C64 character ROM workflow", () => {
    // Simulate importing a C64 character ROM
    const c64Config = createMockConfig({
      width: 8,
      height: 8,
      bitDirection: "ltr",
      padding: "right",
    });

    // Create a mock "A" character pattern (simplified)
    const charA = new Uint8Array([0x18, 0x24, 0x42, 0x7e, 0x42, 0x42, 0x42, 0x00]);

    // Parse
    const characters = parseCharacterRom(charA, c64Config);

    // Create character set with C64 metadata
    const characterSet: CharacterSet = {
      metadata: createMockMetadata({
        name: "C64 Custom ROM",
        manufacturer: "Commodore",
        system: "C64",
        chip: "901225-01",
      }),
      config: c64Config,
      characters,
    };

    // Serialize for storage
    const serialized = serializeCharacterSet(characterSet);
    expect(serialized.metadata.manufacturer).toBe("Commodore");

    // Restore and modify
    const restored = deserializeCharacterSet(serialized);
    restored.characters[0] = shiftCharacter(restored.characters[0], "left", false);

    // Re-serialize
    const reserialized = serializeCharacterSet(restored);

    // Final restore
    const final = deserializeCharacterSet(reserialized);

    // Verify the shift was preserved
    const shiftedA = shiftCharacter(characters[0], "left", false);
    expect(charactersEqual(final.characters[0], shiftedA)).toBe(true);
  });

  it("handles Apple II character ROM workflow with non-standard width", () => {
    // Apple II uses 7-bit wide characters
    const appleConfig = createMockConfig({
      width: 7,
      height: 8,
      bitDirection: "ltr",
      padding: "right",
    });

    // Create characters
    const characters = createMockCharacters(64, 7, 8, ["checkerboard", "diagonal"]);

    // Create character set
    const characterSet: CharacterSet = {
      metadata: createMockMetadata({
        name: "Apple II Custom ROM",
        manufacturer: "Apple",
        system: "Apple II",
        chip: "2513",
      }),
      config: appleConfig,
      characters,
    };

    // Full lifecycle
    const serialized = serializeCharacterSet(characterSet);
    const restored = deserializeCharacterSet(serialized);

    // Modify
    restored.characters[0] = rotateCharacter(restored.characters[0], "right");

    const reserialized = serializeCharacterSet(restored);
    const final = deserializeCharacterSet(reserialized);

    // Verify character count and dimensions preserved
    expect(final.characters.length).toBe(64);
    expect(final.characters[0].pixels[0].length).toBe(7);
    expect(final.characters[0].pixels.length).toBe(8);
    expect(final.config.width).toBe(7);
  });
});

// ============================================================================
// Edge Case Integration Tests
// ============================================================================

describe("Edge Case Integration", () => {
  it("handles empty character set through full lifecycle", () => {
    const original = createMockCharacterSet({ characterCount: 0 });

    const serialized = serializeCharacterSet(original);
    expect(serialized.binaryData).toBe("");

    const restored = deserializeCharacterSet(serialized);
    expect(restored.characters).toEqual([]);

    const assembly = exportToAssembly(restored.characters, restored.config, getDefaultAssemblyOptions("test"));
    expect(assembly).toContain("test:");
    expect(assembly.match(/\$[0-9A-Fa-f]{2}/g)).toBeNull();
  });

  it("handles single character through all export formats", () => {
    const character = createMockCharacter(8, 8, "diagonal");
    const config = createMockConfig();

    // Binary
    const binary = serializeCharacterRom([character], config);
    expect(binary.length).toBe(8);

    // C header
    const cHeader = exportToCHeader([character], config, getDefaultCHeaderOptions("test"));
    const cBytes = (cHeader.match(/0x[0-9A-Fa-f]{2}/g) || []).length;
    expect(cBytes).toBe(8);

    // Assembly
    const assembly = exportToAssembly([character], config, getDefaultAssemblyOptions("test"));
    const asmBytes = (assembly.match(/\$[0-9A-Fa-f]{2}/g) || []).length;
    expect(asmBytes).toBe(8);

    // All byte counts match
    expect(binary.length).toBe(cBytes);
    expect(binary.length).toBe(asmBytes);
  });

  it("handles maximum dimension characters (16x16)", () => {
    const config = createMockConfig({ width: 16, height: 16 });
    const characters = createMockCharacters(4, 16, 16, ["filled", "checkerboard"]);

    // Serialize
    const binary = serializeCharacterRom(characters, config);
    expect(binary.length).toBe(4 * 32); // 4 chars * 2 bytes/row * 16 rows

    // Parse back
    const restored = parseCharacterRom(binary, config);
    expect(characterArraysEqual(characters, restored)).toBe(true);

    // Export and verify
    const cHeader = exportToCHeader(characters, config, getDefaultCHeaderOptions("test"));
    const cBytes = (cHeader.match(/0x[0-9A-Fa-f]{2}/g) || []).length;
    expect(cBytes).toBe(4 * 32);
  });

  it("handles mixed text format input correctly", () => {
    // Mix of hex, decimal, and binary
    const mixedInput = "0xFF, 255, $FF, 0b11111111";

    const parseResult = parseTextToBytes(mixedInput);
    expect(parseResult.format).toBe("mixed");
    expect(parseResult.bytes).toEqual([255, 255, 255, 255]);

    // Use full bytes for a character
    const fullMixedInput = "0x00, 126, $42, 0b01000010, 0x7E, 66, $42, 0b00000000";
    const charResult = parseTextToCharacters(fullMixedInput, getDefaultTextImportOptions());

    expect(charResult.characters.length).toBe(1);
    expect(charResult.error).toBeUndefined();

    // Verify round-trip
    const binary = serializeCharacterRom(charResult.characters, charResult.config);
    const restored = parseCharacterRom(binary, charResult.config);
    expect(characterArraysEqual(charResult.characters, restored)).toBe(true);
  });
});
