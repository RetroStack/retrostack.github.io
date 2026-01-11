/**
 * Character ROM Editor - Similarity Calculation Tests
 *
 * Tests for character set similarity comparison:
 * - Character trimming
 * - Trimmed character comparison
 * - Full character set similarity calculation
 */

import {
  trimCharacter,
  compareTrimmedCharacters,
  calculateSimilarities,
} from "@/lib/character-editor/similarity";
import type { Character } from "@/lib/character-editor/types";
import {
  createMockCharacter,
  createMockConfig,
  createMockSerializedCharacterSet,
} from "./testUtils";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a character from a visual pattern string
 * Uses '#' for on pixels and '.' for off pixels
 */
function charFromPattern(pattern: string): Character {
  const rows = pattern
    .trim()
    .split("\n")
    .map((row) => row.trim());
  const pixels = rows.map((row) => row.split("").map((char) => char === "#"));
  return { pixels };
}

/**
 * Convert a character to a visual pattern string for debugging
 */
function charToPattern(char: Character): string {
  return char.pixels
    .map((row) => row.map((p) => (p ? "#" : ".")).join(""))
    .join("\n");
}

// ============================================================================
// trimCharacter Tests
// ============================================================================

describe("trimCharacter", () => {
  it("returns minimal character for completely empty input", () => {
    const empty = createMockCharacter(8, 8, "empty");
    const result = trimCharacter(empty);

    expect(result.pixels.length).toBe(1);
    expect(result.pixels[0].length).toBe(1);
    expect(result.pixels[0][0]).toBe(false);
  });

  it("returns full character when completely filled", () => {
    const filled = createMockCharacter(4, 4, "filled");
    const result = trimCharacter(filled);

    expect(result.pixels.length).toBe(4);
    expect(result.pixels[0].length).toBe(4);
    // All pixels should still be true
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        expect(result.pixels[row][col]).toBe(true);
      }
    }
  });

  it("trims empty rows and columns from around content", () => {
    const input = charFromPattern(`
      ........
      ..##....
      ..##....
      ........
    `);
    const result = trimCharacter(input);

    expect(result.pixels.length).toBe(2); // 2 rows of content
    expect(result.pixels[0].length).toBe(2); // 2 cols of content
    expect(charToPattern(result)).toBe("##\n##");
  });

  it("handles content in top-left corner", () => {
    const input = charFromPattern(`
      ##......
      ##......
      ........
      ........
    `);
    const result = trimCharacter(input);

    expect(result.pixels.length).toBe(2);
    expect(result.pixels[0].length).toBe(2);
  });

  it("handles content in bottom-right corner", () => {
    const input = charFromPattern(`
      ........
      ........
      ......##
      ......##
    `);
    const result = trimCharacter(input);

    expect(result.pixels.length).toBe(2);
    expect(result.pixels[0].length).toBe(2);
  });

  it("handles single pixel in center", () => {
    const input = charFromPattern(`
      ........
      ........
      ....#...
      ........
    `);
    const result = trimCharacter(input);

    expect(result.pixels.length).toBe(1);
    expect(result.pixels[0].length).toBe(1);
    expect(result.pixels[0][0]).toBe(true);
  });

  it("preserves diagonal pattern shape", () => {
    const input = charFromPattern(`
      ........
      .#......
      ..#.....
      ...#....
      ........
    `);
    const result = trimCharacter(input);

    expect(result.pixels.length).toBe(3);
    expect(result.pixels[0].length).toBe(3);
    expect(charToPattern(result)).toBe("#..\n.#.\n..#");
  });
});

// ============================================================================
// compareTrimmedCharacters Tests
// ============================================================================

describe("compareTrimmedCharacters", () => {
  it("returns 0 differences for identical characters", () => {
    const charA = charFromPattern(`
      ##..
      ##..
      ....
      ....
    `);
    const charB = charFromPattern(`
      ##..
      ##..
      ....
      ....
    `);

    const result = compareTrimmedCharacters(charA, charB);

    expect(result.differingPixels).toBe(0);
    expect(result.totalPixels).toBe(4); // 2x2 trimmed content
  });

  it("returns 0 differences for same content in different positions", () => {
    const charA = charFromPattern(`
      ##..
      ##..
      ....
      ....
    `);
    const charB = charFromPattern(`
      ....
      ....
      ..##
      ..##
    `);

    const result = compareTrimmedCharacters(charA, charB);

    // Both trim to 2x2 filled, so they should be identical
    expect(result.differingPixels).toBe(0);
    expect(result.totalPixels).toBe(4);
  });

  it("counts all pixels as different when completely different", () => {
    const charA = charFromPattern(`
      ##..
      ##..
      ....
      ....
    `);
    const charB = charFromPattern(`
      ....
      ....
      ....
      ....
    `);

    const result = compareTrimmedCharacters(charA, charB);

    // charA trims to 2x2 filled, charB is empty (1x1 false)
    // Comparison area is 2x2, charB is centered, so differences are expected
    expect(result.differingPixels).toBeGreaterThan(0);
  });

  it("correctly compares characters of different trimmed sizes", () => {
    const charA = charFromPattern(`
      ####
      ####
      ####
      ####
    `);
    const charB = charFromPattern(`
      ....
      .##.
      .##.
      ....
    `);

    const result = compareTrimmedCharacters(charA, charB);

    // charA trims to 4x4, charB trims to 2x2
    // Max dimensions are 4x4, centered comparison
    expect(result.totalPixels).toBe(16);
    expect(result.differingPixels).toBeGreaterThan(0);
  });

  it("handles empty characters", () => {
    const charA = createMockCharacter(4, 4, "empty");
    const charB = createMockCharacter(4, 4, "empty");

    const result = compareTrimmedCharacters(charA, charB);

    expect(result.differingPixels).toBe(0);
    expect(result.totalPixels).toBe(1); // Both trim to 1x1 empty
  });

  it("compares one empty and one filled character", () => {
    const charA = createMockCharacter(4, 4, "empty");
    const charB = createMockCharacter(4, 4, "filled");

    const result = compareTrimmedCharacters(charA, charB);

    // charA is 1x1 empty, charB is 4x4 filled
    expect(result.totalPixels).toBe(16);
    expect(result.differingPixels).toBe(16);
  });
});

// ============================================================================
// calculateSimilarities Tests
// ============================================================================

describe("calculateSimilarities", () => {
  it("returns empty array when no library sets", () => {
    const sourceChars = [createMockCharacter(8, 8, "filled")];
    const sourceConfig = createMockConfig();

    const result = calculateSimilarities(sourceChars, sourceConfig, []);

    expect(result).toEqual([]);
  });

  it("excludes the specified character set ID", () => {
    const sourceChars = [createMockCharacter(8, 8, "filled")];
    const sourceConfig = createMockConfig();
    const librarySet = createMockSerializedCharacterSet({
      metadata: { id: "test-id", name: "Test Set" },
      characterCount: 1,
    });

    const result = calculateSimilarities(
      sourceChars,
      sourceConfig,
      [librarySet],
      "test-id" // Exclude this ID
    );

    expect(result).toEqual([]);
  });

  it("includes sets when excludeId is different", () => {
    const sourceChars = [createMockCharacter(8, 8, "filled")];
    const sourceConfig = createMockConfig();
    const librarySet = createMockSerializedCharacterSet({
      metadata: { id: "test-id", name: "Test Set" },
      characterCount: 1,
    });

    const result = calculateSimilarities(
      sourceChars,
      sourceConfig,
      [librarySet],
      "other-id" // Different ID
    );

    expect(result.length).toBe(1);
    expect(result[0].characterSetId).toBe("test-id");
  });

  it("sorts results by average difference (most similar first)", () => {
    // Create source with specific pattern
    const sourceChars = [
      createMockCharacter(8, 8, "filled"),
      createMockCharacter(8, 8, "filled"),
    ];
    const sourceConfig = createMockConfig();

    // Create library sets with varying similarity
    const identicalSet = createMockSerializedCharacterSet({
      metadata: { id: "identical", name: "Identical Set" },
      characters: [
        createMockCharacter(8, 8, "filled"),
        createMockCharacter(8, 8, "filled"),
      ],
    });

    const differentSet = createMockSerializedCharacterSet({
      metadata: { id: "different", name: "Different Set" },
      characters: [
        createMockCharacter(8, 8, "empty"),
        createMockCharacter(8, 8, "empty"),
      ],
    });

    const result = calculateSimilarities(sourceChars, sourceConfig, [
      differentSet,
      identicalSet,
    ]);

    expect(result.length).toBe(2);
    // Identical should come first (lower average difference)
    expect(result[0].characterSetId).toBe("identical");
    expect(result[1].characterSetId).toBe("different");
  });

  it("calculates correct match percentage for identical sets", () => {
    const sourceChars = [createMockCharacter(8, 8, "filled")];
    const sourceConfig = createMockConfig();
    const identicalSet = createMockSerializedCharacterSet({
      metadata: { id: "identical", name: "Identical Set" },
      characters: [createMockCharacter(8, 8, "filled")],
    });

    const result = calculateSimilarities(sourceChars, sourceConfig, [
      identicalSet,
    ]);

    expect(result.length).toBe(1);
    expect(result[0].matchPercentage).toBe(100);
    expect(result[0].averageDifference).toBe(0);
  });

  it("calculates correct match percentage for completely different sets", () => {
    const sourceChars = [createMockCharacter(8, 8, "filled")];
    const sourceConfig = createMockConfig();
    const differentSet = createMockSerializedCharacterSet({
      metadata: { id: "different", name: "Different Set" },
      characters: [createMockCharacter(8, 8, "empty")],
    });

    const result = calculateSimilarities(sourceChars, sourceConfig, [
      differentSet,
    ]);

    expect(result.length).toBe(1);
    expect(result[0].matchPercentage).toBeLessThan(50);
    expect(result[0].averageDifference).toBeGreaterThan(0);
  });

  it("only compares up to the minimum character count", () => {
    const sourceChars = [
      createMockCharacter(8, 8, "filled"),
      createMockCharacter(8, 8, "filled"),
      createMockCharacter(8, 8, "filled"),
    ];
    const sourceConfig = createMockConfig();
    const smallerSet = createMockSerializedCharacterSet({
      metadata: { id: "smaller", name: "Smaller Set" },
      characters: [createMockCharacter(8, 8, "filled")], // Only 1 character
    });

    const result = calculateSimilarities(sourceChars, sourceConfig, [
      smallerSet,
    ]);

    expect(result.length).toBe(1);
    expect(result[0].matchedCharacters).toBe(1); // Only compared 1
    expect(result[0].totalCharacters).toBe(1);
  });

  it("returns deserialized characters in results", () => {
    const sourceChars = [createMockCharacter(8, 8, "filled")];
    const sourceConfig = createMockConfig();
    const librarySet = createMockSerializedCharacterSet({
      metadata: { id: "test", name: "Test Set" },
      characters: [createMockCharacter(8, 8, "diagonal")],
    });

    const result = calculateSimilarities(sourceChars, sourceConfig, [
      librarySet,
    ]);

    expect(result.length).toBe(1);
    expect(result[0].characters).toBeDefined();
    expect(result[0].characters.length).toBe(1);
    expect(result[0].characters[0].pixels).toBeDefined();
  });

  it("includes metadata in results", () => {
    const sourceChars = [createMockCharacter(8, 8, "filled")];
    const sourceConfig = createMockConfig();
    const librarySet = createMockSerializedCharacterSet({
      metadata: {
        id: "test",
        name: "My Test Set",
        manufacturer: "Test Corp",
        system: "Test System",
        isBuiltIn: true,
      },
      characters: [createMockCharacter(8, 8, "filled")],
    });

    const result = calculateSimilarities(sourceChars, sourceConfig, [
      librarySet,
    ]);

    expect(result.length).toBe(1);
    expect(result[0].characterSetName).toBe("My Test Set");
    expect(result[0].metadata.manufacturer).toBe("Test Corp");
    expect(result[0].metadata.system).toBe("Test System");
    expect(result[0].metadata.isBuiltIn).toBe(true);
  });
});
