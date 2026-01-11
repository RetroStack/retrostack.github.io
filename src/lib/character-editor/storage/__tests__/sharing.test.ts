/**
 * Character ROM Editor - Sharing Utilities Tests
 *
 * Tests for v2 compressed URL encoding/decoding.
 */

import {
  encodeCharacterSet,
  decodeCharacterSet,
  createShareUrl,
  extractFromUrl,
  getHashFromUrl,
  isUrlWithinRecommendedLength,
  isUrlWithinMaxLength,
  getUrlLengthStatus,
  estimateUrlLength,
  canShare,
  MAX_RECOMMENDED_URL_LENGTH,
  MAX_URL_LENGTH,
} from "../sharing";
import {
  createMockCharacter,
  createMockCharacters,
  createMockConfig,
} from "../../__tests__/testUtils";
import type { Character, CharacterSetConfig } from "../../types";

// ============================================================================
// Encode/Decode Round-trip Tests
// ============================================================================

describe("encodeCharacterSet / decodeCharacterSet", () => {
  it("round-trips minimal character set", () => {
    const name = "Test";
    const description = "A test set";
    const characters = createMockCharacters(8, 8, 8, ["empty"]);
    const config = createMockConfig();

    const encoded = encodeCharacterSet(name, description, characters, config);
    const decoded = decodeCharacterSet(encoded);

    expect(decoded.name).toBe(name);
    expect(decoded.description).toBe(description);
    expect(decoded.config).toEqual(config);
    expect(decoded.characters).toHaveLength(8);
  });

  it("round-trips with empty description", () => {
    const name = "No Description";
    const description = "";
    const characters = createMockCharacters(4);
    const config = createMockConfig();

    const encoded = encodeCharacterSet(name, description, characters, config);
    const decoded = decodeCharacterSet(encoded);

    expect(decoded.name).toBe(name);
    expect(decoded.description).toBe("");
  });

  it("round-trips with special characters in name", () => {
    const name = "Test <>&\"'`!@#$%^*(){}[]";
    const description = "Special chars";
    const characters = createMockCharacters(4);
    const config = createMockConfig();

    const encoded = encodeCharacterSet(name, description, characters, config);
    const decoded = decodeCharacterSet(encoded);

    expect(decoded.name).toBe(name);
  });

  it("round-trips with unicode in name and description", () => {
    const name = "テスト 🎮 Ümlauts";
    const description = "日本語 emoji 🕹️ and special chars";
    const characters = createMockCharacters(4);
    const config = createMockConfig();

    const encoded = encodeCharacterSet(name, description, characters, config);
    const decoded = decodeCharacterSet(encoded);

    expect(decoded.name).toBe(name);
    expect(decoded.description).toBe(description);
  });

  it("round-trips all config combinations", () => {
    const configurations: CharacterSetConfig[] = [
      { width: 8, height: 8, padding: "right", bitDirection: "ltr" },
      { width: 8, height: 8, padding: "left", bitDirection: "ltr" },
      { width: 8, height: 8, padding: "right", bitDirection: "rtl" },
      { width: 8, height: 8, padding: "left", bitDirection: "rtl" },
    ];

    for (const config of configurations) {
      const characters = createMockCharacters(4, config.width, config.height);
      const encoded = encodeCharacterSet("Test", "Desc", characters, config);
      const decoded = decodeCharacterSet(encoded);

      expect(decoded.config).toEqual(config);
    }
  });

  it("round-trips 256-character 8x8 set", () => {
    const characters = createMockCharacters(256, 8, 8, ["empty", "filled", "checkerboard"]);
    const config = createMockConfig();

    const encoded = encodeCharacterSet("Large Set", "256 chars", characters, config);
    const decoded = decodeCharacterSet(encoded);

    expect(decoded.characters).toHaveLength(256);
    expect(decoded.name).toBe("Large Set");
  });

  it("round-trips non-standard dimensions", () => {
    const testCases = [
      { width: 6, height: 10 },
      { width: 12, height: 8 },
      { width: 16, height: 16 },
    ];

    for (const { width, height } of testCases) {
      const config = createMockConfig({ width, height });
      const characters = createMockCharacters(8, width, height, ["checkerboard"]);

      const encoded = encodeCharacterSet("Test", "Desc", characters, config);
      const decoded = decodeCharacterSet(encoded);

      expect(decoded.config.width).toBe(width);
      expect(decoded.config.height).toBe(height);
      expect(decoded.characters).toHaveLength(8);
    }
  });

  it("preserves character pixel data", () => {
    const characters = [
      createMockCharacter(8, 8, "empty"),
      createMockCharacter(8, 8, "filled"),
      createMockCharacter(8, 8, "checkerboard"),
      createMockCharacter(8, 8, "diagonal"),
    ];
    const config = createMockConfig();

    const encoded = encodeCharacterSet("Patterns", "Test patterns", characters, config);
    const decoded = decodeCharacterSet(encoded);

    // Check empty character
    expect(decoded.characters[0].pixels.flat().every((p) => p === false)).toBe(true);

    // Check filled character
    expect(decoded.characters[1].pixels.flat().every((p) => p === true)).toBe(true);

    // Check checkerboard character
    const checkerboard = decoded.characters[2];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        expect(checkerboard.pixels[row][col]).toBe((row + col) % 2 === 0);
      }
    }
  });
});

// ============================================================================
// v2 Format Tests
// ============================================================================

describe("v2 format", () => {
  it("encoded string starts with '2:' prefix", () => {
    const characters = createMockCharacters(4);
    const config = createMockConfig();

    const encoded = encodeCharacterSet("Test", "Desc", characters, config);

    expect(encoded.startsWith("2:")).toBe(true);
  });

  it("produces URL-safe output (no +, /, or =)", () => {
    const characters = createMockCharacters(128, 8, 8, ["filled", "checkerboard"]);
    const config = createMockConfig();

    const encoded = encodeCharacterSet("Test", "Desc", characters, config);

    // After the "2:" prefix, the rest should be base64url
    const payload = encoded.slice(2);
    expect(payload).not.toContain("+");
    expect(payload).not.toContain("/");
    expect(payload).not.toContain("=");
  });

  it("throws error for invalid format (missing prefix)", () => {
    const invalidEncoded = "someinvaliddata";

    expect(() => decodeCharacterSet(invalidEncoded)).toThrow(
      "Invalid share format: missing version prefix"
    );
  });

  it("throws error for corrupted data", () => {
    const corrupted = "2:notvalidbase64!!!";

    expect(() => decodeCharacterSet(corrupted)).toThrow();
  });
});

// ============================================================================
// URL Length / Compression Tests
// ============================================================================

describe("URL length with compression", () => {
  it("produces shorter URLs than uncompressed for typical sets", () => {
    const characters = createMockCharacters(128, 8, 8, ["empty", "checkerboard"]);
    const config = createMockConfig();

    const encoded = encodeCharacterSet("Test Set", "Description", characters, config);

    // 128 chars * 8 bytes = 1024 bytes uncompressed
    // Uncompressed base64 would be ~1365 chars + JSON overhead
    // Compressed should be much less
    expect(encoded.length).toBeLessThan(800);
  });

  it("achieves significant compression for sparse data", () => {
    // All empty characters compress very well
    const characters = createMockCharacters(256, 8, 8, ["empty"]);
    const config = createMockConfig();

    const encoded = encodeCharacterSet("Empty Set", "All zeros", characters, config);

    // 256 chars * 8 bytes = 2048 bytes uncompressed
    // With compression, mostly zeros should be very small
    expect(encoded.length).toBeLessThan(200);
  });

  it("stays under 2000 chars for 128-char 8x8 set with mixed content", () => {
    const characters = createMockCharacters(128, 8, 8, ["empty", "filled", "checkerboard", "diagonal"]);
    const config = createMockConfig();

    const encoded = encodeCharacterSet("Mixed Set", "Various patterns", characters, config);
    const url = createShareUrl(encoded);

    expect(url.length).toBeLessThan(MAX_RECOMMENDED_URL_LENGTH);
  });
});

// ============================================================================
// URL Helper Tests
// ============================================================================

describe("createShareUrl", () => {
  it("creates URL with hash fragment", () => {
    const encoded = "2:someencodeddata";
    const url = createShareUrl(encoded);

    expect(url).toContain("#2:someencodeddata");
    expect(url).toContain("/tools/character-rom-editor/shared");
  });
});

describe("extractFromUrl", () => {
  it("extracts hash from URL", () => {
    const url = "https://example.com/path#2:encodeddata";
    const extracted = extractFromUrl(url);

    expect(extracted).toBe("2:encodeddata");
  });

  it("returns null for URL without hash", () => {
    const url = "https://example.com/path";
    const extracted = extractFromUrl(url);

    expect(extracted).toBeNull();
  });

  it("handles empty hash", () => {
    const url = "https://example.com/path#";
    const extracted = extractFromUrl(url);

    expect(extracted).toBe("");
  });
});

describe("getHashFromUrl", () => {
  it("returns null in non-browser environment", () => {
    // In Node.js test environment, window is undefined
    const hash = getHashFromUrl();
    expect(hash).toBeNull();
  });
});

// ============================================================================
// URL Length Status Tests
// ============================================================================

describe("isUrlWithinRecommendedLength", () => {
  it("returns true for short URLs", () => {
    const shortUrl = "https://example.com/short";
    expect(isUrlWithinRecommendedLength(shortUrl)).toBe(true);
  });

  it("returns true for URLs at the limit", () => {
    const url = "x".repeat(MAX_RECOMMENDED_URL_LENGTH);
    expect(isUrlWithinRecommendedLength(url)).toBe(true);
  });

  it("returns false for URLs over the limit", () => {
    const url = "x".repeat(MAX_RECOMMENDED_URL_LENGTH + 1);
    expect(isUrlWithinRecommendedLength(url)).toBe(false);
  });
});

describe("isUrlWithinMaxLength", () => {
  it("returns true for URLs at the limit", () => {
    const url = "x".repeat(MAX_URL_LENGTH);
    expect(isUrlWithinMaxLength(url)).toBe(true);
  });

  it("returns false for URLs over the limit", () => {
    const url = "x".repeat(MAX_URL_LENGTH + 1);
    expect(isUrlWithinMaxLength(url)).toBe(false);
  });
});

describe("getUrlLengthStatus", () => {
  it("returns 'ok' for short URLs", () => {
    const url = "x".repeat(100);
    expect(getUrlLengthStatus(url)).toBe("ok");
  });

  it("returns 'warning' for URLs between recommended and max", () => {
    const url = "x".repeat(MAX_RECOMMENDED_URL_LENGTH + 100);
    expect(getUrlLengthStatus(url)).toBe("warning");
  });

  it("returns 'error' for URLs over max length", () => {
    const url = "x".repeat(MAX_URL_LENGTH + 1);
    expect(getUrlLengthStatus(url)).toBe("error");
  });
});

// ============================================================================
// Estimate URL Length Tests
// ============================================================================

describe("estimateUrlLength", () => {
  it("returns positive number for any valid input", () => {
    expect(estimateUrlLength(8, 8, 8)).toBeGreaterThan(0);
    expect(estimateUrlLength(256, 8, 8)).toBeGreaterThan(0);
    expect(estimateUrlLength(128, 16, 16)).toBeGreaterThan(0);
  });

  it("increases with character count", () => {
    const small = estimateUrlLength(8, 8, 8);
    const medium = estimateUrlLength(128, 8, 8);
    const large = estimateUrlLength(256, 8, 8);

    expect(medium).toBeGreaterThan(small);
    expect(large).toBeGreaterThan(medium);
  });

  it("increases with character dimensions", () => {
    const small = estimateUrlLength(64, 8, 8);
    const large = estimateUrlLength(64, 16, 16);

    expect(large).toBeGreaterThan(small);
  });
});

// ============================================================================
// canShare Tests
// ============================================================================

describe("canShare", () => {
  it("returns ok status for small character sets", () => {
    const result = canShare(32, 8, 8);

    expect(result.canShare).toBe(true);
    expect(result.status).toBe("ok");
  });

  it("returns warning status for large character sets", () => {
    // Create a set large enough to trigger warning (between recommended and max)
    // Need to find a size where estimated URL is between 2000-8000 chars
    // With 50% compression + base64 overhead, ~200 chars at 16x16 should trigger warning
    const result = canShare(200, 16, 16);

    expect(result.canShare).toBe(true);
    expect(result.status).toBe("warning");
  });

  it("includes estimated length", () => {
    const result = canShare(128, 8, 8);

    expect(result.estimatedLength).toBeGreaterThan(0);
  });

  it("includes descriptive message", () => {
    const result = canShare(32, 8, 8);

    expect(result.message.length).toBeGreaterThan(0);
  });
});
