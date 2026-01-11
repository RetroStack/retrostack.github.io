import {
  // Constants
  UNIFIED_DIMENSION_PRESETS,
  QUICK_DIMENSION_PRESETS,
  FONT_DIMENSION_PRESETS,
  UNIFIED_CHARACTER_COUNT_PRESETS,
  QUICK_CHARACTER_COUNT_PRESETS,
  CHARACTER_RANGE_PRESETS,
  ANCHOR_POSITION_PRESETS,
  // Functions
  findDimensionPreset,
  findCharacterCountPreset,
  isDimensionPreset,
  isCharacterCountPreset,
  getDimensionExamplesString,
  getCharacterCountExamplesString,
  formatDimensionPreset,
  getAnchorPositions,
  getAnchorPositionLabel,
} from "@/lib/character-editor/presets";

// ============================================================================
// UNIFIED_DIMENSION_PRESETS Tests
// ============================================================================

describe("UNIFIED_DIMENSION_PRESETS", () => {
  it("contains expected number of dimension presets", () => {
    expect(UNIFIED_DIMENSION_PRESETS.length).toBeGreaterThan(0);
    expect(UNIFIED_DIMENSION_PRESETS.length).toBe(15);
  });

  it("has required structure for all presets", () => {
    UNIFIED_DIMENSION_PRESETS.forEach((preset) => {
      expect(preset).toHaveProperty("width");
      expect(preset).toHaveProperty("height");
      expect(preset).toHaveProperty("label");
      expect(preset).toHaveProperty("examples");
      expect(preset).toHaveProperty("priority");

      expect(typeof preset.width).toBe("number");
      expect(typeof preset.height).toBe("number");
      expect(typeof preset.label).toBe("string");
      expect(Array.isArray(preset.examples)).toBe(true);
      expect(typeof preset.priority).toBe("number");
    });
  });

  it("has valid dimensions for all presets (positive integers)", () => {
    UNIFIED_DIMENSION_PRESETS.forEach((preset) => {
      expect(preset.width).toBeGreaterThan(0);
      expect(preset.height).toBeGreaterThan(0);
      expect(Number.isInteger(preset.width)).toBe(true);
      expect(Number.isInteger(preset.height)).toBe(true);
    });
  });

  it("has labels matching dimensions format", () => {
    UNIFIED_DIMENSION_PRESETS.forEach((preset) => {
      expect(preset.label).toBe(`${preset.width}x${preset.height}`);
    });
  });

  it("has priority values in valid range (0-3)", () => {
    UNIFIED_DIMENSION_PRESETS.forEach((preset) => {
      expect(preset.priority).toBeGreaterThanOrEqual(0);
      expect(preset.priority).toBeLessThanOrEqual(3);
    });
  });

  it("contains common retro computer formats", () => {
    const labels = UNIFIED_DIMENSION_PRESETS.map((p) => p.label);

    // Essential formats
    expect(labels).toContain("8x8");
    expect(labels).toContain("8x16");
    expect(labels).toContain("5x7");

    // Important formats
    expect(labels).toContain("5x8");
    expect(labels).toContain("5x9");
    expect(labels).toContain("8x14");

    // Additional formats
    expect(labels).toContain("16x16");
    expect(labels).toContain("32x32");
  });

  it("has recommendedFontSize for presets that have it defined", () => {
    const presetsWithFontSize = UNIFIED_DIMENSION_PRESETS.filter(
      (p) => p.recommendedFontSize !== undefined
    );

    presetsWithFontSize.forEach((preset) => {
      expect(preset.recommendedFontSize).toBeGreaterThan(0);
      expect(typeof preset.recommendedFontSize).toBe("number");
    });
  });

  it("has 8x8 preset with C64 as an example", () => {
    const preset8x8 = UNIFIED_DIMENSION_PRESETS.find((p) => p.label === "8x8");

    expect(preset8x8).toBeDefined();
    expect(preset8x8?.examples).toContain("C64");
    expect(preset8x8?.priority).toBe(3); // Essential
  });

  it("has 5x7 preset with Apple II as an example", () => {
    const preset5x7 = UNIFIED_DIMENSION_PRESETS.find((p) => p.label === "5x7");

    expect(preset5x7).toBeDefined();
    expect(preset5x7?.examples).toContain("Apple II");
    expect(preset5x7?.priority).toBe(3); // Essential
  });
});

// ============================================================================
// QUICK_DIMENSION_PRESETS Tests
// ============================================================================

describe("QUICK_DIMENSION_PRESETS", () => {
  it("contains only most common presets", () => {
    expect(QUICK_DIMENSION_PRESETS.length).toBe(3);
  });

  it("includes 8x8, 8x16, and 5x7 presets", () => {
    const labels = QUICK_DIMENSION_PRESETS.map((p) => p.label);

    expect(labels).toContain("8x8");
    expect(labels).toContain("8x16");
    expect(labels).toContain("5x7");
  });

  it("references presets from UNIFIED_DIMENSION_PRESETS", () => {
    QUICK_DIMENSION_PRESETS.forEach((preset) => {
      const unifiedPreset = UNIFIED_DIMENSION_PRESETS.find(
        (p) => p.label === preset.label
      );
      expect(unifiedPreset).toBe(preset);
    });
  });
});

// ============================================================================
// FONT_DIMENSION_PRESETS Tests
// ============================================================================

describe("FONT_DIMENSION_PRESETS", () => {
  it("contains presets suitable for font import", () => {
    expect(FONT_DIMENSION_PRESETS.length).toBeGreaterThan(0);
  });

  it("all presets have recommendedFontSize defined", () => {
    FONT_DIMENSION_PRESETS.forEach((preset) => {
      expect(preset.recommendedFontSize).toBeDefined();
      expect(preset.recommendedFontSize).toBeGreaterThan(0);
    });
  });

  it("references presets from UNIFIED_DIMENSION_PRESETS", () => {
    FONT_DIMENSION_PRESETS.forEach((preset) => {
      const unifiedPreset = UNIFIED_DIMENSION_PRESETS.find(
        (p) => p.label === preset.label
      );
      expect(unifiedPreset).toBe(preset);
    });
  });
});

// ============================================================================
// UNIFIED_CHARACTER_COUNT_PRESETS Tests
// ============================================================================

describe("UNIFIED_CHARACTER_COUNT_PRESETS", () => {
  it("contains expected number of character count presets", () => {
    expect(UNIFIED_CHARACTER_COUNT_PRESETS.length).toBeGreaterThan(0);
    expect(UNIFIED_CHARACTER_COUNT_PRESETS.length).toBe(6);
  });

  it("has required structure for all presets", () => {
    UNIFIED_CHARACTER_COUNT_PRESETS.forEach((preset) => {
      expect(preset).toHaveProperty("count");
      expect(preset).toHaveProperty("label");
      expect(preset).toHaveProperty("examples");
      expect(preset).toHaveProperty("priority");

      expect(typeof preset.count).toBe("number");
      expect(typeof preset.label).toBe("string");
      expect(Array.isArray(preset.examples)).toBe(true);
      expect(typeof preset.priority).toBe("number");
    });
  });

  it("has valid counts for all presets (positive integers)", () => {
    UNIFIED_CHARACTER_COUNT_PRESETS.forEach((preset) => {
      expect(preset.count).toBeGreaterThan(0);
      expect(Number.isInteger(preset.count)).toBe(true);
    });
  });

  it("has labels matching count as string", () => {
    UNIFIED_CHARACTER_COUNT_PRESETS.forEach((preset) => {
      expect(preset.label).toBe(String(preset.count));
    });
  });

  it("has priority values in valid range (0-3)", () => {
    UNIFIED_CHARACTER_COUNT_PRESETS.forEach((preset) => {
      expect(preset.priority).toBeGreaterThanOrEqual(0);
      expect(preset.priority).toBeLessThanOrEqual(3);
    });
  });

  it("contains common ROM character counts", () => {
    const counts = UNIFIED_CHARACTER_COUNT_PRESETS.map((p) => p.count);

    expect(counts).toContain(64);
    expect(counts).toContain(96);
    expect(counts).toContain(128);
    expect(counts).toContain(256);
  });

  it("has 256 preset with C64 as an example", () => {
    const preset256 = UNIFIED_CHARACTER_COUNT_PRESETS.find(
      (p) => p.count === 256
    );

    expect(preset256).toBeDefined();
    expect(preset256?.examples).toContain("C64");
    expect(preset256?.description).toBe("Full Set");
    expect(preset256?.priority).toBe(3); // Essential
  });

  it("has 128 preset with Atari as an example", () => {
    const preset128 = UNIFIED_CHARACTER_COUNT_PRESETS.find(
      (p) => p.count === 128
    );

    expect(preset128).toBeDefined();
    expect(preset128?.examples).toContain("Atari 400/800");
    expect(preset128?.description).toBe("Half ROM");
  });

  it("has optional description for presets", () => {
    UNIFIED_CHARACTER_COUNT_PRESETS.forEach((preset) => {
      if (preset.description !== undefined) {
        expect(typeof preset.description).toBe("string");
        expect(preset.description.length).toBeGreaterThan(0);
      }
    });
  });
});

// ============================================================================
// QUICK_CHARACTER_COUNT_PRESETS Tests
// ============================================================================

describe("QUICK_CHARACTER_COUNT_PRESETS", () => {
  it("is the same as UNIFIED_CHARACTER_COUNT_PRESETS", () => {
    expect(QUICK_CHARACTER_COUNT_PRESETS).toBe(UNIFIED_CHARACTER_COUNT_PRESETS);
  });
});

// ============================================================================
// CHARACTER_RANGE_PRESETS Tests
// ============================================================================

describe("CHARACTER_RANGE_PRESETS", () => {
  it("contains expected number of range presets", () => {
    expect(CHARACTER_RANGE_PRESETS.length).toBeGreaterThan(0);
    expect(CHARACTER_RANGE_PRESETS.length).toBe(6);
  });

  it("has required structure for all presets", () => {
    CHARACTER_RANGE_PRESETS.forEach((preset) => {
      expect(preset).toHaveProperty("name");
      expect(preset).toHaveProperty("startCode");
      expect(preset).toHaveProperty("endCode");
      expect(preset).toHaveProperty("count");

      expect(typeof preset.name).toBe("string");
      expect(typeof preset.startCode).toBe("number");
      expect(typeof preset.endCode).toBe("number");
      expect(typeof preset.count).toBe("number");
    });
  });

  it("has valid code ranges (start <= end)", () => {
    CHARACTER_RANGE_PRESETS.forEach((preset) => {
      expect(preset.startCode).toBeLessThanOrEqual(preset.endCode);
      expect(preset.startCode).toBeGreaterThanOrEqual(0);
      expect(preset.endCode).toBeLessThanOrEqual(255);
    });
  });

  it("has count matching the range (inclusive)", () => {
    CHARACTER_RANGE_PRESETS.forEach((preset) => {
      const expectedCount = preset.endCode - preset.startCode + 1;
      expect(preset.count).toBe(expectedCount);
    });
  });

  it("contains Printable ASCII preset (32-126)", () => {
    const printableAscii = CHARACTER_RANGE_PRESETS.find(
      (p) => p.name === "Printable ASCII"
    );

    expect(printableAscii).toBeDefined();
    expect(printableAscii?.startCode).toBe(32);
    expect(printableAscii?.endCode).toBe(126);
    expect(printableAscii?.count).toBe(95);
  });

  it("contains Full 256 preset (0-255)", () => {
    const full256 = CHARACTER_RANGE_PRESETS.find((p) => p.name === "Full 256");

    expect(full256).toBeDefined();
    expect(full256?.startCode).toBe(0);
    expect(full256?.endCode).toBe(255);
    expect(full256?.count).toBe(256);
  });

  it("contains uppercase and lowercase letter presets", () => {
    const uppercase = CHARACTER_RANGE_PRESETS.find(
      (p) => p.name === "Uppercase Only"
    );
    const lowercase = CHARACTER_RANGE_PRESETS.find(
      (p) => p.name === "Lowercase Only"
    );

    expect(uppercase).toBeDefined();
    expect(uppercase?.startCode).toBe(65); // 'A'
    expect(uppercase?.endCode).toBe(90); // 'Z'
    expect(uppercase?.count).toBe(26);

    expect(lowercase).toBeDefined();
    expect(lowercase?.startCode).toBe(97); // 'a'
    expect(lowercase?.endCode).toBe(122); // 'z'
    expect(lowercase?.count).toBe(26);
  });

  it("contains digits preset", () => {
    const digits = CHARACTER_RANGE_PRESETS.find((p) => p.name === "Digits Only");

    expect(digits).toBeDefined();
    expect(digits?.startCode).toBe(48); // '0'
    expect(digits?.endCode).toBe(57); // '9'
    expect(digits?.count).toBe(10);
  });
});

// ============================================================================
// ANCHOR_POSITION_PRESETS Tests
// ============================================================================

describe("ANCHOR_POSITION_PRESETS", () => {
  it("contains all 9 anchor positions (3x3 grid)", () => {
    expect(ANCHOR_POSITION_PRESETS.length).toBe(9);
  });

  it("has required structure for all presets", () => {
    ANCHOR_POSITION_PRESETS.forEach((preset) => {
      expect(preset).toHaveProperty("position");
      expect(preset).toHaveProperty("label");
      expect(preset).toHaveProperty("shortLabel");

      expect(typeof preset.position).toBe("string");
      expect(typeof preset.label).toBe("string");
      expect(typeof preset.shortLabel).toBe("string");
    });
  });

  it("contains all position codes", () => {
    const positions = ANCHOR_POSITION_PRESETS.map((p) => p.position);

    expect(positions).toContain("tl");
    expect(positions).toContain("tc");
    expect(positions).toContain("tr");
    expect(positions).toContain("ml");
    expect(positions).toContain("mc");
    expect(positions).toContain("mr");
    expect(positions).toContain("bl");
    expect(positions).toContain("bc");
    expect(positions).toContain("br");
  });

  it("has correct labels for each position", () => {
    const expectedLabels: Record<string, string> = {
      tl: "Top Left",
      tc: "Top Center",
      tr: "Top Right",
      ml: "Middle Left",
      mc: "Middle Center",
      mr: "Middle Right",
      bl: "Bottom Left",
      bc: "Bottom Center",
      br: "Bottom Right",
    };

    ANCHOR_POSITION_PRESETS.forEach((preset) => {
      expect(preset.label).toBe(expectedLabels[preset.position]);
    });
  });

  it("has correct short labels for each position", () => {
    const expectedShortLabels: Record<string, string> = {
      tl: "TL",
      tc: "TC",
      tr: "TR",
      ml: "ML",
      mc: "MC",
      mr: "MR",
      bl: "BL",
      bc: "BC",
      br: "BR",
    };

    ANCHOR_POSITION_PRESETS.forEach((preset) => {
      expect(preset.shortLabel).toBe(expectedShortLabels[preset.position]);
    });
  });

  it("is ordered row by row (top to bottom, left to right)", () => {
    const expectedOrder = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];

    ANCHOR_POSITION_PRESETS.forEach((preset, index) => {
      expect(preset.position).toBe(expectedOrder[index]);
    });
  });
});

// ============================================================================
// findDimensionPreset Tests
// ============================================================================

describe("findDimensionPreset", () => {
  it("finds 8x8 preset", () => {
    const preset = findDimensionPreset(8, 8);

    expect(preset).toBeDefined();
    expect(preset?.label).toBe("8x8");
    expect(preset?.width).toBe(8);
    expect(preset?.height).toBe(8);
  });

  it("finds 8x16 preset", () => {
    const preset = findDimensionPreset(8, 16);

    expect(preset).toBeDefined();
    expect(preset?.label).toBe("8x16");
  });

  it("finds 5x7 preset", () => {
    const preset = findDimensionPreset(5, 7);

    expect(preset).toBeDefined();
    expect(preset?.label).toBe("5x7");
  });

  it("finds 16x16 preset", () => {
    const preset = findDimensionPreset(16, 16);

    expect(preset).toBeDefined();
    expect(preset?.label).toBe("16x16");
  });

  it("finds 32x32 preset", () => {
    const preset = findDimensionPreset(32, 32);

    expect(preset).toBeDefined();
    expect(preset?.label).toBe("32x32");
  });

  it("returns undefined for non-existent preset", () => {
    const preset = findDimensionPreset(7, 7);

    expect(preset).toBeUndefined();
  });

  it("returns undefined for reversed dimensions", () => {
    // 8x16 exists but 16x8 does not
    const preset = findDimensionPreset(16, 8);

    expect(preset).toBeUndefined();
  });

  it("returns undefined for zero dimensions", () => {
    expect(findDimensionPreset(0, 0)).toBeUndefined();
    expect(findDimensionPreset(8, 0)).toBeUndefined();
    expect(findDimensionPreset(0, 8)).toBeUndefined();
  });

  it("returns undefined for negative dimensions", () => {
    expect(findDimensionPreset(-8, 8)).toBeUndefined();
    expect(findDimensionPreset(8, -8)).toBeUndefined();
    expect(findDimensionPreset(-8, -8)).toBeUndefined();
  });

  it("returns undefined for very large dimensions", () => {
    expect(findDimensionPreset(100, 100)).toBeUndefined();
    expect(findDimensionPreset(256, 256)).toBeUndefined();
  });

  it("finds all defined presets by their dimensions", () => {
    UNIFIED_DIMENSION_PRESETS.forEach((preset) => {
      const found = findDimensionPreset(preset.width, preset.height);
      expect(found).toBe(preset);
    });
  });
});

// ============================================================================
// findCharacterCountPreset Tests
// ============================================================================

describe("findCharacterCountPreset", () => {
  it("finds 256 character preset", () => {
    const preset = findCharacterCountPreset(256);

    expect(preset).toBeDefined();
    expect(preset?.count).toBe(256);
    expect(preset?.label).toBe("256");
  });

  it("finds 128 character preset", () => {
    const preset = findCharacterCountPreset(128);

    expect(preset).toBeDefined();
    expect(preset?.count).toBe(128);
  });

  it("finds 64 character preset", () => {
    const preset = findCharacterCountPreset(64);

    expect(preset).toBeDefined();
    expect(preset?.count).toBe(64);
  });

  it("finds 96 character preset", () => {
    const preset = findCharacterCountPreset(96);

    expect(preset).toBeDefined();
    expect(preset?.count).toBe(96);
  });

  it("finds 213 character preset (Intellivision)", () => {
    const preset = findCharacterCountPreset(213);

    expect(preset).toBeDefined();
    expect(preset?.count).toBe(213);
    expect(preset?.examples).toContain("Intellivision GROM");
  });

  it("finds 512 character preset", () => {
    const preset = findCharacterCountPreset(512);

    expect(preset).toBeDefined();
    expect(preset?.count).toBe(512);
  });

  it("returns undefined for non-existent preset", () => {
    const preset = findCharacterCountPreset(100);

    expect(preset).toBeUndefined();
  });

  it("returns undefined for zero count", () => {
    expect(findCharacterCountPreset(0)).toBeUndefined();
  });

  it("returns undefined for negative count", () => {
    expect(findCharacterCountPreset(-256)).toBeUndefined();
  });

  it("returns undefined for very large count", () => {
    expect(findCharacterCountPreset(10000)).toBeUndefined();
  });

  it("returns undefined for odd/custom counts", () => {
    expect(findCharacterCountPreset(1)).toBeUndefined();
    expect(findCharacterCountPreset(50)).toBeUndefined();
    expect(findCharacterCountPreset(200)).toBeUndefined();
    expect(findCharacterCountPreset(300)).toBeUndefined();
  });

  it("finds all defined presets by their count", () => {
    UNIFIED_CHARACTER_COUNT_PRESETS.forEach((preset) => {
      const found = findCharacterCountPreset(preset.count);
      expect(found).toBe(preset);
    });
  });
});

// ============================================================================
// isDimensionPreset Tests
// ============================================================================

describe("isDimensionPreset", () => {
  it("returns true for existing presets", () => {
    expect(isDimensionPreset(8, 8)).toBe(true);
    expect(isDimensionPreset(8, 16)).toBe(true);
    expect(isDimensionPreset(5, 7)).toBe(true);
    expect(isDimensionPreset(5, 8)).toBe(true);
    expect(isDimensionPreset(16, 16)).toBe(true);
    expect(isDimensionPreset(32, 32)).toBe(true);
  });

  it("returns false for non-existent presets", () => {
    expect(isDimensionPreset(7, 7)).toBe(false);
    expect(isDimensionPreset(9, 9)).toBe(false);
    expect(isDimensionPreset(10, 10)).toBe(false);
  });

  it("returns false for reversed dimensions", () => {
    expect(isDimensionPreset(16, 8)).toBe(false);
    expect(isDimensionPreset(7, 5)).toBe(false);
  });

  it("returns false for zero dimensions", () => {
    expect(isDimensionPreset(0, 0)).toBe(false);
    expect(isDimensionPreset(8, 0)).toBe(false);
    expect(isDimensionPreset(0, 8)).toBe(false);
  });

  it("returns false for negative dimensions", () => {
    expect(isDimensionPreset(-8, 8)).toBe(false);
    expect(isDimensionPreset(8, -8)).toBe(false);
  });

  it("returns consistent result with findDimensionPreset", () => {
    const testCases = [
      [8, 8],
      [8, 16],
      [5, 7],
      [7, 7],
      [10, 10],
      [0, 0],
      [-1, -1],
    ];

    testCases.forEach(([width, height]) => {
      const findResult = findDimensionPreset(width, height);
      const isPreset = isDimensionPreset(width, height);
      expect(isPreset).toBe(findResult !== undefined);
    });
  });
});

// ============================================================================
// isCharacterCountPreset Tests
// ============================================================================

describe("isCharacterCountPreset", () => {
  it("returns true for existing presets", () => {
    expect(isCharacterCountPreset(64)).toBe(true);
    expect(isCharacterCountPreset(96)).toBe(true);
    expect(isCharacterCountPreset(128)).toBe(true);
    expect(isCharacterCountPreset(213)).toBe(true);
    expect(isCharacterCountPreset(256)).toBe(true);
    expect(isCharacterCountPreset(512)).toBe(true);
  });

  it("returns false for non-existent presets", () => {
    expect(isCharacterCountPreset(100)).toBe(false);
    expect(isCharacterCountPreset(200)).toBe(false);
    expect(isCharacterCountPreset(300)).toBe(false);
  });

  it("returns false for zero count", () => {
    expect(isCharacterCountPreset(0)).toBe(false);
  });

  it("returns false for negative count", () => {
    expect(isCharacterCountPreset(-256)).toBe(false);
  });

  it("returns false for odd counts", () => {
    expect(isCharacterCountPreset(1)).toBe(false);
    expect(isCharacterCountPreset(127)).toBe(false);
    expect(isCharacterCountPreset(255)).toBe(false);
  });

  it("returns consistent result with findCharacterCountPreset", () => {
    const testCases = [64, 96, 128, 256, 512, 100, 200, 0, -1];

    testCases.forEach((count) => {
      const findResult = findCharacterCountPreset(count);
      const isPreset = isCharacterCountPreset(count);
      expect(isPreset).toBe(findResult !== undefined);
    });
  });
});

// ============================================================================
// getDimensionExamplesString Tests
// ============================================================================

describe("getDimensionExamplesString", () => {
  it("returns examples for 8x8 preset", () => {
    const examples = getDimensionExamplesString(8, 8);

    expect(examples).toContain("C64");
    expect(examples).toContain("ZX Spectrum");
  });

  it("returns examples for 5x7 preset", () => {
    const examples = getDimensionExamplesString(5, 7);

    expect(examples).toContain("Apple II");
    expect(examples).toContain("TRS-80 CoCo");
  });

  it("returns examples for 8x16 preset", () => {
    const examples = getDimensionExamplesString(8, 16);

    expect(examples).toContain("IBM VGA");
    expect(examples).toContain("PC BIOS");
  });

  it("returns comma-separated string", () => {
    const examples = getDimensionExamplesString(8, 8);

    expect(examples).toContain(", ");
  });

  it("returns empty string for non-existent preset", () => {
    const examples = getDimensionExamplesString(7, 7);

    expect(examples).toBe("");
  });

  it("returns empty string for preset with no examples", () => {
    // Find a preset with no examples (like 6x10)
    const emptyExamplePreset = UNIFIED_DIMENSION_PRESETS.find(
      (p) => p.examples.length === 0
    );

    if (emptyExamplePreset) {
      const examples = getDimensionExamplesString(
        emptyExamplePreset.width,
        emptyExamplePreset.height
      );
      expect(examples).toBe("");
    }
  });

  it("returns single example without comma for preset with one example", () => {
    // Find a preset with exactly one example
    const singleExamplePreset = UNIFIED_DIMENSION_PRESETS.find(
      (p) => p.examples.length === 1
    );

    if (singleExamplePreset) {
      const examples = getDimensionExamplesString(
        singleExamplePreset.width,
        singleExamplePreset.height
      );
      expect(examples).not.toContain(",");
      expect(examples).toBe(singleExamplePreset.examples[0]);
    }
  });
});

// ============================================================================
// getCharacterCountExamplesString Tests
// ============================================================================

describe("getCharacterCountExamplesString", () => {
  it("returns examples for 256 preset", () => {
    const examples = getCharacterCountExamplesString(256);

    expect(examples).toContain("C64");
    expect(examples).toContain("VIC-20");
  });

  it("returns examples for 128 preset", () => {
    const examples = getCharacterCountExamplesString(128);

    expect(examples).toContain("Atari 400/800");
  });

  it("returns examples for 64 preset", () => {
    const examples = getCharacterCountExamplesString(64);

    expect(examples).toContain("Apple II");
  });

  it("returns comma-separated string", () => {
    const examples = getCharacterCountExamplesString(256);

    expect(examples).toContain(", ");
  });

  it("returns empty string for non-existent preset", () => {
    const examples = getCharacterCountExamplesString(100);

    expect(examples).toBe("");
  });

  it("returns empty string for preset with no examples", () => {
    // Find a preset with no examples
    const emptyExamplePreset = UNIFIED_CHARACTER_COUNT_PRESETS.find(
      (p) => p.examples.length === 0
    );

    if (emptyExamplePreset) {
      const examples = getCharacterCountExamplesString(emptyExamplePreset.count);
      expect(examples).toBe("");
    }
  });
});

// ============================================================================
// formatDimensionPreset Tests
// ============================================================================

describe("formatDimensionPreset", () => {
  it("formats preset with examples by default", () => {
    const preset = findDimensionPreset(8, 8)!;
    const formatted = formatDimensionPreset(preset);

    expect(formatted).toContain("8x8");
    expect(formatted).toContain("C64");
    expect(formatted).toContain("(");
    expect(formatted).toContain(")");
  });

  it("shows first example with ellipsis for multiple examples", () => {
    const preset = findDimensionPreset(8, 8)!;
    const formatted = formatDimensionPreset(preset);

    // 8x8 has many examples, so it should show ellipsis
    expect(formatted).toContain("...");
    // Should only show first example
    expect(formatted).toMatch(/8x8 \(C64\.\.\.\)/);
  });

  it("shows single example without ellipsis", () => {
    const singleExamplePreset = UNIFIED_DIMENSION_PRESETS.find(
      (p) => p.examples.length === 1
    );

    if (singleExamplePreset) {
      const formatted = formatDimensionPreset(singleExamplePreset);

      expect(formatted).not.toContain("...");
      expect(formatted).toContain(singleExamplePreset.examples[0]);
    }
  });

  it("formats preset without examples when showExamples is false", () => {
    const preset = findDimensionPreset(8, 8)!;
    const formatted = formatDimensionPreset(preset, { showExamples: false });

    expect(formatted).toBe("8x8");
    expect(formatted).not.toContain("C64");
    expect(formatted).not.toContain("(");
  });

  it("returns just label for preset with no examples", () => {
    const emptyExamplePreset = UNIFIED_DIMENSION_PRESETS.find(
      (p) => p.examples.length === 0
    );

    if (emptyExamplePreset) {
      const formatted = formatDimensionPreset(emptyExamplePreset);

      expect(formatted).toBe(emptyExamplePreset.label);
      expect(formatted).not.toContain("(");
    }
  });

  it("handles various presets correctly", () => {
    const testPresets = [
      { width: 5, height: 7, expectedLabel: "5x7" },
      { width: 8, height: 16, expectedLabel: "8x16" },
      { width: 16, height: 16, expectedLabel: "16x16" },
    ];

    testPresets.forEach(({ width, height, expectedLabel }) => {
      const preset = findDimensionPreset(width, height)!;
      const formatted = formatDimensionPreset(preset);

      expect(formatted).toContain(expectedLabel);
    });
  });
});

// ============================================================================
// getAnchorPositions Tests
// ============================================================================

describe("getAnchorPositions", () => {
  it("returns array of 9 anchor positions", () => {
    const positions = getAnchorPositions();

    expect(positions).toHaveLength(9);
  });

  it("returns all anchor position codes", () => {
    const positions = getAnchorPositions();

    expect(positions).toContain("tl");
    expect(positions).toContain("tc");
    expect(positions).toContain("tr");
    expect(positions).toContain("ml");
    expect(positions).toContain("mc");
    expect(positions).toContain("mr");
    expect(positions).toContain("bl");
    expect(positions).toContain("bc");
    expect(positions).toContain("br");
  });

  it("returns positions in grid order (row by row)", () => {
    const positions = getAnchorPositions();

    expect(positions[0]).toBe("tl");
    expect(positions[1]).toBe("tc");
    expect(positions[2]).toBe("tr");
    expect(positions[3]).toBe("ml");
    expect(positions[4]).toBe("mc");
    expect(positions[5]).toBe("mr");
    expect(positions[6]).toBe("bl");
    expect(positions[7]).toBe("bc");
    expect(positions[8]).toBe("br");
  });

  it("returns array matching ANCHOR_POSITION_PRESETS positions", () => {
    const positions = getAnchorPositions();
    const presetPositions = ANCHOR_POSITION_PRESETS.map((p) => p.position);

    expect(positions).toEqual(presetPositions);
  });

  it("returns a new array each time (not the same reference)", () => {
    const positions1 = getAnchorPositions();
    const positions2 = getAnchorPositions();

    expect(positions1).not.toBe(positions2);
    expect(positions1).toEqual(positions2);
  });
});

// ============================================================================
// getAnchorPositionLabel Tests
// ============================================================================

describe("getAnchorPositionLabel", () => {
  it("returns correct label for top-left", () => {
    expect(getAnchorPositionLabel("tl")).toBe("Top Left");
  });

  it("returns correct label for top-center", () => {
    expect(getAnchorPositionLabel("tc")).toBe("Top Center");
  });

  it("returns correct label for top-right", () => {
    expect(getAnchorPositionLabel("tr")).toBe("Top Right");
  });

  it("returns correct label for middle-left", () => {
    expect(getAnchorPositionLabel("ml")).toBe("Middle Left");
  });

  it("returns correct label for middle-center", () => {
    expect(getAnchorPositionLabel("mc")).toBe("Middle Center");
  });

  it("returns correct label for middle-right", () => {
    expect(getAnchorPositionLabel("mr")).toBe("Middle Right");
  });

  it("returns correct label for bottom-left", () => {
    expect(getAnchorPositionLabel("bl")).toBe("Bottom Left");
  });

  it("returns correct label for bottom-center", () => {
    expect(getAnchorPositionLabel("bc")).toBe("Bottom Center");
  });

  it("returns correct label for bottom-right", () => {
    expect(getAnchorPositionLabel("br")).toBe("Bottom Right");
  });

  it("returns all labels matching preset definitions", () => {
    ANCHOR_POSITION_PRESETS.forEach((preset) => {
      const label = getAnchorPositionLabel(preset.position);
      expect(label).toBe(preset.label);
    });
  });

  it("returns position code for unknown position (fallback)", () => {
    // TypeScript would normally prevent this, but we test the fallback behavior
    const unknownPosition = "xx" as Parameters<typeof getAnchorPositionLabel>[0];
    const label = getAnchorPositionLabel(unknownPosition);

    expect(label).toBe("xx");
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("Preset Integration", () => {
  it("all dimension preset functions work together consistently", () => {
    const width = 8;
    const height = 8;

    // All should agree
    const preset = findDimensionPreset(width, height);
    const isPreset = isDimensionPreset(width, height);
    const examples = getDimensionExamplesString(width, height);

    expect(preset).toBeDefined();
    expect(isPreset).toBe(true);
    expect(examples).toBe(preset?.examples.join(", "));
  });

  it("all character count preset functions work together consistently", () => {
    const count = 256;

    const preset = findCharacterCountPreset(count);
    const isPreset = isCharacterCountPreset(count);
    const examples = getCharacterCountExamplesString(count);

    expect(preset).toBeDefined();
    expect(isPreset).toBe(true);
    expect(examples).toBe(preset?.examples.join(", "));
  });

  it("non-existent values return consistent undefined/false/empty results", () => {
    const customWidth = 11;
    const customHeight = 11;
    const customCount = 333;

    // Dimension functions
    expect(findDimensionPreset(customWidth, customHeight)).toBeUndefined();
    expect(isDimensionPreset(customWidth, customHeight)).toBe(false);
    expect(getDimensionExamplesString(customWidth, customHeight)).toBe("");

    // Character count functions
    expect(findCharacterCountPreset(customCount)).toBeUndefined();
    expect(isCharacterCountPreset(customCount)).toBe(false);
    expect(getCharacterCountExamplesString(customCount)).toBe("");
  });

  it("anchor position functions provide complete coverage", () => {
    const positions = getAnchorPositions();

    // Every position should have a label
    positions.forEach((position) => {
      const label = getAnchorPositionLabel(position);
      expect(label).not.toBe(position); // Label should be human-readable, not the code
      expect(label.length).toBeGreaterThan(2);
    });
  });
});
