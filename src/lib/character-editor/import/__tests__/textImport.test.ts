import {
  parseTextToBytes,
  parseTextToCharacters,
  getDefaultTextImportOptions,
  getParseResultSummary,
  TextImportOptions,
  TextParseResult,
} from "@/lib/character-editor/import/textImport";
import { Character } from "@/lib/character-editor/types";

/** Create a mock character with proper boolean[][] pixels */
function createMockCharacter(width = 8, height = 8): Character {
  return {
    pixels: Array.from({ length: height }, () =>
      Array.from({ length: width }, () => false)
    ),
  };
}

describe("textImport", () => {
  describe("getDefaultTextImportOptions", () => {
    it("returns valid default options", () => {
      const options = getDefaultTextImportOptions();

      expect(options).toEqual({
        charWidth: 8,
        charHeight: 8,
        padding: "right",
        bitDirection: "msb",
        byteOrder: "big",
      });
    });

    it("returns a new object on each call", () => {
      const options1 = getDefaultTextImportOptions();
      const options2 = getDefaultTextImportOptions();

      expect(options1).not.toBe(options2);
      expect(options1).toEqual(options2);
    });
  });

  describe("parseTextToBytes", () => {
    describe("hex formats", () => {
      it("parses C-style hex values (0x prefix)", () => {
        const input = "0x00, 0x7E, 0x42, 0x42, 0x7E, 0x00, 0x00, 0x00";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0x00, 0x7e, 0x42, 0x42, 0x7e, 0x00, 0x00, 0x00]);
        expect(result.format).toBe("hex");
        expect(result.invalidCount).toBe(0);
        expect(result.error).toBeUndefined();
      });

      it("does not parse uppercase 0X prefix (regex only matches lowercase)", () => {
        // The regex pattern only matches lowercase 0x, not 0X
        const input = "0X00, 0XFF, 0XAB";
        const result = parseTextToBytes(input);

        // These are not recognized as hex, so only decimal parts are extracted
        expect(result.bytes).toEqual([]);
        expect(result.error).toBe("No valid byte values found in input");
      });

      it("parses assembly-style hex values ($ prefix)", () => {
        const input = "$00, $7E, $42, $42, $7E, $00, $00, $00";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0x00, 0x7e, 0x42, 0x42, 0x7e, 0x00, 0x00, 0x00]);
        expect(result.format).toBe("hex");
        expect(result.invalidCount).toBe(0);
      });

      it("parses single-digit hex values", () => {
        const input = "0x0, 0x5, 0xA, 0xF";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0, 5, 10, 15]);
        expect(result.format).toBe("hex");
      });

      it("handles mixed case hex digits", () => {
        const input = "0xaB, 0xCd, 0xEf";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0xab, 0xcd, 0xef]);
      });
    });

    describe("decimal format", () => {
      it("parses decimal values", () => {
        const input = "0, 126, 66, 66, 126, 0, 0, 0";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0, 126, 66, 66, 126, 0, 0, 0]);
        expect(result.format).toBe("decimal");
        expect(result.invalidCount).toBe(0);
      });

      it("parses decimal values at boundaries", () => {
        const input = "0, 127, 128, 255";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0, 127, 128, 255]);
        expect(result.format).toBe("decimal");
      });

      it("parses single-digit decimal values", () => {
        const input = "1, 2, 3, 4, 5";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([1, 2, 3, 4, 5]);
      });
    });

    describe("binary format", () => {
      it("parses binary values with 0b prefix", () => {
        const input = "0b00000000, 0b01111110, 0b01000010, 0b01000010";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0b00000000, 0b01111110, 0b01000010, 0b01000010]);
        expect(result.format).toBe("binary");
        expect(result.invalidCount).toBe(0);
      });

      it("does not parse uppercase 0B prefix (regex only matches lowercase)", () => {
        // The regex pattern only matches lowercase 0b, not 0B
        const input = "0B11111111, 0B10101010";
        const result = parseTextToBytes(input);

        // These are not recognized as binary, so only decimal parts are extracted
        expect(result.bytes).toEqual([]);
        expect(result.error).toBe("No valid byte values found in input");
      });

      it("parses shorter binary values", () => {
        const input = "0b1, 0b10, 0b100, 0b1000";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([1, 2, 4, 8]);
      });
    });

    describe("mixed formats", () => {
      it("parses mixed hex, decimal, and binary values", () => {
        const input = "0x00, 126, $42, 0b01000010";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0, 126, 66, 66]);
        expect(result.format).toBe("mixed");
        expect(result.invalidCount).toBe(0);
      });

      it("detects hex format when combining hex styles", () => {
        const input = "0xFF, $00";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([255, 0]);
        expect(result.format).toBe("hex");
      });

      it("detects mixed format when combining decimal and binary", () => {
        const input = "255, 0b11111111";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([255, 255]);
        expect(result.format).toBe("mixed");
      });
    });

    describe("real-world examples", () => {
      it("parses C array declaration", () => {
        const input = "const unsigned char font[] = { 0x00, 0x7E, 0x42, 0x42, 0x7E, 0x00, 0x00, 0x00 };";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0x00, 0x7e, 0x42, 0x42, 0x7e, 0x00, 0x00, 0x00]);
        expect(result.format).toBe("hex");
      });

      it("parses assembly .byte directive", () => {
        const input = ".byte $00, $7E, $42, $42, $7E, $00, $00, $00";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0x00, 0x7e, 0x42, 0x42, 0x7e, 0x00, 0x00, 0x00]);
        expect(result.format).toBe("hex");
      });

      it("parses JavaScript array literal", () => {
        const input = "[0, 126, 66, 66, 126, 0, 0, 0]";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0, 126, 66, 66, 126, 0, 0, 0]);
        expect(result.format).toBe("decimal");
      });

      it("parses multi-line C array", () => {
        const input = `
          const uint8_t data[] = {
            0x00, 0x7E, 0x42, 0x42,
            0x7E, 0x00, 0x00, 0x00
          };
        `;
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0x00, 0x7e, 0x42, 0x42, 0x7e, 0x00, 0x00, 0x00]);
        expect(result.format).toBe("hex");
      });

      it("parses 6502 assembly with comments", () => {
        const input = `
          .byte $00, $7E  ; first two bytes
          .byte $42, $42  ; middle bytes
          .byte $7E, $00, $00, $00  ; last bytes
        `;
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0x00, 0x7e, 0x42, 0x42, 0x7e, 0x00, 0x00, 0x00]);
      });

      it("parses Z80 assembly DEFB directive", () => {
        const input = "DEFB 0x00, 0x7E, 0x42, 0x42";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0x00, 0x7e, 0x42, 0x42]);
      });

      it("parses Python list syntax", () => {
        const input = "font_data = [0x00, 0x7E, 0x42, 0x42, 0x7E]";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0x00, 0x7e, 0x42, 0x42, 0x7e]);
      });
    });

    describe("edge cases", () => {
      it("returns error for empty string", () => {
        const result = parseTextToBytes("");

        expect(result.bytes).toEqual([]);
        expect(result.error).toBe("No input provided");
        expect(result.invalidCount).toBe(0);
      });

      it("returns error for whitespace only", () => {
        const result = parseTextToBytes("   \n\t  ");

        expect(result.bytes).toEqual([]);
        expect(result.error).toBe("No input provided");
      });

      it("returns error when no valid bytes found", () => {
        const result = parseTextToBytes("hello world abc def");

        expect(result.bytes).toEqual([]);
        expect(result.error).toBe("No valid byte values found in input");
      });

      it("handles values at upper boundary (255)", () => {
        const input = "0xFF, 255, $FF, 0b11111111";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([255, 255, 255, 255]);
        expect(result.format).toBe("mixed");
      });

      it("handles values at lower boundary (0)", () => {
        const input = "0x00, 0, $00, 0b00000000";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0, 0, 0, 0]);
      });

      it("skips out-of-range decimal values (>255)", () => {
        const input = "0, 100, 256, 300, 255";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0, 100, 255]);
        expect(result.invalidCount).toBe(2);
      });

      it("handles mixed valid and invalid values", () => {
        const input = "0x00, 999, 0x7E, 255";
        const result = parseTextToBytes(input);

        // 999 is captured as "999" but fails validation (>255)
        expect(result.bytes).toEqual([0x00, 0x7e, 255]);
        expect(result.invalidCount).toBe(1); // 999 is invalid
      });

      it("extracts digits from negative numbers (regex matches digit portion)", () => {
        // The regex \b\d{1,3}\b matches "5" from "-5" because - is a word boundary
        const input = "-5, -100";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([5, 100]);
        expect(result.format).toBe("decimal");
      });

      it("handles text with only comments", () => {
        const input = "// This is a comment\n/* Another comment */";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([]);
        expect(result.error).toBe("No valid byte values found in input");
      });

      it("handles extra whitespace and newlines", () => {
        const input = "  0x00  ,   0x7E  \n  0x42  ";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([0x00, 0x7e, 0x42]);
      });

      it("returns error when all values are out of range", () => {
        const input = "256, 300, 999";
        const result = parseTextToBytes(input);

        expect(result.bytes).toEqual([]);
        expect(result.invalidCount).toBe(3);
        expect(result.error).toBe("No valid byte values found (all values were out of range 0-255)");
      });
    });

    describe("format detection", () => {
      it("detects hex format when only hex values present", () => {
        const result = parseTextToBytes("0x00, 0xFF");
        expect(result.format).toBe("hex");
      });

      it("detects decimal format when only decimal values present", () => {
        const result = parseTextToBytes("100, 200, 255");
        expect(result.format).toBe("decimal");
      });

      it("detects binary format when only binary values present", () => {
        const result = parseTextToBytes("0b00001111, 0b11110000");
        expect(result.format).toBe("binary");
      });

      it("detects mixed format when multiple types present", () => {
        const result = parseTextToBytes("0xFF, 100, 0b00001111");
        expect(result.format).toBe("mixed");
      });

      it("defaults to hex format on error", () => {
        const result = parseTextToBytes("");
        expect(result.format).toBe("hex");
      });
    });
  });

  describe("parseTextToCharacters", () => {
    const defaultOptions = getDefaultTextImportOptions();

    it("parses valid input into characters", () => {
      // 8 bytes for one 8x8 character
      const input = "0x00, 0x7E, 0x42, 0x42, 0x7E, 0x42, 0x42, 0x00";
      const result = parseTextToCharacters(input, defaultOptions);

      expect(result.characters).toHaveLength(1);
      expect(result.bytes.length).toBe(8);
      expect(result.error).toBeUndefined();
      expect(result.config.width).toBe(8);
      expect(result.config.height).toBe(8);
    });

    it("parses multiple characters from input", () => {
      // 16 bytes for two 8x8 characters
      const input =
        "0x00, 0x7E, 0x42, 0x42, 0x7E, 0x42, 0x42, 0x00, " +
        "0xFF, 0x81, 0x81, 0x81, 0x81, 0x81, 0x81, 0xFF";
      const result = parseTextToCharacters(input, defaultOptions);

      expect(result.characters).toHaveLength(2);
      expect(result.bytes.length).toBe(16);
    });

    it("returns empty characters array for empty input", () => {
      const result = parseTextToCharacters("", defaultOptions);

      expect(result.characters).toHaveLength(0);
      expect(result.bytes.length).toBe(0);
      expect(result.error).toBe("No input provided");
    });

    it("returns empty characters array for invalid input", () => {
      const result = parseTextToCharacters("no valid bytes here", defaultOptions);

      expect(result.characters).toHaveLength(0);
      expect(result.error).toBe("No valid byte values found in input");
    });

    it("uses provided options for character dimensions", () => {
      const options: TextImportOptions = {
        charWidth: 16,
        charHeight: 16,
        padding: "left",
        bitDirection: "lsb",
      };

      // 32 bytes for one 16x16 character (16 pixels wide = 2 bytes per row, 16 rows)
      const bytes = Array(32).fill("0xFF").join(", ");
      const result = parseTextToCharacters(bytes, options);

      expect(result.config.width).toBe(16);
      expect(result.config.height).toBe(16);
      expect(result.config.padding).toBe("left");
      expect(result.config.bitDirection).toBe("lsb");
    });

    it("preserves detected format in result", () => {
      const result = parseTextToCharacters("$00, $7E, $42, $42, $7E, $00, $00, $00", defaultOptions);

      expect(result.detectedFormat).toBe("hex");
    });

    it("tracks invalid count in result", () => {
      const input = "0x00, 999, 0x7E, 0x42, 0x7E, 0x00, 0x00, 0x00";
      const result = parseTextToCharacters(input, defaultOptions);

      expect(result.invalidCount).toBe(1);
    });

    it("returns Uint8Array for bytes", () => {
      const input = "0x00, 0x7E, 0x42, 0x42, 0x7E, 0x00, 0x00, 0x00";
      const result = parseTextToCharacters(input, defaultOptions);

      expect(result.bytes).toBeInstanceOf(Uint8Array);
    });

    it("creates default config on error", () => {
      const result = parseTextToCharacters("", defaultOptions);

      expect(result.config).toBeDefined();
      expect(result.config.width).toBeDefined();
      expect(result.config.height).toBeDefined();
    });
  });

  describe("getParseResultSummary", () => {
    it("returns error message when result has error", () => {
      const result: TextParseResult = {
        bytes: new Uint8Array(0),
        characters: [],
        config: { width: 8, height: 8, padding: "right", bitDirection: "msb" },
        detectedFormat: "hex",
        invalidCount: 0,
        error: "No input provided",
      };

      expect(getParseResultSummary(result)).toBe("No input provided");
    });

    it("returns success message with byte count and format", () => {
      const result: TextParseResult = {
        bytes: new Uint8Array([0, 126, 66, 66, 126, 0, 0, 0]),
        characters: [createMockCharacter()],
        config: { width: 8, height: 8, padding: "right", bitDirection: "msb" },
        detectedFormat: "hex",
        invalidCount: 0,
      };

      const summary = getParseResultSummary(result);

      expect(summary).toContain("8 bytes detected");
      expect(summary).toContain("hexadecimal");
      expect(summary).toContain("1 character");
    });

    it("pluralizes characters correctly", () => {
      const result: TextParseResult = {
        bytes: new Uint8Array(16),
        characters: [createMockCharacter(), createMockCharacter()],
        config: { width: 8, height: 8, padding: "right", bitDirection: "msb" },
        detectedFormat: "decimal",
        invalidCount: 0,
      };

      const summary = getParseResultSummary(result);

      expect(summary).toContain("2 characters");
    });

    it("includes invalid count when present", () => {
      const result: TextParseResult = {
        bytes: new Uint8Array([0, 126, 66, 66, 126, 0, 0, 0]),
        characters: [createMockCharacter()],
        config: { width: 8, height: 8, padding: "right", bitDirection: "msb" },
        detectedFormat: "hex",
        invalidCount: 3,
      };

      const summary = getParseResultSummary(result);

      expect(summary).toContain("3 invalid values skipped");
    });

    it("pluralizes invalid values correctly for single value", () => {
      const result: TextParseResult = {
        bytes: new Uint8Array([0, 126, 66, 66, 126, 0, 0, 0]),
        characters: [createMockCharacter()],
        config: { width: 8, height: 8, padding: "right", bitDirection: "msb" },
        detectedFormat: "hex",
        invalidCount: 1,
      };

      const summary = getParseResultSummary(result);

      expect(summary).toContain("1 invalid value skipped");
    });

    it("displays correct format name for each format type", () => {
      const baseResult: TextParseResult = {
        bytes: new Uint8Array([255]),
        characters: [],
        config: { width: 8, height: 8, padding: "right", bitDirection: "msb" },
        detectedFormat: "hex",
        invalidCount: 0,
      };

      expect(getParseResultSummary({ ...baseResult, detectedFormat: "hex" })).toContain("hexadecimal");
      expect(getParseResultSummary({ ...baseResult, detectedFormat: "decimal" })).toContain("decimal");
      expect(getParseResultSummary({ ...baseResult, detectedFormat: "binary" })).toContain("binary");
      expect(getParseResultSummary({ ...baseResult, detectedFormat: "mixed" })).toContain("mixed formats");
    });

    it("shows only bytes when no characters are parsed", () => {
      const result: TextParseResult = {
        bytes: new Uint8Array([0, 126, 66]),
        characters: [],
        config: { width: 8, height: 8, padding: "right", bitDirection: "msb" },
        detectedFormat: "hex",
        invalidCount: 0,
      };

      const summary = getParseResultSummary(result);

      expect(summary).toBe("3 bytes detected (hexadecimal)");
      expect(summary).not.toContain("character");
    });
  });
});
