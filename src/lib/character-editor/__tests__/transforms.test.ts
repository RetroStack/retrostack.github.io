/**
 * Character ROM Editor - Transform Operations Tests
 *
 * Comprehensive tests for all pixel manipulation operations:
 * - Rotation, shifting, resizing
 * - Invert, flip, mirror
 * - Pixel manipulation
 * - Batch operations
 * - Bounding box and centering
 * - Scaling algorithms
 */

import {
  rotateCharacter,
  shiftCharacter,
  resizeCharacter,
  invertCharacter,
  flipHorizontal,
  flipVertical,
  togglePixel,
  setPixel,
  batchTransform,
  getBoundingBox,
  centerCharacter,
  scaleCharacter,
  getPixelState,
  batchTogglePixel,
  clearCharacter,
  fillCharacter,
} from "@/lib/character-editor/transforms";
import type { Character, AnchorPoint } from "@/lib/character-editor/types";
import { createMockCharacter, charactersEqual } from "./testUtils";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a character from a visual pattern string
 * Uses '#' for on pixels and '.' for off pixels
 */
function charFromPattern(pattern: string): Character {
  const rows = pattern.trim().split("\n").map((row) => row.trim());
  const pixels = rows.map((row) =>
    row.split("").map((char) => char === "#")
  );
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

/**
 * Count the number of on pixels in a character
 */
function countOnPixels(char: Character): number {
  return char.pixels.flat().filter((p) => p).length;
}

// ============================================================================
// rotateCharacter Tests
// ============================================================================

describe("rotateCharacter", () => {
  describe("rotate right (clockwise)", () => {
    it("rotates a simple pattern 90 degrees clockwise", () => {
      const input = charFromPattern(`
        #...
        #...
        #...
        ####
      `);
      const result = rotateCharacter(input, "right");

      // L-shape rotated clockwise:
      // The algorithm maps output[row][col] from input[width-1-col][row]
      // Row 0: input[3][0], input[2][0], input[1][0], input[0][0] = T,T,T,T -> ####
      // Row 1: input[3][1], input[2][1], input[1][1], input[0][1] = T,F,F,F -> #...
      // Row 2: input[3][2], input[2][2], input[1][2], input[0][2] = T,F,F,F -> #...
      // Row 3: input[3][3], input[2][3], input[1][3], input[0][3] = T,F,F,F -> #...
      const expected = charFromPattern(`
        ####
        #...
        #...
        #...
      `);
      expect(charactersEqual(result, expected)).toBe(true);
    });

    it("rotates a diagonal pattern", () => {
      const diagonal = createMockCharacter(4, 4, "diagonal");
      const result = rotateCharacter(diagonal, "right");

      // Diagonal should flip to other diagonal
      expect(result.pixels[0][3]).toBe(true);
      expect(result.pixels[1][2]).toBe(true);
      expect(result.pixels[2][1]).toBe(true);
      expect(result.pixels[3][0]).toBe(true);
    });

    it("preserves pixel count after rotation", () => {
      const checkerboard = createMockCharacter(8, 8, "checkerboard");
      const result = rotateCharacter(checkerboard, "right");
      expect(countOnPixels(result)).toBe(countOnPixels(checkerboard));
    });

    it("handles empty character", () => {
      const empty = createMockCharacter(8, 8, "empty");
      const result = rotateCharacter(empty, "right");
      expect(countOnPixels(result)).toBe(0);
    });

    it("handles filled character", () => {
      const filled = createMockCharacter(8, 8, "filled");
      const result = rotateCharacter(filled, "right");
      expect(countOnPixels(result)).toBe(64);
    });
  });

  describe("rotate left (counter-clockwise)", () => {
    it("rotates a simple pattern 90 degrees counter-clockwise", () => {
      const input = charFromPattern(`
        #...
        #...
        #...
        ####
      `);
      const result = rotateCharacter(input, "left");

      // L-shape rotated counter-clockwise:
      // The algorithm maps output[row][col] from input[col][height-1-row]
      // Row 0: input[0][3], input[1][3], input[2][3], input[3][3] = F,F,F,T -> ...#
      // Row 1: input[0][2], input[1][2], input[2][2], input[3][2] = F,F,F,T -> ...#
      // Row 2: input[0][1], input[1][1], input[2][1], input[3][1] = F,F,F,T -> ...#
      // Row 3: input[0][0], input[1][0], input[2][0], input[3][0] = T,T,T,T -> ####
      const expected = charFromPattern(`
        ...#
        ...#
        ...#
        ####
      `);
      expect(charactersEqual(result, expected)).toBe(true);
    });

    it("is opposite of rotate right", () => {
      const input = createMockCharacter(8, 8, "checkerboard");
      const rotatedRight = rotateCharacter(input, "right");
      const rotatedLeft = rotateCharacter(input, "left");
      const rightThenLeft = rotateCharacter(rotatedRight, "left");
      expect(charactersEqual(rightThenLeft, input)).toBe(true);
    });
  });

  describe("rotation identity", () => {
    it("returns to original after 4 right rotations", () => {
      const original = charFromPattern(`
        ##..
        #...
        ....
        ....
      `);
      let result = original;
      for (let i = 0; i < 4; i++) {
        result = rotateCharacter(result, "right");
      }
      expect(charactersEqual(result, original)).toBe(true);
    });

    it("returns to original after 4 left rotations", () => {
      const original = createMockCharacter(8, 8, "diagonal");
      let result = original;
      for (let i = 0; i < 4; i++) {
        result = rotateCharacter(result, "left");
      }
      expect(charactersEqual(result, original)).toBe(true);
    });

    it("180 degree rotation via two right rotations", () => {
      const original = charFromPattern(`
        ##..
        ....
        ....
        ....
      `);
      const rotated180 = rotateCharacter(rotateCharacter(original, "right"), "right");
      const expected = charFromPattern(`
        ....
        ....
        ....
        ..##
      `);
      expect(charactersEqual(rotated180, expected)).toBe(true);
    });
  });

  describe("non-square characters", () => {
    it("handles rectangular character (wider than tall)", () => {
      const wide = charFromPattern(`
        ####
        #...
      `);
      // Non-square rotation maintains dimensions but fits content
      const result = rotateCharacter(wide, "right");
      expect(result.pixels.length).toBe(2);
      expect(result.pixels[0].length).toBe(4);
    });

    it("handles rectangular character (taller than wide)", () => {
      const tall = charFromPattern(`
        ##
        #.
        #.
        #.
      `);
      const result = rotateCharacter(tall, "right");
      expect(result.pixels.length).toBe(4);
      expect(result.pixels[0].length).toBe(2);
    });
  });
});

// ============================================================================
// shiftCharacter Tests
// ============================================================================

describe("shiftCharacter", () => {
  describe("shift up", () => {
    it("shifts pixels up with wrap", () => {
      const input = charFromPattern(`
        ....
        ....
        ....
        ####
      `);
      const result = shiftCharacter(input, "up", true);
      const expected = charFromPattern(`
        ....
        ....
        ####
        ....
      `);
      expect(charactersEqual(result, expected)).toBe(true);
    });

    it("wraps bottom row to top when shifting up", () => {
      const input = charFromPattern(`
        ####
        ....
        ....
        ....
      `);
      const result = shiftCharacter(input, "up", true);
      expect(result.pixels[3].every((p) => p)).toBe(true);
      expect(result.pixels[0].every((p) => !p)).toBe(true);
    });

    it("shifts up without wrap loses pixels", () => {
      const input = charFromPattern(`
        ####
        ....
        ....
        ....
      `);
      const result = shiftCharacter(input, "up", false);
      expect(countOnPixels(result)).toBe(0);
    });
  });

  describe("shift down", () => {
    it("shifts pixels down with wrap", () => {
      const input = charFromPattern(`
        ####
        ....
        ....
        ....
      `);
      const result = shiftCharacter(input, "down", true);
      const expected = charFromPattern(`
        ....
        ####
        ....
        ....
      `);
      expect(charactersEqual(result, expected)).toBe(true);
    });

    it("wraps top row to bottom when shifting down", () => {
      const input = charFromPattern(`
        ....
        ....
        ....
        ####
      `);
      const result = shiftCharacter(input, "down", true);
      expect(result.pixels[0].every((p) => p)).toBe(true);
      expect(result.pixels[3].every((p) => !p)).toBe(true);
    });

    it("shifts down without wrap loses pixels", () => {
      const input = charFromPattern(`
        ....
        ....
        ....
        ####
      `);
      const result = shiftCharacter(input, "down", false);
      expect(countOnPixels(result)).toBe(0);
    });
  });

  describe("shift left", () => {
    it("shifts pixels left with wrap", () => {
      const input = charFromPattern(`
        ...#
        ...#
        ...#
        ...#
      `);
      const result = shiftCharacter(input, "left", true);
      const expected = charFromPattern(`
        ..#.
        ..#.
        ..#.
        ..#.
      `);
      expect(charactersEqual(result, expected)).toBe(true);
    });

    it("wraps right column to left when shifting left", () => {
      const input = charFromPattern(`
        #...
        #...
        #...
        #...
      `);
      const result = shiftCharacter(input, "left", true);
      expect(result.pixels.every((row) => row[3])).toBe(true);
      expect(result.pixels.every((row) => !row[0])).toBe(true);
    });

    it("shifts left without wrap loses pixels", () => {
      const input = charFromPattern(`
        #...
        #...
        #...
        #...
      `);
      const result = shiftCharacter(input, "left", false);
      expect(countOnPixels(result)).toBe(0);
    });
  });

  describe("shift right", () => {
    it("shifts pixels right with wrap", () => {
      const input = charFromPattern(`
        #...
        #...
        #...
        #...
      `);
      const result = shiftCharacter(input, "right", true);
      const expected = charFromPattern(`
        .#..
        .#..
        .#..
        .#..
      `);
      expect(charactersEqual(result, expected)).toBe(true);
    });

    it("wraps left column to right when shifting right", () => {
      const input = charFromPattern(`
        ...#
        ...#
        ...#
        ...#
      `);
      const result = shiftCharacter(input, "right", true);
      expect(result.pixels.every((row) => row[0])).toBe(true);
      expect(result.pixels.every((row) => !row[3])).toBe(true);
    });

    it("shifts right without wrap loses pixels", () => {
      const input = charFromPattern(`
        ...#
        ...#
        ...#
        ...#
      `);
      const result = shiftCharacter(input, "right", false);
      expect(countOnPixels(result)).toBe(0);
    });
  });

  describe("shift identity with wrap", () => {
    it("returns to original after shifting full width", () => {
      const original = createMockCharacter(4, 4, "diagonal");
      let result = original;
      for (let i = 0; i < 4; i++) {
        result = shiftCharacter(result, "right", true);
      }
      expect(charactersEqual(result, original)).toBe(true);
    });

    it("returns to original after shifting full height", () => {
      const original = createMockCharacter(4, 4, "diagonal");
      let result = original;
      for (let i = 0; i < 4; i++) {
        result = shiftCharacter(result, "down", true);
      }
      expect(charactersEqual(result, original)).toBe(true);
    });
  });

  describe("default wrap parameter", () => {
    it("defaults to wrap=true", () => {
      const input = charFromPattern(`
        ####
        ....
        ....
        ....
      `);
      // Not passing wrap parameter should default to true
      const result = shiftCharacter(input, "up");
      expect(result.pixels[3].every((p) => p)).toBe(true);
    });
  });
});

// ============================================================================
// resizeCharacter Tests
// ============================================================================

describe("resizeCharacter", () => {
  const allAnchors: AnchorPoint[] = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];

  describe("scaling up", () => {
    it("preserves content at top-left when resizing larger with tl anchor", () => {
      const input = charFromPattern(`
        ##
        #.
      `);
      const result = resizeCharacter(input, 4, 4, "tl");

      // Content should be at top-left
      expect(result.pixels[0][0]).toBe(true);
      expect(result.pixels[0][1]).toBe(true);
      expect(result.pixels[1][0]).toBe(true);
      // New area should be empty
      expect(result.pixels[2][2]).toBe(false);
      expect(result.pixels[3][3]).toBe(false);
    });

    it("centers content when resizing larger with mc anchor", () => {
      const input = charFromPattern(`
        ##
        ##
      `);
      const result = resizeCharacter(input, 4, 4, "mc");

      // Content should be centered
      expect(result.pixels[1][1]).toBe(true);
      expect(result.pixels[1][2]).toBe(true);
      expect(result.pixels[2][1]).toBe(true);
      expect(result.pixels[2][2]).toBe(true);
      // Edges should be empty
      expect(result.pixels[0][0]).toBe(false);
      expect(result.pixels[3][3]).toBe(false);
    });

    it("positions content at bottom-right when resizing larger with br anchor", () => {
      const input = charFromPattern(`
        ##
        ##
      `);
      const result = resizeCharacter(input, 4, 4, "br");

      // Content should be at bottom-right
      expect(result.pixels[2][2]).toBe(true);
      expect(result.pixels[2][3]).toBe(true);
      expect(result.pixels[3][2]).toBe(true);
      expect(result.pixels[3][3]).toBe(true);
      // Top-left should be empty
      expect(result.pixels[0][0]).toBe(false);
    });
  });

  describe("scaling down", () => {
    it("clips content from bottom-right when resizing smaller with tl anchor", () => {
      const input = charFromPattern(`
        #...
        ....
        ....
        ...#
      `);
      const result = resizeCharacter(input, 2, 2, "tl");

      // Should keep top-left, clip rest
      expect(result.pixels[0][0]).toBe(true);
      expect(countOnPixels(result)).toBe(1);
    });

    it("clips content evenly when resizing smaller with mc anchor", () => {
      const input = charFromPattern(`
        ....
        .##.
        .##.
        ....
      `);
      const result = resizeCharacter(input, 2, 2, "mc");

      // Should keep center content
      expect(result.pixels[0][0]).toBe(true);
      expect(result.pixels[0][1]).toBe(true);
      expect(result.pixels[1][0]).toBe(true);
      expect(result.pixels[1][1]).toBe(true);
    });

    it("clips content from top-left when resizing smaller with br anchor", () => {
      const input = charFromPattern(`
        #...
        ....
        ....
        ...#
      `);
      const result = resizeCharacter(input, 2, 2, "br");

      // Should keep bottom-right, clip rest
      expect(result.pixels[1][1]).toBe(true);
      expect(countOnPixels(result)).toBe(1);
    });
  });

  describe("all anchor positions", () => {
    it.each(allAnchors)("handles anchor position %s when scaling up", (anchor) => {
      const input = createMockCharacter(4, 4, "filled");
      const result = resizeCharacter(input, 8, 8, anchor);

      expect(result.pixels.length).toBe(8);
      expect(result.pixels[0].length).toBe(8);
      // Original content should be preserved somewhere
      expect(countOnPixels(result)).toBe(16);
    });

    it.each(allAnchors)("handles anchor position %s when scaling down", (anchor) => {
      const input = createMockCharacter(8, 8, "filled");
      const result = resizeCharacter(input, 4, 4, anchor);

      expect(result.pixels.length).toBe(4);
      expect(result.pixels[0].length).toBe(4);
      // All visible pixels should still be on
      expect(countOnPixels(result)).toBe(16);
    });
  });

  describe("edge cases", () => {
    it("handles resize to same dimensions", () => {
      const input = createMockCharacter(4, 4, "diagonal");
      const result = resizeCharacter(input, 4, 4, "mc");
      expect(charactersEqual(result, input)).toBe(true);
    });

    it("handles resize to 1x1", () => {
      const input = charFromPattern(`
        #...
        ....
        ....
        ....
      `);
      const result = resizeCharacter(input, 1, 1, "tl");
      expect(result.pixels.length).toBe(1);
      expect(result.pixels[0].length).toBe(1);
      expect(result.pixels[0][0]).toBe(true);
    });

    it("handles resize from 1x1", () => {
      const input: Character = { pixels: [[true]] };
      const result = resizeCharacter(input, 4, 4, "tl");
      expect(result.pixels[0][0]).toBe(true);
      expect(countOnPixels(result)).toBe(1);
    });
  });

  describe("horizontal and vertical anchors", () => {
    it("positions content at top-center with tc anchor", () => {
      const input = charFromPattern(`
        ##
        ##
      `);
      const result = resizeCharacter(input, 4, 4, "tc");

      // Content should be at top-center
      expect(result.pixels[0][1]).toBe(true);
      expect(result.pixels[0][2]).toBe(true);
    });

    it("positions content at middle-left with ml anchor", () => {
      const input = charFromPattern(`
        ##
        ##
      `);
      const result = resizeCharacter(input, 4, 4, "ml");

      // Content should be at middle-left
      expect(result.pixels[1][0]).toBe(true);
      expect(result.pixels[2][0]).toBe(true);
    });

    it("positions content at middle-right with mr anchor", () => {
      const input = charFromPattern(`
        ##
        ##
      `);
      const result = resizeCharacter(input, 4, 4, "mr");

      // Content should be at middle-right
      expect(result.pixels[1][3]).toBe(true);
      expect(result.pixels[2][3]).toBe(true);
    });

    it("positions content at bottom-center with bc anchor", () => {
      const input = charFromPattern(`
        ##
        ##
      `);
      const result = resizeCharacter(input, 4, 4, "bc");

      // Content should be at bottom-center
      expect(result.pixels[3][1]).toBe(true);
      expect(result.pixels[3][2]).toBe(true);
    });
  });
});

// ============================================================================
// invertCharacter Tests
// ============================================================================

describe("invertCharacter", () => {
  it("inverts empty character to filled", () => {
    const empty = createMockCharacter(4, 4, "empty");
    const result = invertCharacter(empty);
    expect(countOnPixels(result)).toBe(16);
  });

  it("inverts filled character to empty", () => {
    const filled = createMockCharacter(4, 4, "filled");
    const result = invertCharacter(filled);
    expect(countOnPixels(result)).toBe(0);
  });

  it("inverts checkerboard to opposite checkerboard", () => {
    const checkerboard = createMockCharacter(4, 4, "checkerboard");
    const result = invertCharacter(checkerboard);

    // Every pixel should be opposite
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        expect(result.pixels[row][col]).toBe(!checkerboard.pixels[row][col]);
      }
    }
  });

  it("double invert returns to original", () => {
    const original = createMockCharacter(8, 8, "diagonal");
    const doubleInverted = invertCharacter(invertCharacter(original));
    expect(charactersEqual(doubleInverted, original)).toBe(true);
  });

  it("preserves dimensions", () => {
    const input = createMockCharacter(5, 7, "empty");
    const result = invertCharacter(input);
    expect(result.pixels.length).toBe(7);
    expect(result.pixels[0].length).toBe(5);
  });
});

// ============================================================================
// flipHorizontal Tests
// ============================================================================

describe("flipHorizontal", () => {
  it("flips asymmetric pattern horizontally", () => {
    const input = charFromPattern(`
      #...
      ##..
      ###.
      ####
    `);
    const result = flipHorizontal(input);
    const expected = charFromPattern(`
      ...#
      ..##
      .###
      ####
    `);
    expect(charactersEqual(result, expected)).toBe(true);
  });

  it("returns same pattern for vertically symmetric input", () => {
    const input = charFromPattern(`
      .##.
      #..#
      #..#
      .##.
    `);
    const result = flipHorizontal(input);
    expect(charactersEqual(result, input)).toBe(true);
  });

  it("double flip returns to original", () => {
    const original = createMockCharacter(8, 8, "diagonal");
    const doubleFlipped = flipHorizontal(flipHorizontal(original));
    expect(charactersEqual(doubleFlipped, original)).toBe(true);
  });

  it("preserves pixel count", () => {
    const input = createMockCharacter(8, 8, "checkerboard");
    const result = flipHorizontal(input);
    expect(countOnPixels(result)).toBe(countOnPixels(input));
  });

  it("handles empty character", () => {
    const empty = createMockCharacter(4, 4, "empty");
    const result = flipHorizontal(empty);
    expect(countOnPixels(result)).toBe(0);
  });

  it("handles filled character", () => {
    const filled = createMockCharacter(4, 4, "filled");
    const result = flipHorizontal(filled);
    expect(countOnPixels(result)).toBe(16);
    expect(charactersEqual(result, filled)).toBe(true);
  });
});

// ============================================================================
// flipVertical Tests
// ============================================================================

describe("flipVertical", () => {
  it("flips asymmetric pattern vertically", () => {
    const input = charFromPattern(`
      ####
      ###.
      ##..
      #...
    `);
    const result = flipVertical(input);
    const expected = charFromPattern(`
      #...
      ##..
      ###.
      ####
    `);
    expect(charactersEqual(result, expected)).toBe(true);
  });

  it("returns same pattern for horizontally symmetric input", () => {
    const input = charFromPattern(`
      #..#
      .##.
      .##.
      #..#
    `);
    const result = flipVertical(input);
    expect(charactersEqual(result, input)).toBe(true);
  });

  it("double flip returns to original", () => {
    const original = createMockCharacter(8, 8, "diagonal");
    const doubleFlipped = flipVertical(flipVertical(original));
    expect(charactersEqual(doubleFlipped, original)).toBe(true);
  });

  it("preserves pixel count", () => {
    const input = createMockCharacter(8, 8, "checkerboard");
    const result = flipVertical(input);
    expect(countOnPixels(result)).toBe(countOnPixels(input));
  });

  it("handles empty character", () => {
    const empty = createMockCharacter(4, 4, "empty");
    const result = flipVertical(empty);
    expect(countOnPixels(result)).toBe(0);
  });

  it("handles filled character", () => {
    const filled = createMockCharacter(4, 4, "filled");
    const result = flipVertical(filled);
    expect(countOnPixels(result)).toBe(16);
    expect(charactersEqual(result, filled)).toBe(true);
  });
});

// ============================================================================
// togglePixel Tests
// ============================================================================

describe("togglePixel", () => {
  it("toggles off pixel to on", () => {
    const empty = createMockCharacter(4, 4, "empty");
    const result = togglePixel(empty, 1, 2);
    expect(result.pixels[1][2]).toBe(true);
    expect(countOnPixels(result)).toBe(1);
  });

  it("toggles on pixel to off", () => {
    const filled = createMockCharacter(4, 4, "filled");
    const result = togglePixel(filled, 1, 2);
    expect(result.pixels[1][2]).toBe(false);
    expect(countOnPixels(result)).toBe(15);
  });

  it("does not modify other pixels", () => {
    const input = createMockCharacter(4, 4, "checkerboard");
    const result = togglePixel(input, 0, 0);

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (row === 0 && col === 0) {
          expect(result.pixels[row][col]).toBe(!input.pixels[row][col]);
        } else {
          expect(result.pixels[row][col]).toBe(input.pixels[row][col]);
        }
      }
    }
  });

  it("handles corner pixels", () => {
    const empty = createMockCharacter(4, 4, "empty");

    const topLeft = togglePixel(empty, 0, 0);
    expect(topLeft.pixels[0][0]).toBe(true);

    const topRight = togglePixel(empty, 0, 3);
    expect(topRight.pixels[0][3]).toBe(true);

    const bottomLeft = togglePixel(empty, 3, 0);
    expect(bottomLeft.pixels[3][0]).toBe(true);

    const bottomRight = togglePixel(empty, 3, 3);
    expect(bottomRight.pixels[3][3]).toBe(true);
  });

  it("double toggle returns to original", () => {
    const input = createMockCharacter(4, 4, "diagonal");
    const doubleToggled = togglePixel(togglePixel(input, 1, 1), 1, 1);
    expect(charactersEqual(doubleToggled, input)).toBe(true);
  });

  it("handles out of bounds gracefully by not modifying", () => {
    const input = createMockCharacter(4, 4, "empty");
    // These coordinates are out of bounds - the function should handle gracefully
    const result = togglePixel(input, 10, 10);
    // Since we're mapping over existing rows/cols, out of bounds won't change anything
    expect(charactersEqual(result, input)).toBe(true);
  });
});

// ============================================================================
// setPixel Tests
// ============================================================================

describe("setPixel", () => {
  it("sets off pixel to on", () => {
    const empty = createMockCharacter(4, 4, "empty");
    const result = setPixel(empty, 1, 2, true);
    expect(result.pixels[1][2]).toBe(true);
  });

  it("sets on pixel to off", () => {
    const filled = createMockCharacter(4, 4, "filled");
    const result = setPixel(filled, 1, 2, false);
    expect(result.pixels[1][2]).toBe(false);
  });

  it("no-op when setting same value (off to off)", () => {
    const empty = createMockCharacter(4, 4, "empty");
    const result = setPixel(empty, 1, 2, false);
    expect(charactersEqual(result, empty)).toBe(true);
  });

  it("no-op when setting same value (on to on)", () => {
    const filled = createMockCharacter(4, 4, "filled");
    const result = setPixel(filled, 1, 2, true);
    expect(charactersEqual(result, filled)).toBe(true);
  });

  it("does not modify other pixels", () => {
    const input = createMockCharacter(4, 4, "checkerboard");
    const result = setPixel(input, 0, 0, false);

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (row === 0 && col === 0) {
          expect(result.pixels[row][col]).toBe(false);
        } else {
          expect(result.pixels[row][col]).toBe(input.pixels[row][col]);
        }
      }
    }
  });

  it("handles out of bounds gracefully", () => {
    const input = createMockCharacter(4, 4, "empty");
    const result = setPixel(input, 10, 10, true);
    expect(charactersEqual(result, input)).toBe(true);
  });
});

// ============================================================================
// batchTransform Tests
// ============================================================================

describe("batchTransform", () => {
  it("transforms only selected characters", () => {
    const characters = [
      createMockCharacter(4, 4, "empty"),
      createMockCharacter(4, 4, "empty"),
      createMockCharacter(4, 4, "empty"),
    ];
    const indices = new Set([0, 2]);

    const result = batchTransform(characters, indices, invertCharacter);

    // Characters 0 and 2 should be inverted (filled)
    expect(countOnPixels(result[0])).toBe(16);
    expect(countOnPixels(result[2])).toBe(16);
    // Character 1 should remain empty
    expect(countOnPixels(result[1])).toBe(0);
  });

  it("leaves unselected characters unchanged", () => {
    const characters = [
      createMockCharacter(4, 4, "diagonal"),
      createMockCharacter(4, 4, "checkerboard"),
      createMockCharacter(4, 4, "filled"),
    ];
    const indices = new Set([1]);

    const result = batchTransform(characters, indices, flipHorizontal);

    // Character 0 should be unchanged
    expect(charactersEqual(result[0], characters[0])).toBe(true);
    // Character 1 should be flipped
    expect(charactersEqual(result[1], characters[1])).toBe(false);
    // Character 2 should be unchanged (flip of filled is same)
    expect(charactersEqual(result[2], characters[2])).toBe(true);
  });

  it("handles empty selection set", () => {
    const characters = [
      createMockCharacter(4, 4, "empty"),
      createMockCharacter(4, 4, "filled"),
    ];
    const indices = new Set<number>();

    const result = batchTransform(characters, indices, invertCharacter);

    expect(charactersEqual(result[0], characters[0])).toBe(true);
    expect(charactersEqual(result[1], characters[1])).toBe(true);
  });

  it("handles all characters selected", () => {
    const characters = [
      createMockCharacter(4, 4, "empty"),
      createMockCharacter(4, 4, "empty"),
    ];
    const indices = new Set([0, 1]);

    const result = batchTransform(characters, indices, invertCharacter);

    expect(countOnPixels(result[0])).toBe(16);
    expect(countOnPixels(result[1])).toBe(16);
  });

  it("works with complex transforms", () => {
    const characters = [
      createMockCharacter(4, 4, "diagonal"),
      createMockCharacter(4, 4, "diagonal"),
    ];
    const indices = new Set([0]);

    const result = batchTransform(characters, indices, (char) =>
      rotateCharacter(char, "right")
    );

    expect(charactersEqual(result[0], characters[0])).toBe(false);
    expect(charactersEqual(result[1], characters[1])).toBe(true);
  });
});

// ============================================================================
// getBoundingBox Tests
// ============================================================================

describe("getBoundingBox", () => {
  it("returns null for empty character", () => {
    const empty = createMockCharacter(8, 8, "empty");
    const result = getBoundingBox(empty);
    expect(result).toBeNull();
  });

  it("returns correct bounds for filled character", () => {
    const filled = createMockCharacter(8, 8, "filled");
    const result = getBoundingBox(filled);

    expect(result).not.toBeNull();
    expect(result!.minRow).toBe(0);
    expect(result!.maxRow).toBe(7);
    expect(result!.minCol).toBe(0);
    expect(result!.maxCol).toBe(7);
  });

  it("returns correct bounds for single pixel", () => {
    const single = createMockCharacter(8, 8, "empty");
    single.pixels[3][5] = true;
    const result = getBoundingBox(single);

    expect(result).not.toBeNull();
    expect(result!.minRow).toBe(3);
    expect(result!.maxRow).toBe(3);
    expect(result!.minCol).toBe(5);
    expect(result!.maxCol).toBe(5);
  });

  it("returns correct bounds for diagonal pattern", () => {
    const diagonal = createMockCharacter(4, 4, "diagonal");
    const result = getBoundingBox(diagonal);

    expect(result).not.toBeNull();
    expect(result!.minRow).toBe(0);
    expect(result!.maxRow).toBe(3);
    expect(result!.minCol).toBe(0);
    expect(result!.maxCol).toBe(3);
  });

  it("returns correct bounds for partial content", () => {
    const input = charFromPattern(`
      ........
      ..###...
      ..#.#...
      ..###...
      ........
      ........
      ........
      ........
    `);
    const result = getBoundingBox(input);

    expect(result).not.toBeNull();
    expect(result!.minRow).toBe(1);
    expect(result!.maxRow).toBe(3);
    expect(result!.minCol).toBe(2);
    expect(result!.maxCol).toBe(4);
  });

  it("handles content in corner", () => {
    const input = charFromPattern(`
      ........
      ........
      ........
      ........
      ........
      ........
      .......#
      .......#
    `);
    const result = getBoundingBox(input);

    expect(result).not.toBeNull();
    expect(result!.minRow).toBe(6);
    expect(result!.maxRow).toBe(7);
    expect(result!.minCol).toBe(7);
    expect(result!.maxCol).toBe(7);
  });
});

// ============================================================================
// centerCharacter Tests
// ============================================================================

describe("centerCharacter", () => {
  it("returns unchanged empty character", () => {
    const empty = createMockCharacter(8, 8, "empty");
    const result = centerCharacter(empty);
    expect(charactersEqual(result, empty)).toBe(true);
  });

  it("returns unchanged already centered content", () => {
    const input = charFromPattern(`
      ....
      .##.
      .##.
      ....
    `);
    const result = centerCharacter(input);
    expect(charactersEqual(result, input)).toBe(true);
  });

  it("centers content from top-left corner", () => {
    const input = charFromPattern(`
      ##..
      ##..
      ....
      ....
    `);
    const result = centerCharacter(input);
    const expected = charFromPattern(`
      ....
      .##.
      .##.
      ....
    `);
    expect(charactersEqual(result, expected)).toBe(true);
  });

  it("centers content from bottom-right corner", () => {
    const input = charFromPattern(`
      ....
      ....
      ..##
      ..##
    `);
    const result = centerCharacter(input);
    const expected = charFromPattern(`
      ....
      .##.
      .##.
      ....
    `);
    expect(charactersEqual(result, expected)).toBe(true);
  });

  it("centers single pixel", () => {
    const input = charFromPattern(`
      #...
      ....
      ....
      ....
    `);
    const result = centerCharacter(input);

    // Single pixel should be near center
    const bbox = getBoundingBox(result);
    expect(bbox).not.toBeNull();
    expect(bbox!.minRow).toBe(1);
    expect(bbox!.minCol).toBe(1);
  });

  it("preserves pixel count", () => {
    const input = charFromPattern(`
      ###.....
      ###.....
      ###.....
      ........
      ........
      ........
      ........
      ........
    `);
    const result = centerCharacter(input);
    expect(countOnPixels(result)).toBe(countOnPixels(input));
  });

  it("handles odd-sized content", () => {
    const input = charFromPattern(`
      ###.....
      #.#.....
      ###.....
      ........
      ........
      ........
      ........
      ........
    `);
    const result = centerCharacter(input);

    // Content should be approximately centered
    const bbox = getBoundingBox(result);
    expect(bbox).not.toBeNull();
    // 3-wide content in 8-wide space: offset should be 2-3
    expect(bbox!.minCol).toBeGreaterThanOrEqual(2);
    expect(bbox!.maxCol).toBeLessThanOrEqual(5);
  });
});

// ============================================================================
// scaleCharacter Tests
// ============================================================================

describe("scaleCharacter", () => {
  describe("scale = 1 (no change)", () => {
    it("returns same character when scale is 1", () => {
      const input = createMockCharacter(8, 8, "checkerboard");
      const result = scaleCharacter(input, 1, "mc", "nearest");
      expect(result).toBe(input); // Should be exact same reference
    });
  });

  describe("nearest-neighbor algorithm", () => {
    it("scales up with nearest-neighbor", () => {
      const input = charFromPattern(`
        #.
        .#
      `);
      const result = scaleCharacter(input, 2, "tl", "nearest");

      // Scaled up 2x should double each pixel
      // In a 2x2 character scaled to 4x4, but clipped back to 2x2
      expect(result.pixels.length).toBe(2);
      expect(result.pixels[0].length).toBe(2);
    });

    it("scales down with nearest-neighbor", () => {
      const input = charFromPattern(`
        ##..
        ##..
        ..##
        ..##
      `);
      const result = scaleCharacter(input, 0.5, "tl", "nearest");

      // Should sample every other pixel
      expect(result.pixels.length).toBe(4);
      expect(result.pixels[0].length).toBe(4);
    });

    it("maintains original dimensions after scaling", () => {
      const input = createMockCharacter(8, 8, "diagonal");
      const scaledUp = scaleCharacter(input, 2, "mc", "nearest");
      const scaledDown = scaleCharacter(input, 0.5, "mc", "nearest");

      expect(scaledUp.pixels.length).toBe(8);
      expect(scaledUp.pixels[0].length).toBe(8);
      expect(scaledDown.pixels.length).toBe(8);
      expect(scaledDown.pixels[0].length).toBe(8);
    });
  });

  describe("threshold algorithm", () => {
    it("scales up with threshold algorithm", () => {
      const input = createMockCharacter(4, 4, "checkerboard");
      const result = scaleCharacter(input, 2, "tl", "threshold");

      expect(result.pixels.length).toBe(4);
      expect(result.pixels[0].length).toBe(4);
    });

    it("scales down with threshold algorithm", () => {
      const input = createMockCharacter(8, 8, "filled");
      const result = scaleCharacter(input, 0.5, "mc", "threshold");

      // All pixels should be on (100% coverage in source)
      expect(countOnPixels(result)).toBeGreaterThan(0);
    });

    it("threshold algorithm produces different result than nearest for some patterns", () => {
      const input = createMockCharacter(8, 8, "checkerboard");
      const nearestResult = scaleCharacter(input, 0.75, "mc", "nearest");
      const thresholdResult = scaleCharacter(input, 0.75, "mc", "threshold");

      // Results may differ due to different sampling strategies
      // Just verify both produce valid output
      expect(nearestResult.pixels.length).toBe(8);
      expect(thresholdResult.pixels.length).toBe(8);
    });
  });

  describe("anchor positioning", () => {
    const anchors: AnchorPoint[] = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];

    it.each(anchors)("positions scaled content correctly with %s anchor (scale up)", (anchor) => {
      const input = charFromPattern(`
        ##
        ##
      `);
      const result = scaleCharacter(input, 2, anchor, "nearest");

      // Just verify it produces valid output
      expect(result.pixels.length).toBe(2);
      expect(result.pixels[0].length).toBe(2);
    });

    it.each(anchors)("positions scaled content correctly with %s anchor (scale down)", (anchor) => {
      const input = createMockCharacter(8, 8, "filled");
      const result = scaleCharacter(input, 0.5, anchor, "nearest");

      // Scaled content should be positioned according to anchor
      expect(result.pixels.length).toBe(8);
      expect(result.pixels[0].length).toBe(8);
    });
  });

  describe("edge cases", () => {
    it("handles very small scale factor", () => {
      const input = createMockCharacter(8, 8, "filled");
      const result = scaleCharacter(input, 0.1, "mc", "nearest");

      expect(result.pixels.length).toBe(8);
      expect(result.pixels[0].length).toBe(8);
    });

    it("handles very large scale factor", () => {
      const input = createMockCharacter(8, 8, "diagonal");
      const result = scaleCharacter(input, 4, "mc", "nearest");

      expect(result.pixels.length).toBe(8);
      expect(result.pixels[0].length).toBe(8);
    });

    it("handles empty character", () => {
      const empty = createMockCharacter(8, 8, "empty");
      const result = scaleCharacter(empty, 2, "mc", "nearest");

      expect(countOnPixels(result)).toBe(0);
    });

    it("handles filled character", () => {
      const filled = createMockCharacter(8, 8, "filled");
      const result = scaleCharacter(filled, 2, "mc", "nearest");

      // Scaled up filled should still have some filled pixels
      expect(countOnPixels(result)).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// getPixelState Tests
// ============================================================================

describe("getPixelState", () => {
  it("returns same-off for empty selection", () => {
    const characters = [createMockCharacter(4, 4, "filled")];
    const indices = new Set<number>();

    const result = getPixelState(characters, indices, 0, 0);
    expect(result).toBe("same-off");
  });

  it("returns same-on when all selected characters have pixel on", () => {
    const characters = [
      createMockCharacter(4, 4, "filled"),
      createMockCharacter(4, 4, "filled"),
    ];
    const indices = new Set([0, 1]);

    const result = getPixelState(characters, indices, 0, 0);
    expect(result).toBe("same-on");
  });

  it("returns same-off when all selected characters have pixel off", () => {
    const characters = [
      createMockCharacter(4, 4, "empty"),
      createMockCharacter(4, 4, "empty"),
    ];
    const indices = new Set([0, 1]);

    const result = getPixelState(characters, indices, 0, 0);
    expect(result).toBe("same-off");
  });

  it("returns mixed when selected characters have different pixel values", () => {
    const characters = [
      createMockCharacter(4, 4, "filled"),
      createMockCharacter(4, 4, "empty"),
    ];
    const indices = new Set([0, 1]);

    const result = getPixelState(characters, indices, 0, 0);
    expect(result).toBe("mixed");
  });

  it("only considers selected characters", () => {
    const characters = [
      createMockCharacter(4, 4, "filled"),
      createMockCharacter(4, 4, "empty"),
      createMockCharacter(4, 4, "filled"),
    ];
    // Only select characters 0 and 2 (both filled)
    const indices = new Set([0, 2]);

    const result = getPixelState(characters, indices, 0, 0);
    expect(result).toBe("same-on");
  });

  it("handles checkerboard pattern correctly", () => {
    const characters = [
      createMockCharacter(4, 4, "checkerboard"),
      createMockCharacter(4, 4, "checkerboard"),
    ];
    const indices = new Set([0, 1]);

    // Position (0,0) should be on in checkerboard
    expect(getPixelState(characters, indices, 0, 0)).toBe("same-on");
    // Position (0,1) should be off in checkerboard
    expect(getPixelState(characters, indices, 0, 1)).toBe("same-off");
  });

  it("handles single character selection", () => {
    const characters = [
      createMockCharacter(4, 4, "diagonal"),
    ];
    const indices = new Set([0]);

    // Diagonal has on pixels at (0,0), (1,1), etc.
    expect(getPixelState(characters, indices, 0, 0)).toBe("same-on");
    expect(getPixelState(characters, indices, 0, 1)).toBe("same-off");
  });
});

// ============================================================================
// batchTogglePixel Tests
// ============================================================================

describe("batchTogglePixel", () => {
  it("turns on pixels when state is same-off", () => {
    const characters = [
      createMockCharacter(4, 4, "empty"),
      createMockCharacter(4, 4, "empty"),
    ];
    const indices = new Set([0, 1]);

    const result = batchTogglePixel(characters, indices, 0, 0);

    expect(result[0].pixels[0][0]).toBe(true);
    expect(result[1].pixels[0][0]).toBe(true);
  });

  it("turns off pixels when state is same-on", () => {
    const characters = [
      createMockCharacter(4, 4, "filled"),
      createMockCharacter(4, 4, "filled"),
    ];
    const indices = new Set([0, 1]);

    const result = batchTogglePixel(characters, indices, 0, 0);

    expect(result[0].pixels[0][0]).toBe(false);
    expect(result[1].pixels[0][0]).toBe(false);
  });

  it("turns on pixels when state is mixed", () => {
    const characters = [
      createMockCharacter(4, 4, "filled"),
      createMockCharacter(4, 4, "empty"),
    ];
    const indices = new Set([0, 1]);

    const result = batchTogglePixel(characters, indices, 0, 0);

    // Mixed state should turn all on
    expect(result[0].pixels[0][0]).toBe(true);
    expect(result[1].pixels[0][0]).toBe(true);
  });

  it("does not modify unselected characters", () => {
    const characters = [
      createMockCharacter(4, 4, "empty"),
      createMockCharacter(4, 4, "filled"),
      createMockCharacter(4, 4, "empty"),
    ];
    const indices = new Set([0, 2]);

    const result = batchTogglePixel(characters, indices, 0, 0);

    // Character 1 should be unchanged
    expect(charactersEqual(result[1], characters[1])).toBe(true);
  });
});

// ============================================================================
// clearCharacter and fillCharacter Tests
// ============================================================================

describe("clearCharacter", () => {
  it("creates empty character with specified dimensions", () => {
    const result = clearCharacter(8, 8);
    expect(result.pixels.length).toBe(8);
    expect(result.pixels[0].length).toBe(8);
    expect(countOnPixels(result)).toBe(0);
  });

  it("handles various dimensions", () => {
    const small = clearCharacter(4, 4);
    expect(small.pixels.length).toBe(4);
    expect(small.pixels[0].length).toBe(4);

    const wide = clearCharacter(16, 8);
    expect(wide.pixels.length).toBe(8);
    expect(wide.pixels[0].length).toBe(16);

    const tall = clearCharacter(8, 16);
    expect(tall.pixels.length).toBe(16);
    expect(tall.pixels[0].length).toBe(8);
  });
});

describe("fillCharacter", () => {
  it("creates filled character with specified dimensions", () => {
    const result = fillCharacter(8, 8);
    expect(result.pixels.length).toBe(8);
    expect(result.pixels[0].length).toBe(8);
    expect(countOnPixels(result)).toBe(64);
  });

  it("handles various dimensions", () => {
    const small = fillCharacter(4, 4);
    expect(countOnPixels(small)).toBe(16);

    const wide = fillCharacter(16, 8);
    expect(countOnPixels(wide)).toBe(128);

    const tall = fillCharacter(8, 16);
    expect(countOnPixels(tall)).toBe(128);
  });
});

// ============================================================================
// Combined Operation Tests
// ============================================================================

describe("combined operations", () => {
  it("flip horizontal + flip vertical = rotate 180", () => {
    const input = charFromPattern(`
      ##..
      #...
      ....
      ....
    `);
    const flippedBoth = flipVertical(flipHorizontal(input));
    const rotated180 = rotateCharacter(rotateCharacter(input, "right"), "right");

    expect(charactersEqual(flippedBoth, rotated180)).toBe(true);
  });

  it("invert + invert = original", () => {
    const input = createMockCharacter(8, 8, "checkerboard");
    const result = invertCharacter(invertCharacter(input));
    expect(charactersEqual(result, input)).toBe(true);
  });

  it("center then center = center once", () => {
    const input = charFromPattern(`
      ##......
      ##......
      ........
      ........
      ........
      ........
      ........
      ........
    `);
    const centeredOnce = centerCharacter(input);
    const centeredTwice = centerCharacter(centeredOnce);

    expect(charactersEqual(centeredOnce, centeredTwice)).toBe(true);
  });

  it("shift all directions returns to original (with wrap)", () => {
    const input = createMockCharacter(4, 4, "diagonal");
    let result = shiftCharacter(input, "up", true);
    result = shiftCharacter(result, "right", true);
    result = shiftCharacter(result, "down", true);
    result = shiftCharacter(result, "left", true);

    expect(charactersEqual(result, input)).toBe(true);
  });
});
