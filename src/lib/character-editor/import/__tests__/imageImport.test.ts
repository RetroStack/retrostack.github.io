import {
  getDefaultImageImportOptions,
  isValidImageFile,
  getSupportedImageExtensions,
  detectCharacterDimensions,
  parseImageToCharacters,
  createGridOverlayImage,
  ImageImportOptions,
} from "@/lib/character-editor/import/imageImport";

/**
 * Mock ImageData class for testing browser-dependent functions
 */
class MockImageData implements ImageData {
  // Use explicit ArrayBuffer generic to match ImageData interface
  data: Uint8ClampedArray<ArrayBuffer>;
  width: number;
  height: number;
  colorSpace: PredefinedColorSpace = "srgb";

  constructor(width: number, height: number, data?: Uint8ClampedArray<ArrayBuffer>) {
    this.width = width;
    this.height = height;
    this.data = data ?? new Uint8ClampedArray(width * height * 4);
  }

  /**
   * Set a pixel at the given coordinates
   * @param x X coordinate
   * @param y Y coordinate
   * @param r Red value (0-255)
   * @param g Green value (0-255)
   * @param b Blue value (0-255)
   * @param a Alpha value (0-255)
   */
  setPixel(x: number, y: number, r: number, g: number, b: number, a: number = 255): void {
    const index = (y * this.width + x) * 4;
    this.data[index] = r;
    this.data[index + 1] = g;
    this.data[index + 2] = b;
    this.data[index + 3] = a;
  }

  /**
   * Fill the entire image with a solid color
   */
  fill(r: number, g: number, b: number, a: number = 255): void {
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = a;
    }
  }

  /**
   * Fill a rectangular region with a color
   */
  fillRect(x: number, y: number, width: number, height: number, r: number, g: number, b: number, a: number = 255): void {
    for (let py = y; py < y + height && py < this.height; py++) {
      for (let px = x; px < x + width && px < this.width; px++) {
        this.setPixel(px, py, r, g, b, a);
      }
    }
  }
}

// Mock global ImageData for createGridOverlayImage which uses the native ImageData constructor
// @ts-expect-error - Mocking browser API for tests
global.ImageData = class GlobalMockImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colorSpace: PredefinedColorSpace = "srgb";

  constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight: number, height?: number) {
    if (typeof dataOrWidth === "number") {
      this.width = dataOrWidth;
      this.height = widthOrHeight;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    } else {
      this.data = dataOrWidth;
      this.width = widthOrHeight;
      this.height = height ?? 0;
    }
  }
};

/**
 * Create a mock File object for testing
 */
function createMockFile(type: string, name: string = "test-file"): File {
  const blob = new Blob([""], { type });
  return new File([blob], name, { type });
}

/**
 * Create an 8x8 character pattern in ImageData
 * @param imageData The image data to draw on
 * @param startX Starting X position
 * @param startY Starting Y position
 * @param pattern 8x8 boolean array (true = black/on, false = white/off)
 */
function drawCharacterPattern(
  imageData: MockImageData,
  startX: number,
  startY: number,
  pattern: boolean[][]
): void {
  for (let y = 0; y < pattern.length; y++) {
    for (let x = 0; x < pattern[y].length; x++) {
      const isOn = pattern[y][x];
      // Black (0,0,0) for "on" pixels, white (255,255,255) for "off" pixels
      const color = isOn ? 0 : 255;
      imageData.setPixel(startX + x, startY + y, color, color, color, 255);
    }
  }
}

describe("imageImport", () => {
  describe("getDefaultImageImportOptions", () => {
    it("returns valid default options", () => {
      const options = getDefaultImageImportOptions();

      expect(options).toEqual({
        charWidth: 8,
        charHeight: 8,
        offsetX: 0,
        offsetY: 0,
        gapX: 0,
        gapY: 0,
        forceColumns: 0,
        forceRows: 0,
        threshold: 128,
        invert: false,
        maxCharacters: 256,
        pixelWidth: 1,
        pixelHeight: 1,
        readingOrder: "ltr-ttb",
        rotation: 0,
      });
    });

    it("has default pixel dimensions of 1", () => {
      const options = getDefaultImageImportOptions();

      expect(options.pixelWidth).toBe(1);
      expect(options.pixelHeight).toBe(1);
    });

    it("returns a new object each time", () => {
      const options1 = getDefaultImageImportOptions();
      const options2 = getDefaultImageImportOptions();

      expect(options1).not.toBe(options2);
      expect(options1).toEqual(options2);
    });

    it("has sensible default character dimensions", () => {
      const options = getDefaultImageImportOptions();

      expect(options.charWidth).toBe(8);
      expect(options.charHeight).toBe(8);
    });

    it("has threshold at midpoint brightness", () => {
      const options = getDefaultImageImportOptions();

      expect(options.threshold).toBe(128);
    });
  });

  describe("isValidImageFile", () => {
    it("accepts PNG files", () => {
      const file = createMockFile("image/png", "test.png");
      expect(isValidImageFile(file)).toBe(true);
    });

    it("accepts JPEG files", () => {
      const file = createMockFile("image/jpeg", "test.jpg");
      expect(isValidImageFile(file)).toBe(true);
    });

    it("accepts GIF files", () => {
      const file = createMockFile("image/gif", "test.gif");
      expect(isValidImageFile(file)).toBe(true);
    });

    it("accepts WebP files", () => {
      const file = createMockFile("image/webp", "test.webp");
      expect(isValidImageFile(file)).toBe(true);
    });

    it("rejects SVG files", () => {
      const file = createMockFile("image/svg+xml", "test.svg");
      expect(isValidImageFile(file)).toBe(false);
    });

    it("rejects BMP files", () => {
      const file = createMockFile("image/bmp", "test.bmp");
      expect(isValidImageFile(file)).toBe(false);
    });

    it("rejects TIFF files", () => {
      const file = createMockFile("image/tiff", "test.tiff");
      expect(isValidImageFile(file)).toBe(false);
    });

    it("rejects text files", () => {
      const file = createMockFile("text/plain", "test.txt");
      expect(isValidImageFile(file)).toBe(false);
    });

    it("rejects PDF files", () => {
      const file = createMockFile("application/pdf", "test.pdf");
      expect(isValidImageFile(file)).toBe(false);
    });

    it("rejects files with empty type", () => {
      const file = createMockFile("", "test");
      expect(isValidImageFile(file)).toBe(false);
    });

    it("rejects files with generic binary type", () => {
      const file = createMockFile("application/octet-stream", "test.bin");
      expect(isValidImageFile(file)).toBe(false);
    });
  });

  describe("getSupportedImageExtensions", () => {
    it("returns correct extensions string", () => {
      const extensions = getSupportedImageExtensions();

      expect(extensions).toBe(".png, .jpg, .jpeg, .gif, .webp");
    });

    it("includes PNG extension", () => {
      const extensions = getSupportedImageExtensions();
      expect(extensions).toContain(".png");
    });

    it("includes JPEG extensions", () => {
      const extensions = getSupportedImageExtensions();
      expect(extensions).toContain(".jpg");
      expect(extensions).toContain(".jpeg");
    });

    it("includes GIF extension", () => {
      const extensions = getSupportedImageExtensions();
      expect(extensions).toContain(".gif");
    });

    it("includes WebP extension", () => {
      const extensions = getSupportedImageExtensions();
      expect(extensions).toContain(".webp");
    });
  });

  describe("detectCharacterDimensions", () => {
    it("detects 128-character grid from 128x64 image (8x8 chars, 16x8 layout)", () => {
      const suggestions = detectCharacterDimensions(128, 64);

      // Should suggest 8x8 with 16 columns x 8 rows = 128 characters
      const match8x8 = suggestions.find(
        (s) => s.width === 8 && s.height === 8 && s.columns * s.rows === 128
      );
      expect(match8x8).toBeDefined();
      expect(match8x8?.columns).toBe(16);
      expect(match8x8?.rows).toBe(8);
    });

    it("detects 256-character grid from 128x128 image (8x8 chars, 16x16 layout)", () => {
      const suggestions = detectCharacterDimensions(128, 128);

      // Should suggest 8x8 with 16 columns x 16 rows = 256 characters
      const match8x8 = suggestions.find(
        (s) => s.width === 8 && s.height === 8 && s.columns * s.rows === 256
      );
      expect(match8x8).toBeDefined();
      expect(match8x8?.columns).toBe(16);
      expect(match8x8?.rows).toBe(16);
    });

    it("detects 256-character grid from 256x128 image (8x16 chars, 32x8 layout)", () => {
      const suggestions = detectCharacterDimensions(256, 128);

      // Should suggest 8x16 with 32 columns x 8 rows = 256 characters
      const match8x16 = suggestions.find(
        (s) => s.width === 8 && s.height === 16 && s.columns * s.rows === 256
      );
      expect(match8x16).toBeDefined();
    });

    it("prioritizes common character counts (128, 256) in suggestions", () => {
      const suggestions = detectCharacterDimensions(128, 128);

      // First suggestions should have common character counts
      const firstSuggestion = suggestions[0];
      const totalChars = firstSuggestion.columns * firstSuggestion.rows;

      expect([64, 96, 128, 256]).toContain(totalChars);
    });

    it("suggests 8x8 as fallback for unusual dimensions", () => {
      const suggestions = detectCharacterDimensions(50, 50);

      expect(suggestions.length).toBeGreaterThan(0);
      // Should include at least 8x8 suggestion
      const has8x8 = suggestions.some((s) => s.width === 8 && s.height === 8);
      expect(has8x8).toBe(true);
    });

    it("handles very small images", () => {
      const suggestions = detectCharacterDimensions(8, 8);

      expect(suggestions.length).toBeGreaterThan(0);
      // Should suggest single character
      const singleChar = suggestions.find((s) => s.columns === 1 && s.rows === 1);
      expect(singleChar).toBeDefined();
    });

    it("handles images smaller than minimum character size", () => {
      const suggestions = detectCharacterDimensions(4, 4);

      // Should still return some suggestion
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it("suggests multiple character sizes for large images", () => {
      // 256x256 divides evenly by 8x8 (1024 chars), 16x16 (256 chars), etc.
      const suggestions = detectCharacterDimensions(256, 256);

      // Should suggest multiple options
      expect(suggestions.length).toBeGreaterThan(1);

      // Check that different sizes are suggested
      const sizes = suggestions.map((s) => `${s.width}x${s.height}`);
      const uniqueSizes = [...new Set(sizes)];
      expect(uniqueSizes.length).toBeGreaterThan(1);
    });

    it("calculates correct column and row counts", () => {
      const suggestions = detectCharacterDimensions(64, 64);

      for (const suggestion of suggestions) {
        // Verify the math is correct
        expect(suggestion.columns).toBe(Math.floor(64 / suggestion.width));
        expect(suggestion.rows).toBe(Math.floor(64 / suggestion.height));
      }
    });

    it("handles 96-character PETSCII-style layouts", () => {
      // 8x8 chars in 16x6 layout = 96 characters
      const suggestions = detectCharacterDimensions(128, 48);

      const match96 = suggestions.find(
        (s) => s.width === 8 && s.height === 8 && s.columns * s.rows === 96
      );
      expect(match96).toBeDefined();
    });

    it("includes 16x16 for images where it results in common counts", () => {
      // 256x256 with 16x16 chars gives 16x16 = 256 characters
      const suggestions = detectCharacterDimensions(256, 256);

      const has16x16 = suggestions.some((s) => s.width === 16 && s.height === 16);
      expect(has16x16).toBe(true);
    });
  });

  describe("parseImageToCharacters", () => {
    it("parses a simple 8x8 grid with one character", () => {
      const imageData = new MockImageData(8, 8);
      imageData.fill(255, 255, 255); // White background

      // Draw a simple pattern - checkerboard in top-left 4x4
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          if ((x + y) % 2 === 0) {
            imageData.setPixel(x, y, 0, 0, 0, 255); // Black
          }
        }
      }

      const options: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        forceColumns: 1,
        forceRows: 1,
      };

      const result = parseImageToCharacters(imageData, options);

      expect(result.characters.length).toBe(1);
      expect(result.columns).toBe(1);
      expect(result.rows).toBe(1);
      expect(result.imageWidth).toBe(8);
      expect(result.imageHeight).toBe(8);
    });

    it("parses a 16x16 image as 4 characters (8x8 grid)", () => {
      const imageData = new MockImageData(16, 16);
      imageData.fill(255, 255, 255); // White background

      // Make each quadrant different
      imageData.fillRect(0, 0, 8, 8, 0, 0, 0); // Top-left: black
      imageData.fillRect(8, 0, 8, 8, 255, 255, 255); // Top-right: white
      imageData.fillRect(0, 8, 8, 8, 255, 255, 255); // Bottom-left: white
      imageData.fillRect(8, 8, 8, 8, 0, 0, 0); // Bottom-right: black

      const options = getDefaultImageImportOptions();
      const result = parseImageToCharacters(imageData, options);

      expect(result.characters.length).toBe(4);
      expect(result.columns).toBe(2);
      expect(result.rows).toBe(2);

      // First character (top-left) should be all on
      expect(result.characters[0].pixels.every((row) => row.every((p) => p === true))).toBe(true);

      // Second character (top-right) should be all off
      expect(result.characters[1].pixels.every((row) => row.every((p) => p === false))).toBe(true);
    });

    it("handles 8x16 character dimensions", () => {
      const imageData = new MockImageData(16, 32);
      imageData.fill(255, 255, 255);

      const options: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        charWidth: 8,
        charHeight: 16,
      };

      const result = parseImageToCharacters(imageData, options);

      expect(result.characters.length).toBe(4); // 2 columns x 2 rows
      expect(result.columns).toBe(2);
      expect(result.rows).toBe(2);

      // Each character should have 16 rows
      expect(result.characters[0].pixels.length).toBe(16);
      expect(result.characters[0].pixels[0].length).toBe(8);
    });

    it("applies horizontal gap between characters", () => {
      const imageData = new MockImageData(19, 8); // 8 + 3 gap + 8
      imageData.fill(255, 255, 255);

      // First character area (0-7): black
      imageData.fillRect(0, 0, 8, 8, 0, 0, 0);

      // Gap area (8-10): white (should be ignored)

      // Second character area (11-18): white
      // Already white from fill

      const options: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        gapX: 3,
        forceColumns: 2,
        forceRows: 1,
      };

      const result = parseImageToCharacters(imageData, options);

      expect(result.characters.length).toBe(2);

      // First character should be all on (black)
      expect(result.characters[0].pixels.every((row) => row.every((p) => p === true))).toBe(true);

      // Second character should be all off (white)
      expect(result.characters[1].pixels.every((row) => row.every((p) => p === false))).toBe(true);
    });

    it("applies vertical gap between characters", () => {
      const imageData = new MockImageData(8, 19); // 8 + 3 gap + 8
      imageData.fill(255, 255, 255);

      // First row: black
      imageData.fillRect(0, 0, 8, 8, 0, 0, 0);

      // Gap row (8-10): white (ignored)

      // Second row: white (already filled)

      const options: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        gapY: 3,
        forceColumns: 1,
        forceRows: 2,
      };

      const result = parseImageToCharacters(imageData, options);

      expect(result.characters.length).toBe(2);
      expect(result.characters[0].pixels.every((row) => row.every((p) => p === true))).toBe(true);
      expect(result.characters[1].pixels.every((row) => row.every((p) => p === false))).toBe(true);
    });

    it("applies X offset to skip leading pixels", () => {
      const imageData = new MockImageData(12, 8); // 4 offset + 8 character
      imageData.fill(255, 255, 255);

      // Skip first 4 pixels, then black character
      imageData.fillRect(4, 0, 8, 8, 0, 0, 0);

      const options: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        offsetX: 4,
        forceColumns: 1,
        forceRows: 1,
      };

      const result = parseImageToCharacters(imageData, options);

      expect(result.characters.length).toBe(1);
      expect(result.characters[0].pixels.every((row) => row.every((p) => p === true))).toBe(true);
    });

    it("applies Y offset to skip leading rows", () => {
      const imageData = new MockImageData(8, 12); // 4 offset + 8 character
      imageData.fill(255, 255, 255);

      // Skip first 4 rows, then black character
      imageData.fillRect(0, 4, 8, 8, 0, 0, 0);

      const options: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        offsetY: 4,
        forceColumns: 1,
        forceRows: 1,
      };

      const result = parseImageToCharacters(imageData, options);

      expect(result.characters.length).toBe(1);
      expect(result.characters[0].pixels.every((row) => row.every((p) => p === true))).toBe(true);
    });

    it("respects forceColumns option", () => {
      const imageData = new MockImageData(64, 8);
      imageData.fill(255, 255, 255);

      const options: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        forceColumns: 4, // Force 4 columns instead of auto-detected 8
      };

      const result = parseImageToCharacters(imageData, options);

      expect(result.columns).toBe(4);
      expect(result.characters.length).toBe(4);
    });

    it("respects forceRows option", () => {
      const imageData = new MockImageData(8, 64);
      imageData.fill(255, 255, 255);

      const options: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        forceRows: 4, // Force 4 rows instead of auto-detected 8
      };

      const result = parseImageToCharacters(imageData, options);

      expect(result.rows).toBe(4);
      expect(result.characters.length).toBe(4);
    });

    it("respects maxCharacters limit", () => {
      const imageData = new MockImageData(64, 64); // Could have 64 8x8 characters
      imageData.fill(255, 255, 255);

      const options: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        maxCharacters: 10,
      };

      const result = parseImageToCharacters(imageData, options);

      expect(result.characters.length).toBe(10);
    });

    it("handles threshold for grayscale conversion", () => {
      const imageData = new MockImageData(8, 8);

      // Fill with mid-gray (127) - just below default threshold of 128
      imageData.fill(127, 127, 127);

      const optionsLowThreshold: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        threshold: 100, // 127 > 100, so should be "off"
        forceColumns: 1,
        forceRows: 1,
      };

      const resultLow = parseImageToCharacters(imageData, optionsLowThreshold);
      // With low threshold, gray pixels appear white (off)
      expect(resultLow.characters[0].pixels.every((row) => row.every((p) => p === false))).toBe(true);

      const optionsHighThreshold: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        threshold: 150, // 127 < 150, so should be "on"
        forceColumns: 1,
        forceRows: 1,
      };

      const resultHigh = parseImageToCharacters(imageData, optionsHighThreshold);
      // With high threshold, gray pixels appear black (on)
      expect(resultHigh.characters[0].pixels.every((row) => row.every((p) => p === true))).toBe(true);
    });

    it("handles invert option", () => {
      const imageData = new MockImageData(8, 8);
      imageData.fill(0, 0, 0); // Black pixels

      const optionsNormal: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        invert: false,
        forceColumns: 1,
        forceRows: 1,
      };

      const resultNormal = parseImageToCharacters(imageData, optionsNormal);
      // Black = on by default
      expect(resultNormal.characters[0].pixels.every((row) => row.every((p) => p === true))).toBe(true);

      const optionsInverted: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        invert: true,
        forceColumns: 1,
        forceRows: 1,
      };

      const resultInverted = parseImageToCharacters(imageData, optionsInverted);
      // With invert, black = off
      expect(resultInverted.characters[0].pixels.every((row) => row.every((p) => p === false))).toBe(true);
    });

    it("treats transparent pixels as white (off)", () => {
      const imageData = new MockImageData(8, 8);
      // Fill with transparent pixels (alpha = 0)
      imageData.fill(0, 0, 0, 0);

      const options: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        forceColumns: 1,
        forceRows: 1,
      };

      const result = parseImageToCharacters(imageData, options);

      // Transparent should be treated as white/off
      expect(result.characters[0].pixels.every((row) => row.every((p) => p === false))).toBe(true);
    });

    it("handles pixels outside image bounds gracefully", () => {
      const imageData = new MockImageData(8, 8);
      imageData.fill(0, 0, 0);

      const options: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        offsetX: 4, // This will push some character pixels outside
        forceColumns: 1,
        forceRows: 1,
      };

      const result = parseImageToCharacters(imageData, options);

      // Should not throw, should have a character
      expect(result.characters.length).toBe(1);
      // Right half of character is outside bounds, should be false
      expect(result.characters[0].pixels[0].slice(0, 4).every((p) => p === true)).toBe(true);
      expect(result.characters[0].pixels[0].slice(4, 8).every((p) => p === false)).toBe(true);
    });

    it("uses perceived brightness for color images", () => {
      const imageData = new MockImageData(8, 8);

      // Red pixel - brightness = 0.299 * 255 + 0.587 * 0 + 0.114 * 0 = 76
      imageData.fill(255, 0, 0);

      const options: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        threshold: 100, // Red (76) is below threshold, so "on"
        forceColumns: 1,
        forceRows: 1,
      };

      const result = parseImageToCharacters(imageData, options);
      expect(result.characters[0].pixels.every((row) => row.every((p) => p === true))).toBe(true);

      // Now test with threshold below red's brightness
      const optionsLowThreshold: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        threshold: 50, // Red (76) is above threshold, so "off"
        forceColumns: 1,
        forceRows: 1,
      };

      const resultLow = parseImageToCharacters(imageData, optionsLowThreshold);
      expect(resultLow.characters[0].pixels.every((row) => row.every((p) => p === false))).toBe(true);
    });

    it("parses characters in row-major order", () => {
      const imageData = new MockImageData(24, 16);
      imageData.fill(255, 255, 255);

      // Mark each character distinctly by filling just the first pixel
      // Row 0: chars 0, 1, 2
      // Row 1: chars 3, 4, 5
      imageData.setPixel(0, 0, 100, 100, 100); // Char 0
      imageData.setPixel(8, 0, 100, 100, 100); // Char 1
      imageData.setPixel(16, 0, 100, 100, 100); // Char 2
      imageData.setPixel(0, 8, 100, 100, 100); // Char 3
      imageData.setPixel(8, 8, 100, 100, 100); // Char 4
      imageData.setPixel(16, 8, 100, 100, 100); // Char 5

      const options = getDefaultImageImportOptions();
      const result = parseImageToCharacters(imageData, options);

      expect(result.characters.length).toBe(6);
      expect(result.columns).toBe(3);
      expect(result.rows).toBe(2);

      // Verify row-major order - each character should have first pixel "on"
      for (let i = 0; i < 6; i++) {
        expect(result.characters[i].pixels[0][0]).toBe(true);
        // Other pixels should be off
        expect(result.characters[i].pixels[0][1]).toBe(false);
      }
    });

    describe("pixelWidth and pixelHeight options", () => {
      it("averages brightness across pixel width when pixelWidth > 1", () => {
        // Create image where each logical pixel is 2 source pixels wide
        const imageData = new MockImageData(16, 8);
        imageData.fill(255, 255, 255);

        // For the first logical pixel (0,0), create a 2x1 area
        // One black pixel (0) and one white pixel (255) = average 127.5 -> rounds to 128
        imageData.setPixel(0, 0, 0, 0, 0); // Black
        imageData.setPixel(1, 0, 255, 255, 255); // White

        const options: ImageImportOptions = {
          ...getDefaultImageImportOptions(),
          charWidth: 8, // Logical character width
          charHeight: 8, // Logical character height
          pixelWidth: 2, // Each logical pixel is 2 source pixels wide
          pixelHeight: 1,
          threshold: 129, // Average of 128 is below 129, so "on"
          forceColumns: 1,
          forceRows: 1,
        };

        const result = parseImageToCharacters(imageData, options);

        expect(result.characters.length).toBe(1);
        // First pixel should be on (average brightness 128 < 129)
        expect(result.characters[0].pixels[0][0]).toBe(true);
      });

      it("averages brightness across pixel height when pixelHeight > 1", () => {
        // Create image where each logical pixel is 2 source pixels tall
        const imageData = new MockImageData(8, 16);
        imageData.fill(255, 255, 255);

        // For the first logical pixel (0,0), create a 1x2 area
        // One black pixel (0) and one white pixel (255) = average 127.5 -> rounds to 128
        imageData.setPixel(0, 0, 0, 0, 0); // Black
        imageData.setPixel(0, 1, 255, 255, 255); // White

        const options: ImageImportOptions = {
          ...getDefaultImageImportOptions(),
          charWidth: 8,
          charHeight: 8,
          pixelWidth: 1,
          pixelHeight: 2, // Each logical pixel is 2 source pixels tall
          threshold: 129, // Average of 128 is below 129, so "on"
          forceColumns: 1,
          forceRows: 1,
        };

        const result = parseImageToCharacters(imageData, options);

        expect(result.characters.length).toBe(1);
        // First pixel should be on (average brightness 128 < 129)
        expect(result.characters[0].pixels[0][0]).toBe(true);
      });

      it("averages brightness across 2x2 pixel area", () => {
        // Create image where each logical pixel is 2x2 source pixels
        const imageData = new MockImageData(16, 16);
        imageData.fill(255, 255, 255);

        // For the first logical pixel (0,0), create a 2x2 area
        // 3 black pixels and 1 white pixel = average ~63.75
        imageData.setPixel(0, 0, 0, 0, 0); // Black
        imageData.setPixel(1, 0, 0, 0, 0); // Black
        imageData.setPixel(0, 1, 0, 0, 0); // Black
        imageData.setPixel(1, 1, 255, 255, 255); // White

        const options: ImageImportOptions = {
          ...getDefaultImageImportOptions(),
          charWidth: 8,
          charHeight: 8,
          pixelWidth: 2,
          pixelHeight: 2,
          threshold: 128, // Average of ~63.75 is below 128, so "on"
          forceColumns: 1,
          forceRows: 1,
        };

        const result = parseImageToCharacters(imageData, options);

        expect(result.characters.length).toBe(1);
        // First pixel should be on (average brightness ~63.75 < 128)
        expect(result.characters[0].pixels[0][0]).toBe(true);
      });

      it("correctly calculates grid dimensions with pixelWidth/Height > 1", () => {
        // Image is 32x32, with pixelWidth=2 and pixelHeight=2
        // Effective character cell size is 8*2=16 x 8*2=16
        // Should result in 2x2 = 4 characters
        const imageData = new MockImageData(32, 32);
        imageData.fill(255, 255, 255);

        const options: ImageImportOptions = {
          ...getDefaultImageImportOptions(),
          charWidth: 8,
          charHeight: 8,
          pixelWidth: 2,
          pixelHeight: 2,
        };

        const result = parseImageToCharacters(imageData, options);

        expect(result.columns).toBe(2);
        expect(result.rows).toBe(2);
        expect(result.characters.length).toBe(4);
      });

      it("handles scaled image with gap correctly", () => {
        // Image is 36x16, with pixelWidth=2, gap=4
        // Cell width = 8*2 + 4 = 20
        // Should have 1 column (36 / 20 = 1.8 -> 1)
        const imageData = new MockImageData(36, 16);
        imageData.fill(255, 255, 255);

        // Draw first character area (0-15) as black
        imageData.fillRect(0, 0, 16, 16, 0, 0, 0);

        const options: ImageImportOptions = {
          ...getDefaultImageImportOptions(),
          charWidth: 8,
          charHeight: 8,
          pixelWidth: 2,
          pixelHeight: 2,
          gapX: 4,
          gapY: 0,
          forceColumns: 1,
          forceRows: 1,
        };

        const result = parseImageToCharacters(imageData, options);

        expect(result.characters.length).toBe(1);
        // First character should be all on (black areas)
        expect(result.characters[0].pixels.every((row) => row.every((p) => p === true))).toBe(true);
      });

      it("threshold works correctly with averaged brightness", () => {
        // Create a 2x2 pixel area with 2 black (0) and 2 white (255)
        // Average = 127.5
        const imageData = new MockImageData(2, 2);
        imageData.setPixel(0, 0, 0, 0, 0); // Black
        imageData.setPixel(1, 0, 255, 255, 255); // White
        imageData.setPixel(0, 1, 255, 255, 255); // White
        imageData.setPixel(1, 1, 0, 0, 0); // Black

        const optionsLowThreshold: ImageImportOptions = {
          ...getDefaultImageImportOptions(),
          charWidth: 1,
          charHeight: 1,
          pixelWidth: 2,
          pixelHeight: 2,
          threshold: 100, // 127.5 > 100, so "off"
          forceColumns: 1,
          forceRows: 1,
        };

        const resultLow = parseImageToCharacters(imageData, optionsLowThreshold);
        expect(resultLow.characters[0].pixels[0][0]).toBe(false);

        const optionsHighThreshold: ImageImportOptions = {
          ...getDefaultImageImportOptions(),
          charWidth: 1,
          charHeight: 1,
          pixelWidth: 2,
          pixelHeight: 2,
          threshold: 150, // 127.5 < 150, so "on"
          forceColumns: 1,
          forceRows: 1,
        };

        const resultHigh = parseImageToCharacters(imageData, optionsHighThreshold);
        expect(resultHigh.characters[0].pixels[0][0]).toBe(true);
      });

      it("handles out of bounds pixels when averaging", () => {
        // Small image with pixelWidth=2, positioned to have some pixels out of bounds
        const imageData = new MockImageData(8, 8);
        imageData.fill(0, 0, 0); // All black

        const options: ImageImportOptions = {
          ...getDefaultImageImportOptions(),
          charWidth: 8,
          charHeight: 8,
          pixelWidth: 2,
          pixelHeight: 2,
          offsetX: 4, // Push half the character out of bounds
          forceColumns: 1,
          forceRows: 1,
        };

        const result = parseImageToCharacters(imageData, options);

        expect(result.characters.length).toBe(1);
        // Pixels within bounds should be on (black), those outside should be off (white)
        // First 2 logical pixels (x=0,1) are in bounds, last 6 (x=2-7) are partially/fully out of bounds
        expect(result.characters[0].pixels[0][0]).toBe(true); // In bounds
        expect(result.characters[0].pixels[0][1]).toBe(true); // In bounds
        // x=2 -> source x starts at 4+2*2=8, but source width is only 8
        // Out of bounds pixels are treated as white (255)
      });

      it("parses scaled image with default pixel dimensions of 1", () => {
        // Verify that default pixelWidth=1 and pixelHeight=1 works as before
        const imageData = new MockImageData(16, 16);
        imageData.fill(255, 255, 255);
        imageData.fillRect(0, 0, 8, 8, 0, 0, 0);

        const options = getDefaultImageImportOptions();
        const result = parseImageToCharacters(imageData, options);

        expect(result.characters.length).toBe(4);
        expect(result.columns).toBe(2);
        expect(result.rows).toBe(2);
        // First character should be all on (black)
        expect(result.characters[0].pixels.every((row) => row.every((p) => p === true))).toBe(true);
      });
    });
  });

  describe("createGridOverlayImage", () => {
    it("creates overlay with same dimensions as input", () => {
      const imageData = new MockImageData(64, 64);
      imageData.fill(100, 100, 100);

      const options = getDefaultImageImportOptions();
      const result = createGridOverlayImage(imageData, options);

      expect(result.width).toBe(64);
      expect(result.height).toBe(64);
      expect(result.data.length).toBe(imageData.data.length);
    });

    it("draws vertical grid lines at character boundaries", () => {
      const imageData = new MockImageData(24, 8);
      imageData.fill(100, 100, 100);

      const options: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        charWidth: 8,
      };

      const result = createGridOverlayImage(imageData, options);

      // Grid lines should be at x = 0, 8, 16
      // Check cyan color (0, 255, 255, 128)
      for (const x of [0, 8, 16]) {
        const index = (0 * result.width + x) * 4;
        expect(result.data[index]).toBe(0); // R
        expect(result.data[index + 1]).toBe(255); // G
        expect(result.data[index + 2]).toBe(255); // B
        expect(result.data[index + 3]).toBe(128); // A (semi-transparent)
      }
    });

    it("draws horizontal grid lines at character boundaries", () => {
      const imageData = new MockImageData(8, 24);
      imageData.fill(100, 100, 100);

      const options: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        charHeight: 8,
      };

      const result = createGridOverlayImage(imageData, options);

      // Grid lines should be at y = 0, 8, 16
      // Check cyan color at first column
      for (const y of [0, 8, 16]) {
        const index = (y * result.width + 0) * 4;
        expect(result.data[index]).toBe(0); // R
        expect(result.data[index + 1]).toBe(255); // G
        expect(result.data[index + 2]).toBe(255); // B
        expect(result.data[index + 3]).toBe(128); // A
      }
    });

    it("respects offset when drawing grid lines", () => {
      const imageData = new MockImageData(24, 24);
      imageData.fill(100, 100, 100);

      const options: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        charWidth: 8,
        charHeight: 8,
        offsetX: 4,
        offsetY: 4,
      };

      const result = createGridOverlayImage(imageData, options);

      // Vertical grid lines should start at x = 4, then 12, 20
      // Check that x = 4 has grid color
      const indexAt4 = (0 * result.width + 4) * 4;
      expect(result.data[indexAt4]).toBe(0);
      expect(result.data[indexAt4 + 1]).toBe(255);
      expect(result.data[indexAt4 + 2]).toBe(255);

      // Horizontal grid lines should start at y = 4
      const indexAtY4 = (4 * result.width + 0) * 4;
      expect(result.data[indexAtY4]).toBe(0);
      expect(result.data[indexAtY4 + 1]).toBe(255);
      expect(result.data[indexAtY4 + 2]).toBe(255);
    });

    it("preserves original pixel data between grid lines", () => {
      const imageData = new MockImageData(16, 16);
      // Fill with red
      imageData.fill(255, 0, 0);

      const options = getDefaultImageImportOptions();
      const result = createGridOverlayImage(imageData, options);

      // Check a pixel that's not on a grid line (e.g., x=3, y=3)
      const index = (3 * result.width + 3) * 4;
      expect(result.data[index]).toBe(255); // R (preserved)
      expect(result.data[index + 1]).toBe(0); // G (preserved)
      expect(result.data[index + 2]).toBe(0); // B (preserved)
    });

    it("does not modify the original ImageData", () => {
      const imageData = new MockImageData(16, 16);
      imageData.fill(100, 100, 100);

      const originalData = new Uint8ClampedArray(imageData.data);

      const options = getDefaultImageImportOptions();
      createGridOverlayImage(imageData, options);

      // Original should be unchanged
      expect(imageData.data).toEqual(originalData);
    });

    it("handles single character size image", () => {
      const imageData = new MockImageData(8, 8);
      imageData.fill(200, 200, 200);

      const options = getDefaultImageImportOptions();
      const result = createGridOverlayImage(imageData, options);

      // Should have grid lines at x=0 and y=0
      const topLeftIndex = 0;
      expect(result.data[topLeftIndex]).toBe(0);
      expect(result.data[topLeftIndex + 1]).toBe(255);
      expect(result.data[topLeftIndex + 2]).toBe(255);
    });

    it("uses semi-transparent cyan for grid lines", () => {
      const imageData = new MockImageData(16, 16);
      imageData.fill(0, 0, 0);

      const options = getDefaultImageImportOptions();
      const result = createGridOverlayImage(imageData, options);

      // Check grid line color
      const gridLineIndex = (0 * result.width + 0) * 4;
      expect(result.data[gridLineIndex]).toBe(0); // R = 0 (cyan)
      expect(result.data[gridLineIndex + 1]).toBe(255); // G = 255 (cyan)
      expect(result.data[gridLineIndex + 2]).toBe(255); // B = 255 (cyan)
      expect(result.data[gridLineIndex + 3]).toBe(128); // A = 128 (50% transparent)
    });
  });

  describe("integration scenarios", () => {
    it("parses a realistic character set image", () => {
      // Simulate a 16x8 character set (128 chars) in 16-column layout
      const imageData = new MockImageData(128, 64);
      imageData.fill(255, 255, 255);

      // Draw a simple pattern in the first character position
      const letterA: boolean[][] = [
        [false, false, true, true, true, false, false, false],
        [false, true, false, false, false, true, false, false],
        [true, false, false, false, false, false, true, false],
        [true, true, true, true, true, true, true, false],
        [true, false, false, false, false, false, true, false],
        [true, false, false, false, false, false, true, false],
        [true, false, false, false, false, false, true, false],
        [false, false, false, false, false, false, false, false],
      ];

      drawCharacterPattern(imageData, 0, 0, letterA);

      const options = getDefaultImageImportOptions();
      const result = parseImageToCharacters(imageData, options);

      expect(result.columns).toBe(16);
      expect(result.rows).toBe(8);
      expect(result.characters.length).toBe(128);

      // Verify first character matches the pattern
      const firstChar = result.characters[0];
      expect(firstChar.pixels.length).toBe(8);
      expect(firstChar.pixels[0].length).toBe(8);

      // Check specific pixels of the letter A pattern
      expect(firstChar.pixels[0][2]).toBe(true);
      expect(firstChar.pixels[0][0]).toBe(false);
    });

    it("handles combined offset and gap settings", () => {
      // Image with border and spacing between characters
      const imageData = new MockImageData(30, 30);
      imageData.fill(255, 255, 255);

      // Draw a black character at position (5,5) with size 8x8
      imageData.fillRect(5, 5, 8, 8, 0, 0, 0);

      // Draw another black character at position (16,5) (5 offset + 8 char + 3 gap)
      imageData.fillRect(16, 5, 8, 8, 0, 0, 0);

      const options: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        offsetX: 5,
        offsetY: 5,
        gapX: 3,
        gapY: 0,
        forceColumns: 2,
        forceRows: 1,
      };

      const result = parseImageToCharacters(imageData, options);

      expect(result.characters.length).toBe(2);

      // First character should be all black (on)
      expect(result.characters[0].pixels.every((row) => row.every((p) => p === true))).toBe(true);

      // Second character should also be all on (black)
      expect(result.characters[1].pixels.every((row) => row.every((p) => p === true))).toBe(true);
    });

    it("handles gray values with custom threshold", () => {
      const imageData = new MockImageData(16, 8);
      imageData.fill(255, 255, 255);

      // First character: light gray (200) - should be off with threshold 128
      imageData.fillRect(0, 0, 8, 8, 200, 200, 200);

      // Second character: dark gray (50) - should be on with threshold 128
      imageData.fillRect(8, 0, 8, 8, 50, 50, 50);

      const options: ImageImportOptions = {
        ...getDefaultImageImportOptions(),
        threshold: 128,
      };

      const result = parseImageToCharacters(imageData, options);

      expect(result.characters.length).toBe(2);

      // Light gray (200) is above threshold, so off
      expect(result.characters[0].pixels.every((row) => row.every((p) => p === false))).toBe(true);

      // Dark gray (50) is below threshold, so on
      expect(result.characters[1].pixels.every((row) => row.every((p) => p === true))).toBe(true);
    });
  });
});
