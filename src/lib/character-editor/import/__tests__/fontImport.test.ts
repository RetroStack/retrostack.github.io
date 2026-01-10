/**
 * Character ROM Editor - Font Import Tests
 *
 * Comprehensive tests for font import utility functions including:
 * - getDefaultFontImportOptions
 * - isValidFontFile
 * - getSupportedFontExtensions
 * - getCharacterRangePreview
 * - CHARACTER_RANGES constant
 * - FontParseController state management
 * - debounce utility
 *
 * Note: The fontImport module uses import.meta.url for Web Worker creation,
 * which is not supported in Jest's CommonJS environment. We use a manual
 * mock in __mocks__/fontImport.ts that provides the same utility functions.
 */

// Tell Jest to use the manual mock
jest.mock("../fontImport");

import {
  getDefaultFontImportOptions,
  isValidFontFile,
  getSupportedFontExtensions,
  getCharacterRangePreview,
  CHARACTER_RANGES,
  FontParseController,
  debounce,
} from "@/lib/character-editor/import/fontImport";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a mock File object for testing
 */
function createMockFile(name: string, type: string, size: number = 1024): File {
  const content = new ArrayBuffer(size);
  return new File([content], name, { type });
}

// ============================================================================
// getDefaultFontImportOptions Tests
// ============================================================================

describe("getDefaultFontImportOptions", () => {
  it("returns an object with all required properties", () => {
    const options = getDefaultFontImportOptions();

    expect(options).toHaveProperty("charWidth");
    expect(options).toHaveProperty("charHeight");
    expect(options).toHaveProperty("startCode");
    expect(options).toHaveProperty("endCode");
    expect(options).toHaveProperty("fontSize");
    expect(options).toHaveProperty("threshold");
    expect(options).toHaveProperty("centerGlyphs");
    expect(options).toHaveProperty("baselineOffset");
  });

  it("returns correct default charWidth", () => {
    const options = getDefaultFontImportOptions();
    expect(options.charWidth).toBe(8);
  });

  it("returns correct default charHeight", () => {
    const options = getDefaultFontImportOptions();
    expect(options.charHeight).toBe(8);
  });

  it("returns correct default startCode (ASCII space)", () => {
    const options = getDefaultFontImportOptions();
    expect(options.startCode).toBe(32);
  });

  it("returns correct default endCode (ASCII tilde)", () => {
    const options = getDefaultFontImportOptions();
    expect(options.endCode).toBe(126);
  });

  it("returns correct default fontSize", () => {
    const options = getDefaultFontImportOptions();
    expect(options.fontSize).toBe(8);
  });

  it("returns correct default threshold (midpoint 128)", () => {
    const options = getDefaultFontImportOptions();
    expect(options.threshold).toBe(128);
  });

  it("returns centerGlyphs as true by default", () => {
    const options = getDefaultFontImportOptions();
    expect(options.centerGlyphs).toBe(true);
  });

  it("returns baselineOffset as 0 by default", () => {
    const options = getDefaultFontImportOptions();
    expect(options.baselineOffset).toBe(0);
  });

  it("returns a new object on each call (not shared reference)", () => {
    const options1 = getDefaultFontImportOptions();
    const options2 = getDefaultFontImportOptions();

    expect(options1).not.toBe(options2);
    expect(options1).toEqual(options2);
  });

  it("returned options cover printable ASCII range", () => {
    const options = getDefaultFontImportOptions();
    const count = options.endCode - options.startCode + 1;

    // Printable ASCII: 32 (space) to 126 (~) = 95 characters
    expect(count).toBe(95);
  });
});

// ============================================================================
// isValidFontFile Tests
// ============================================================================

describe("isValidFontFile", () => {
  describe("valid font types by MIME type", () => {
    it("accepts TTF file with font/ttf MIME type", () => {
      const file = createMockFile("font.ttf", "font/ttf");
      expect(isValidFontFile(file)).toBe(true);
    });

    it("accepts OTF file with font/otf MIME type", () => {
      const file = createMockFile("font.otf", "font/otf");
      expect(isValidFontFile(file)).toBe(true);
    });

    it("accepts WOFF file with font/woff MIME type", () => {
      const file = createMockFile("font.woff", "font/woff");
      expect(isValidFontFile(file)).toBe(true);
    });

    it("accepts WOFF2 file with font/woff2 MIME type", () => {
      const file = createMockFile("font.woff2", "font/woff2");
      expect(isValidFontFile(file)).toBe(true);
    });

    it("accepts TTF file with application/x-font-ttf MIME type", () => {
      const file = createMockFile("font.ttf", "application/x-font-ttf");
      expect(isValidFontFile(file)).toBe(true);
    });

    it("accepts OTF file with application/x-font-otf MIME type", () => {
      const file = createMockFile("font.otf", "application/x-font-otf");
      expect(isValidFontFile(file)).toBe(true);
    });

    it("accepts WOFF file with application/font-woff MIME type", () => {
      const file = createMockFile("font.woff", "application/font-woff");
      expect(isValidFontFile(file)).toBe(true);
    });

    it("accepts WOFF2 file with application/font-woff2 MIME type", () => {
      const file = createMockFile("font.woff2", "application/font-woff2");
      expect(isValidFontFile(file)).toBe(true);
    });
  });

  describe("valid font types by extension fallback", () => {
    it("accepts TTF file by extension when MIME type is empty", () => {
      const file = createMockFile("myfont.ttf", "");
      expect(isValidFontFile(file)).toBe(true);
    });

    it("accepts OTF file by extension when MIME type is empty", () => {
      const file = createMockFile("myfont.otf", "");
      expect(isValidFontFile(file)).toBe(true);
    });

    it("accepts WOFF file by extension when MIME type is empty", () => {
      const file = createMockFile("myfont.woff", "");
      expect(isValidFontFile(file)).toBe(true);
    });

    it("accepts WOFF2 file by extension when MIME type is empty", () => {
      const file = createMockFile("myfont.woff2", "");
      expect(isValidFontFile(file)).toBe(true);
    });

    it("accepts uppercase extension", () => {
      const file = createMockFile("MYFONT.TTF", "");
      expect(isValidFontFile(file)).toBe(true);
    });

    it("accepts mixed case extension", () => {
      const file = createMockFile("MyFont.Otf", "");
      expect(isValidFontFile(file)).toBe(true);
    });

    it("accepts extension with unknown MIME type", () => {
      const file = createMockFile("font.ttf", "application/octet-stream");
      expect(isValidFontFile(file)).toBe(true);
    });
  });

  describe("invalid font types", () => {
    it("rejects PNG image file", () => {
      const file = createMockFile("image.png", "image/png");
      expect(isValidFontFile(file)).toBe(false);
    });

    it("rejects JPEG image file", () => {
      const file = createMockFile("photo.jpg", "image/jpeg");
      expect(isValidFontFile(file)).toBe(false);
    });

    it("rejects plain text file", () => {
      const file = createMockFile("document.txt", "text/plain");
      expect(isValidFontFile(file)).toBe(false);
    });

    it("rejects PDF file", () => {
      const file = createMockFile("document.pdf", "application/pdf");
      expect(isValidFontFile(file)).toBe(false);
    });

    it("rejects JavaScript file", () => {
      const file = createMockFile("script.js", "application/javascript");
      expect(isValidFontFile(file)).toBe(false);
    });

    it("rejects ZIP file", () => {
      const file = createMockFile("archive.zip", "application/zip");
      expect(isValidFontFile(file)).toBe(false);
    });

    it("rejects file with no extension and unknown MIME type", () => {
      const file = createMockFile("noextension", "application/octet-stream");
      expect(isValidFontFile(file)).toBe(false);
    });

    it("rejects file with invalid extension", () => {
      const file = createMockFile("font.abc", "");
      expect(isValidFontFile(file)).toBe(false);
    });
  });

  describe("EOT edge case (legacy format)", () => {
    it("rejects EOT file (not in supported formats)", () => {
      const file = createMockFile("font.eot", "application/vnd.ms-fontobject");
      expect(isValidFontFile(file)).toBe(false);
    });

    it("rejects EOT file by extension", () => {
      const file = createMockFile("font.eot", "");
      expect(isValidFontFile(file)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles file with multiple dots in name", () => {
      const file = createMockFile("my.custom.font.ttf", "");
      expect(isValidFontFile(file)).toBe(true);
    });

    it("handles file with dot but no extension", () => {
      const file = createMockFile("font.", "");
      expect(isValidFontFile(file)).toBe(false);
    });

    it("handles very long filename", () => {
      const longName = "a".repeat(200) + ".ttf";
      const file = createMockFile(longName, "font/ttf");
      expect(isValidFontFile(file)).toBe(true);
    });
  });
});

// ============================================================================
// getSupportedFontExtensions Tests
// ============================================================================

describe("getSupportedFontExtensions", () => {
  it("returns a string", () => {
    const result = getSupportedFontExtensions();
    expect(typeof result).toBe("string");
  });

  it("includes .ttf extension", () => {
    const result = getSupportedFontExtensions();
    expect(result).toContain(".ttf");
  });

  it("includes .otf extension", () => {
    const result = getSupportedFontExtensions();
    expect(result).toContain(".otf");
  });

  it("includes .woff extension", () => {
    const result = getSupportedFontExtensions();
    expect(result).toContain(".woff");
  });

  it("includes .woff2 extension", () => {
    const result = getSupportedFontExtensions();
    expect(result).toContain(".woff2");
  });

  it("does not include .eot (legacy format)", () => {
    const result = getSupportedFontExtensions();
    expect(result).not.toContain(".eot");
  });

  it("returns formatted string suitable for file input accept", () => {
    const result = getSupportedFontExtensions();
    // Should be comma-separated with extensions starting with dot
    expect(result).toMatch(/^\.[a-z0-9]+(\s*,\s*\.[a-z0-9]+)*$/);
  });

  it("returns exactly 4 extensions", () => {
    const result = getSupportedFontExtensions();
    const extensions = result.split(",").map((s) => s.trim());
    expect(extensions).toHaveLength(4);
  });
});

// ============================================================================
// CHARACTER_RANGES Tests
// ============================================================================

describe("CHARACTER_RANGES", () => {
  it("is an array", () => {
    expect(Array.isArray(CHARACTER_RANGES)).toBe(true);
  });

  it("contains at least one range", () => {
    expect(CHARACTER_RANGES.length).toBeGreaterThan(0);
  });

  it("each range has name, startCode, endCode, and count", () => {
    CHARACTER_RANGES.forEach((range) => {
      expect(range).toHaveProperty("name");
      expect(range).toHaveProperty("startCode");
      expect(range).toHaveProperty("endCode");
      expect(range).toHaveProperty("count");
    });
  });

  it("each range has correct count calculation", () => {
    CHARACTER_RANGES.forEach((range) => {
      const expectedCount = range.endCode - range.startCode + 1;
      expect(range.count).toBe(expectedCount);
    });
  });

  it("contains Printable ASCII range", () => {
    const printableAscii = CHARACTER_RANGES.find(
      (r) => r.name === "Printable ASCII"
    );
    expect(printableAscii).toBeDefined();
    expect(printableAscii!.startCode).toBe(32);
    expect(printableAscii!.endCode).toBe(126);
    expect(printableAscii!.count).toBe(95);
  });

  it("contains Extended ASCII range", () => {
    const extendedAscii = CHARACTER_RANGES.find(
      (r) => r.name === "Extended ASCII"
    );
    expect(extendedAscii).toBeDefined();
    expect(extendedAscii!.startCode).toBe(32);
    expect(extendedAscii!.endCode).toBe(255);
    expect(extendedAscii!.count).toBe(224);
  });

  it("contains Uppercase Only range", () => {
    const uppercase = CHARACTER_RANGES.find((r) => r.name === "Uppercase Only");
    expect(uppercase).toBeDefined();
    expect(uppercase!.startCode).toBe(65); // 'A'
    expect(uppercase!.endCode).toBe(90); // 'Z'
    expect(uppercase!.count).toBe(26);
  });

  it("contains Lowercase Only range", () => {
    const lowercase = CHARACTER_RANGES.find((r) => r.name === "Lowercase Only");
    expect(lowercase).toBeDefined();
    expect(lowercase!.startCode).toBe(97); // 'a'
    expect(lowercase!.endCode).toBe(122); // 'z'
    expect(lowercase!.count).toBe(26);
  });

  it("contains Digits Only range", () => {
    const digits = CHARACTER_RANGES.find((r) => r.name === "Digits Only");
    expect(digits).toBeDefined();
    expect(digits!.startCode).toBe(48); // '0'
    expect(digits!.endCode).toBe(57); // '9'
    expect(digits!.count).toBe(10);
  });

  it("contains Full 256 range", () => {
    const full256 = CHARACTER_RANGES.find((r) => r.name.includes("256"));
    expect(full256).toBeDefined();
    expect(full256!.startCode).toBe(0);
    expect(full256!.endCode).toBe(255);
    expect(full256!.count).toBe(256);
  });

  it("all ranges have non-negative startCode", () => {
    CHARACTER_RANGES.forEach((range) => {
      expect(range.startCode).toBeGreaterThanOrEqual(0);
    });
  });

  it("all ranges have endCode >= startCode", () => {
    CHARACTER_RANGES.forEach((range) => {
      expect(range.endCode).toBeGreaterThanOrEqual(range.startCode);
    });
  });

  it("all ranges have endCode <= 255 (8-bit)", () => {
    CHARACTER_RANGES.forEach((range) => {
      expect(range.endCode).toBeLessThanOrEqual(255);
    });
  });
});

// ============================================================================
// getCharacterRangePreview Tests
// ============================================================================

describe("getCharacterRangePreview", () => {
  describe("printable ASCII characters", () => {
    it("returns correct preview for printable ASCII range start", () => {
      const preview = getCharacterRangePreview(32, 50);

      // Space (32) and subsequent printable chars
      expect(preview).toContain(" "); // space
      expect(preview).toContain("!"); // 33
      expect(preview).toContain('"'); // 34
    });

    it("returns correct preview for uppercase letters (truncated with ellipsis)", () => {
      const preview = getCharacterRangePreview(65, 90);

      // A-Z is 26 characters, preview is truncated to 20 + "..."
      expect(preview[0]).toBe("A");
      expect(preview).toContain("B");
      expect(preview).toContain("T"); // 20th character from A is T (index 19)
      expect(preview[preview.length - 1]).toBe("..."); // Truncated with ellipsis
      expect(preview).toHaveLength(21); // 20 chars + "..."
    });

    it("returns correct preview for lowercase letters", () => {
      const preview = getCharacterRangePreview(97, 122);

      expect(preview[0]).toBe("a");
      expect(preview).toContain("b");
    });

    it("returns correct preview for digits", () => {
      const preview = getCharacterRangePreview(48, 57);

      expect(preview).toHaveLength(10);
      expect(preview[0]).toBe("0");
      expect(preview[9]).toBe("9");
    });
  });

  describe("control characters", () => {
    it("uses placeholder for control characters (code < 32)", () => {
      const preview = getCharacterRangePreview(0, 10);

      // All should be placeholder characters (middle dot)
      expect(preview.every((char) => char === "\u00B7")).toBe(true);
    });

    it("uses placeholder dot for null character", () => {
      const preview = getCharacterRangePreview(0, 0);

      expect(preview).toHaveLength(1);
      expect(preview[0]).toBe("\u00B7"); // middle dot placeholder
    });

    it("uses placeholder for tab character", () => {
      const preview = getCharacterRangePreview(9, 9);

      expect(preview[0]).toBe("\u00B7");
    });

    it("uses placeholder for newline character", () => {
      const preview = getCharacterRangePreview(10, 10);

      expect(preview[0]).toBe("\u00B7");
    });
  });

  describe("extended ASCII range", () => {
    it("includes extended ASCII characters (code > 126)", () => {
      const preview = getCharacterRangePreview(127, 140);

      // Should include actual characters, not placeholders
      expect(preview.length).toBeGreaterThan(0);
    });

    it("handles high extended ASCII (200-255)", () => {
      const preview = getCharacterRangePreview(200, 210);

      expect(preview.length).toBeGreaterThan(0);
      // Should be actual character codes
      expect(preview[0]).toBe(String.fromCharCode(200));
    });
  });

  describe("preview truncation", () => {
    it("limits preview to 20 characters maximum", () => {
      const preview = getCharacterRangePreview(32, 126);

      // Should be 20 characters + "..."
      expect(preview).toHaveLength(21);
    });

    it("adds ellipsis when range exceeds 20 characters", () => {
      const preview = getCharacterRangePreview(65, 90);

      expect(preview).toContain("...");
      expect(preview[preview.length - 1]).toBe("...");
    });

    it("does not add ellipsis for small ranges", () => {
      const preview = getCharacterRangePreview(65, 70);

      expect(preview).not.toContain("...");
      expect(preview).toHaveLength(6);
    });

    it("returns exactly range size for ranges <= 20", () => {
      const preview = getCharacterRangePreview(65, 84); // 20 characters

      expect(preview).toHaveLength(20);
      expect(preview).not.toContain("...");
    });
  });

  describe("edge cases", () => {
    it("handles single character range", () => {
      const preview = getCharacterRangePreview(65, 65);

      expect(preview).toHaveLength(1);
      expect(preview[0]).toBe("A");
    });

    it("handles empty range (start > end)", () => {
      const preview = getCharacterRangePreview(100, 50);

      expect(preview).toHaveLength(0);
    });

    it("handles full 256 character range", () => {
      const preview = getCharacterRangePreview(0, 255);

      expect(preview).toHaveLength(21); // 20 + "..."
      expect(preview[preview.length - 1]).toBe("...");
    });

    it("returns array of strings", () => {
      const preview = getCharacterRangePreview(65, 70);

      expect(Array.isArray(preview)).toBe(true);
      preview.forEach((item) => {
        expect(typeof item).toBe("string");
      });
    });
  });
});

// ============================================================================
// FontParseController Tests
// ============================================================================

describe("FontParseController", () => {
  describe("initial state", () => {
    it("creates controller in non-cancelled state", () => {
      const controller = new FontParseController();
      expect(controller.isCancelled()).toBe(false);
    });

    it("creates controller in non-active state", () => {
      const controller = new FontParseController();
      expect(controller.isActive()).toBe(false);
    });
  });

  describe("cancel()", () => {
    it("sets cancelled state to true", () => {
      const controller = new FontParseController();

      controller.cancel();

      expect(controller.isCancelled()).toBe(true);
    });

    it("can be called multiple times without error", () => {
      const controller = new FontParseController();

      expect(() => {
        controller.cancel();
        controller.cancel();
        controller.cancel();
      }).not.toThrow();

      expect(controller.isCancelled()).toBe(true);
    });

    it("sets cancelled state immediately", () => {
      const controller = new FontParseController();

      const beforeCancel = controller.isCancelled();
      controller.cancel();
      const afterCancel = controller.isCancelled();

      expect(beforeCancel).toBe(false);
      expect(afterCancel).toBe(true);
    });
  });

  describe("isCancelled()", () => {
    it("returns false initially", () => {
      const controller = new FontParseController();
      expect(controller.isCancelled()).toBe(false);
    });

    it("returns true after cancel() is called", () => {
      const controller = new FontParseController();
      controller.cancel();
      expect(controller.isCancelled()).toBe(true);
    });

    it("can be called multiple times", () => {
      const controller = new FontParseController();

      expect(controller.isCancelled()).toBe(false);
      expect(controller.isCancelled()).toBe(false);

      controller.cancel();

      expect(controller.isCancelled()).toBe(true);
      expect(controller.isCancelled()).toBe(true);
    });
  });

  describe("isActive()", () => {
    it("returns false when no operation is in progress", () => {
      const controller = new FontParseController();
      expect(controller.isActive()).toBe(false);
    });

    it("returns false after cancellation when no operation started", () => {
      const controller = new FontParseController();
      controller.cancel();
      expect(controller.isActive()).toBe(false);
    });
  });

  describe("multiple controllers", () => {
    it("controllers are independent", () => {
      const controller1 = new FontParseController();
      const controller2 = new FontParseController();

      controller1.cancel();

      expect(controller1.isCancelled()).toBe(true);
      expect(controller2.isCancelled()).toBe(false);
    });

    it("cancelling one does not affect others", () => {
      const controllers = [
        new FontParseController(),
        new FontParseController(),
        new FontParseController(),
      ];

      controllers[1].cancel();

      expect(controllers[0].isCancelled()).toBe(false);
      expect(controllers[1].isCancelled()).toBe(true);
      expect(controllers[2].isCancelled()).toBe(false);
    });
  });
});

// ============================================================================
// debounce Tests
// ============================================================================

describe("debounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("basic functionality", () => {
    it("returns an object with call and cancel functions", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      expect(debounced).toHaveProperty("call");
      expect(debounced).toHaveProperty("cancel");
      expect(typeof debounced.call).toBe("function");
      expect(typeof debounced.cancel).toBe("function");
    });

    it("does not call function immediately", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced.call();

      expect(fn).not.toHaveBeenCalled();
    });

    it("calls function after delay", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced.call();
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("does not call function before delay completes", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced.call();
      jest.advanceTimersByTime(99);

      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("debouncing behavior", () => {
    it("resets timer on subsequent calls", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced.call();
      jest.advanceTimersByTime(50);
      debounced.call();
      jest.advanceTimersByTime(50);

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("only calls function once for multiple rapid calls", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced.call();
      debounced.call();
      debounced.call();
      debounced.call();
      debounced.call();

      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("calls function again after delay if called after execution", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced.call();
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);

      debounced.call();
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("argument passing", () => {
    it("passes arguments to debounced function", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced.call("arg1", "arg2");
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith("arg1", "arg2");
    });

    it("uses latest arguments when called multiple times", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced.call("first");
      debounced.call("second");
      debounced.call("third");
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith("third");
    });

    it("handles multiple arguments correctly", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced.call(1, 2, 3, 4, 5);
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith(1, 2, 3, 4, 5);
    });

    it("handles no arguments", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced.call();
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith();
    });
  });

  describe("cancellation", () => {
    it("cancel() prevents function execution", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced.call();
      debounced.cancel();
      jest.advanceTimersByTime(100);

      expect(fn).not.toHaveBeenCalled();
    });

    it("cancel() can be called multiple times safely", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced.call();
      debounced.cancel();
      debounced.cancel();
      debounced.cancel();
      jest.advanceTimersByTime(100);

      expect(fn).not.toHaveBeenCalled();
    });

    it("cancel() before any call does not throw", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      expect(() => debounced.cancel()).not.toThrow();
    });

    it("can call again after cancel", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced.call();
      debounced.cancel();
      debounced.call();
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("cancel() only affects pending call", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      // First call completes
      debounced.call("first");
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);

      // Second call is cancelled
      debounced.call("second");
      debounced.cancel();
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);

      // Third call completes
      debounced.call("third");
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith("third");
    });
  });

  describe("timing", () => {
    it("respects different delay values", () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      const debounced1 = debounce(fn1, 50);
      const debounced2 = debounce(fn2, 200);

      debounced1.call();
      debounced2.call();

      jest.advanceTimersByTime(50);
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).not.toHaveBeenCalled();

      jest.advanceTimersByTime(150);
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it("handles zero delay", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 0);

      debounced.call();

      // Even with 0 delay, should use setTimeout
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(0);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("handles very long delay", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 10000);

      debounced.call();
      jest.advanceTimersByTime(9999);
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("edge cases", () => {
    it("handles function that throws", () => {
      const fn = jest.fn().mockImplementation(() => {
        throw new Error("Test error");
      });
      const debounced = debounce(fn, 100);

      debounced.call();

      expect(() => jest.advanceTimersByTime(100)).toThrow("Test error");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("multiple debounced instances are independent", () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      const debounced1 = debounce(fn1, 100);
      const debounced2 = debounce(fn2, 100);

      debounced1.call();
      debounced2.call();
      debounced1.cancel();

      jest.advanceTimersByTime(100);

      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledTimes(1);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("font import integration", () => {
  it("default options match Printable ASCII range", () => {
    const options = getDefaultFontImportOptions();
    const printableRange = CHARACTER_RANGES.find(
      (r) => r.name === "Printable ASCII"
    );

    expect(options.startCode).toBe(printableRange!.startCode);
    expect(options.endCode).toBe(printableRange!.endCode);
  });

  it("getCharacterRangePreview works with CHARACTER_RANGES values", () => {
    CHARACTER_RANGES.forEach((range) => {
      const preview = getCharacterRangePreview(range.startCode, range.endCode);

      expect(Array.isArray(preview)).toBe(true);
      expect(preview.length).toBeGreaterThan(0);
      expect(preview.length).toBeLessThanOrEqual(21); // max 20 + "..."
    });
  });

  it("supported extensions match validation function", () => {
    const extensions = getSupportedFontExtensions()
      .split(",")
      .map((ext) => ext.trim());

    extensions.forEach((ext) => {
      const filename = `font${ext}`;
      const file = createMockFile(filename, "");
      expect(isValidFontFile(file)).toBe(true);
    });
  });

  it("FontParseController can be created and cancelled without parse operation", () => {
    const controller = new FontParseController();

    expect(controller.isCancelled()).toBe(false);
    expect(controller.isActive()).toBe(false);

    controller.cancel();

    expect(controller.isCancelled()).toBe(true);
    expect(controller.isActive()).toBe(false);
  });
});
