import {
  formatFileSize,
  formatSize,
  parseSize,
  validateConfig,
  getSuggestedFilename,
  calculateCharacterCount,
  debounce,
  throttle,
  clamp,
  formatTimestamp,
} from "@/lib/character-editor/utils";
import { CharacterSetConfig } from "@/lib/character-editor/types";

describe("formatFileSize", () => {
  it("formats bytes correctly", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1)).toBe("1 B");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1023)).toBe("1023 B");
  });

  it("formats kilobytes correctly", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(10240)).toBe("10.0 KB");
    expect(formatFileSize(1024 * 1024 - 1)).toBe("1024.0 KB");
  });

  it("formats megabytes correctly", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
    expect(formatFileSize(1024 * 1024 * 1.5)).toBe("1.5 MB");
    expect(formatFileSize(1024 * 1024 * 10)).toBe("10.0 MB");
    expect(formatFileSize(1024 * 1024 * 100)).toBe("100.0 MB");
  });

  it("handles large file sizes", () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1024.0 MB");
    expect(formatFileSize(1024 * 1024 * 2048)).toBe("2048.0 MB");
  });

  it("handles edge case of negative numbers", () => {
    // The function does not explicitly handle negative numbers,
    // so it will treat them as bytes
    expect(formatFileSize(-1)).toBe("-1 B");
  });
});

describe("formatSize", () => {
  it("formats standard character sizes", () => {
    const config: CharacterSetConfig = {
      width: 8,
      height: 8,
      padding: "right",
      bitDirection: "msb",
    };
    expect(formatSize(config)).toBe("8x8");
  });

  it("formats non-square sizes", () => {
    const config: CharacterSetConfig = {
      width: 8,
      height: 16,
      padding: "right",
      bitDirection: "msb",
    };
    expect(formatSize(config)).toBe("8x16");
  });

  it("formats minimum size", () => {
    const config: CharacterSetConfig = {
      width: 1,
      height: 1,
      padding: "right",
      bitDirection: "msb",
    };
    expect(formatSize(config)).toBe("1x1");
  });

  it("formats maximum size", () => {
    const config: CharacterSetConfig = {
      width: 16,
      height: 16,
      padding: "right",
      bitDirection: "msb",
    };
    expect(formatSize(config)).toBe("16x16");
  });
});

describe("parseSize", () => {
  it("parses valid size strings", () => {
    expect(parseSize("8x8")).toEqual({ width: 8, height: 8 });
    expect(parseSize("8x16")).toEqual({ width: 8, height: 16 });
    expect(parseSize("16x8")).toEqual({ width: 16, height: 8 });
    expect(parseSize("1x1")).toEqual({ width: 1, height: 1 });
    expect(parseSize("16x16")).toEqual({ width: 16, height: 16 });
  });

  it("parses larger numbers", () => {
    expect(parseSize("100x200")).toEqual({ width: 100, height: 200 });
    expect(parseSize("1024x768")).toEqual({ width: 1024, height: 768 });
  });

  it("returns null for invalid formats", () => {
    expect(parseSize("8")).toBeNull();
    expect(parseSize("x8")).toBeNull();
    expect(parseSize("8x")).toBeNull();
    expect(parseSize("8X8")).toBeNull(); // uppercase X
    expect(parseSize("8 x 8")).toBeNull(); // spaces
    expect(parseSize("8*8")).toBeNull(); // wrong separator
    expect(parseSize("")).toBeNull();
    expect(parseSize("abc")).toBeNull();
    expect(parseSize("8xabc")).toBeNull();
    expect(parseSize("abcx8")).toBeNull();
  });

  it("returns null for negative numbers", () => {
    expect(parseSize("-8x8")).toBeNull();
    expect(parseSize("8x-8")).toBeNull();
    expect(parseSize("-8x-8")).toBeNull();
  });

  it("returns null for decimal numbers", () => {
    expect(parseSize("8.5x8")).toBeNull();
    expect(parseSize("8x8.5")).toBeNull();
  });
});

describe("validateConfig", () => {
  it("returns no errors for valid configuration", () => {
    const config: CharacterSetConfig = {
      width: 8,
      height: 8,
      padding: "right",
      bitDirection: "msb",
    };
    expect(validateConfig(config)).toEqual([]);
  });

  it("returns no errors for edge valid values", () => {
    const minConfig: CharacterSetConfig = {
      width: 1,
      height: 1,
      padding: "left",
      bitDirection: "lsb",
    };
    expect(validateConfig(minConfig)).toEqual([]);

    const maxConfig: CharacterSetConfig = {
      width: 16,
      height: 16,
      padding: "right",
      bitDirection: "msb",
    };
    expect(validateConfig(maxConfig)).toEqual([]);
  });

  it("returns error for width less than 1", () => {
    const config: CharacterSetConfig = {
      width: 0,
      height: 8,
      padding: "right",
      bitDirection: "msb",
    };
    const errors = validateConfig(config);
    expect(errors).toContain("Width must be between 1 and 16 pixels");
  });

  it("returns error for width greater than 16", () => {
    const config: CharacterSetConfig = {
      width: 17,
      height: 8,
      padding: "right",
      bitDirection: "msb",
    };
    const errors = validateConfig(config);
    expect(errors).toContain("Width must be between 1 and 16 pixels");
  });

  it("returns error for height less than 1", () => {
    const config: CharacterSetConfig = {
      width: 8,
      height: 0,
      padding: "right",
      bitDirection: "msb",
    };
    const errors = validateConfig(config);
    expect(errors).toContain("Height must be between 1 and 16 pixels");
  });

  it("returns error for height greater than 16", () => {
    const config: CharacterSetConfig = {
      width: 8,
      height: 17,
      padding: "right",
      bitDirection: "msb",
    };
    const errors = validateConfig(config);
    expect(errors).toContain("Height must be between 1 and 16 pixels");
  });

  it("returns error for invalid padding", () => {
    const config = {
      width: 8,
      height: 8,
      padding: "center" as "left" | "right",
      bitDirection: "msb" as const,
    };
    const errors = validateConfig(config);
    expect(errors).toContain("Padding must be 'left' or 'right'");
  });

  it("returns error for invalid bitDirection", () => {
    const config = {
      width: 8,
      height: 8,
      padding: "right" as const,
      bitDirection: "bidi" as "msb" | "lsb",
    };
    const errors = validateConfig(config);
    expect(errors).toContain("Bit direction must be 'msb' or 'lsb'");
  });

  it("returns multiple errors for multiple invalid fields", () => {
    const config = {
      width: 0,
      height: 20,
      padding: "invalid" as "left" | "right",
      bitDirection: "invalid" as "msb" | "lsb",
    };
    const errors = validateConfig(config);
    expect(errors).toHaveLength(4);
    expect(errors).toContain("Width must be between 1 and 16 pixels");
    expect(errors).toContain("Height must be between 1 and 16 pixels");
    expect(errors).toContain("Padding must be 'left' or 'right'");
    expect(errors).toContain("Bit direction must be 'msb' or 'lsb'");
  });

  it("returns error for negative dimensions", () => {
    const config: CharacterSetConfig = {
      width: -5,
      height: -3,
      padding: "right",
      bitDirection: "msb",
    };
    const errors = validateConfig(config);
    expect(errors).toContain("Width must be between 1 and 16 pixels");
    expect(errors).toContain("Height must be between 1 and 16 pixels");
  });
});

describe("getSuggestedFilename", () => {
  it("converts name to lowercase with dashes", () => {
    expect(getSuggestedFilename("My Character Set")).toBe("my-character-set.bin");
  });

  it("removes special characters", () => {
    expect(getSuggestedFilename("Test@File#Name!")).toBe("test-file-name.bin");
    expect(getSuggestedFilename("File (version 2)")).toBe("file-version-2.bin");
  });

  it("handles multiple spaces and special characters", () => {
    expect(getSuggestedFilename("   Lots   of   Spaces   ")).toBe("lots-of-spaces.bin");
    expect(getSuggestedFilename("---Leading-Trailing---")).toBe("leading-trailing.bin");
  });

  it("handles numbers in name", () => {
    expect(getSuggestedFilename("C64 ROM v2")).toBe("c64-rom-v2.bin");
    expect(getSuggestedFilename("8x8 Characters")).toBe("8x8-characters.bin");
  });

  it("returns default filename for empty or special-only input", () => {
    expect(getSuggestedFilename("")).toBe("charset.bin");
    expect(getSuggestedFilename("   ")).toBe("charset.bin");
    expect(getSuggestedFilename("@#$%^&*")).toBe("charset.bin");
  });

  it("handles unicode and non-ASCII characters", () => {
    expect(getSuggestedFilename("Schriftart fur Deutsch")).toBe("schriftart-fur-deutsch.bin");
    // Non-ASCII are treated as special characters and removed
    expect(getSuggestedFilename("caracteres especiais")).toBe("caracteres-especiais.bin");
  });

  it("collapses multiple dashes into one", () => {
    expect(getSuggestedFilename("test--name")).toBe("test-name.bin");
    expect(getSuggestedFilename("a___b___c")).toBe("a-b-c.bin");
  });
});

describe("calculateCharacterCount", () => {
  it("calculates character count for standard 8x8 characters", () => {
    const config: CharacterSetConfig = {
      width: 8,
      height: 8,
      padding: "right",
      bitDirection: "msb",
    };
    // 8x8 = 8 bytes per character
    expect(calculateCharacterCount(2048, config)).toBe(256); // 2KB ROM
    expect(calculateCharacterCount(4096, config)).toBe(512); // 4KB ROM
    expect(calculateCharacterCount(8, config)).toBe(1);
    expect(calculateCharacterCount(16, config)).toBe(2);
  });

  it("calculates for 8x16 characters", () => {
    const config: CharacterSetConfig = {
      width: 8,
      height: 16,
      padding: "right",
      bitDirection: "msb",
    };
    // 8x16 = 16 bytes per character
    expect(calculateCharacterCount(4096, config)).toBe(256);
    expect(calculateCharacterCount(16, config)).toBe(1);
  });

  it("calculates for 16x16 characters", () => {
    const config: CharacterSetConfig = {
      width: 16,
      height: 16,
      padding: "right",
      bitDirection: "msb",
    };
    // 16x16 = 2 bytes per line * 16 lines = 32 bytes per character
    expect(calculateCharacterCount(8192, config)).toBe(256);
    expect(calculateCharacterCount(32, config)).toBe(1);
  });

  it("calculates for non-byte-aligned widths", () => {
    const config: CharacterSetConfig = {
      width: 5,
      height: 8,
      padding: "right",
      bitDirection: "msb",
    };
    // 5 pixels wide = 1 byte per line (ceil(5/8)), 8 lines = 8 bytes per char
    expect(calculateCharacterCount(2048, config)).toBe(256);
  });

  it("calculates for 12-pixel wide characters", () => {
    const config: CharacterSetConfig = {
      width: 12,
      height: 8,
      padding: "right",
      bitDirection: "msb",
    };
    // 12 pixels wide = 2 bytes per line (ceil(12/8)), 8 lines = 16 bytes per char
    expect(calculateCharacterCount(4096, config)).toBe(256);
  });

  it("handles partial characters at end of file", () => {
    const config: CharacterSetConfig = {
      width: 8,
      height: 8,
      padding: "right",
      bitDirection: "msb",
    };
    // 8 bytes per character, 20 bytes = 2 complete characters
    expect(calculateCharacterCount(20, config)).toBe(2);
  });

  it("returns 0 for file size smaller than one character", () => {
    const config: CharacterSetConfig = {
      width: 8,
      height: 8,
      padding: "right",
      bitDirection: "msb",
    };
    expect(calculateCharacterCount(7, config)).toBe(0);
    expect(calculateCharacterCount(0, config)).toBe(0);
  });

  it("returns 0 for empty file", () => {
    const config: CharacterSetConfig = {
      width: 8,
      height: 8,
      padding: "right",
      bitDirection: "msb",
    };
    expect(calculateCharacterCount(0, config)).toBe(0);
  });
});

describe("debounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calls function after delay", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(99);
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("resets timer on subsequent calls", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    jest.advanceTimersByTime(50);

    debouncedFn();
    jest.advanceTimersByTime(50);

    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("only calls once for rapid successive calls", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();
    debouncedFn();
    debouncedFn();

    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("passes arguments to the debounced function", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn("arg1", 42);
    jest.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledWith("arg1", 42);
  });

  it("uses latest arguments when called multiple times", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn("first");
    debouncedFn("second");
    debouncedFn("third");

    jest.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith("third");
  });

  it("works with zero delay", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 0);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(0);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

describe("throttle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calls function immediately on first call", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("ignores calls during throttle period", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("allows calls after throttle period expires", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("resets throttle after each allowed call", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn(); // Called
    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(50);
    throttledFn(); // Ignored
    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(50);
    throttledFn(); // Called
    expect(mockFn).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(50);
    throttledFn(); // Ignored
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("passes arguments to the throttled function", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn("arg1", 42);
    expect(mockFn).toHaveBeenCalledWith("arg1", 42);
  });

  it("uses first arguments within throttle period", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn("first");
    throttledFn("second");
    throttledFn("third");

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith("first");

    jest.advanceTimersByTime(100);
    throttledFn("fourth");
    expect(mockFn).toHaveBeenCalledWith("fourth");
  });

  it("works with zero limit", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 0);

    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(0);
    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("returns min when value is below range", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(-100, 0, 10)).toBe(0);
    expect(clamp(0, 1, 10)).toBe(1);
  });

  it("returns max when value is above range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(100, 0, 10)).toBe(10);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it("handles negative ranges", () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-15, -10, -1)).toBe(-10);
    expect(clamp(0, -10, -1)).toBe(-1);
  });

  it("handles decimal values", () => {
    expect(clamp(5.5, 0, 10)).toBe(5.5);
    expect(clamp(-0.5, 0, 10)).toBe(0);
    expect(clamp(10.5, 0, 10)).toBe(10);
  });

  it("handles equal min and max", () => {
    expect(clamp(5, 5, 5)).toBe(5);
    expect(clamp(0, 5, 5)).toBe(5);
    expect(clamp(10, 5, 5)).toBe(5);
  });

  it("handles edge case where min equals max", () => {
    expect(clamp(100, 50, 50)).toBe(50);
    expect(clamp(-100, 50, 50)).toBe(50);
  });
});

describe("formatTimestamp", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns 'Today' for timestamps from today", () => {
    const now = new Date("2024-06-15T12:00:00").getTime();
    jest.setSystemTime(now);

    const todayMorning = new Date("2024-06-15T08:00:00").getTime();
    expect(formatTimestamp(todayMorning)).toBe("Today");

    const todayEvening = new Date("2024-06-15T11:59:59").getTime();
    expect(formatTimestamp(todayEvening)).toBe("Today");
  });

  it("returns 'Yesterday' for timestamps from yesterday", () => {
    const now = new Date("2024-06-15T12:00:00").getTime();
    jest.setSystemTime(now);

    const yesterday = new Date("2024-06-14T12:00:00").getTime();
    expect(formatTimestamp(yesterday)).toBe("Yesterday");
  });

  it("returns 'X days ago' for timestamps within a week", () => {
    const now = new Date("2024-06-15T12:00:00").getTime();
    jest.setSystemTime(now);

    const twoDaysAgo = new Date("2024-06-13T12:00:00").getTime();
    expect(formatTimestamp(twoDaysAgo)).toBe("2 days ago");

    const sixDaysAgo = new Date("2024-06-09T12:00:00").getTime();
    expect(formatTimestamp(sixDaysAgo)).toBe("6 days ago");
  });

  it("returns formatted date for timestamps older than a week", () => {
    const now = new Date("2024-06-15T12:00:00").getTime();
    jest.setSystemTime(now);

    const oldDate = new Date("2024-06-01T12:00:00").getTime();
    const result = formatTimestamp(oldDate);
    // The exact format depends on locale, but it should be a date string
    expect(result).not.toBe("Today");
    expect(result).not.toBe("Yesterday");
    expect(result).not.toMatch(/days ago/);
  });

  it("returns formatted date for timestamps from previous months", () => {
    const now = new Date("2024-06-15T12:00:00").getTime();
    jest.setSystemTime(now);

    const lastMonth = new Date("2024-05-01T12:00:00").getTime();
    const result = formatTimestamp(lastMonth);
    expect(result).not.toBe("Today");
    expect(result).not.toMatch(/days ago/);
  });
});
