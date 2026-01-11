/**
 * Character ROM Editor - Compression Utilities Tests
 *
 * Tests for base64url encoding/decoding and DEFLATE compression.
 */

import {
  base64urlEncode,
  base64urlDecode,
  compressData,
  decompressData,
} from "../compression";

// ============================================================================
// base64url Encoding Tests
// ============================================================================

describe("base64urlEncode", () => {
  it("encodes empty data", () => {
    const data = new Uint8Array(0);
    const encoded = base64urlEncode(data);
    expect(encoded).toBe("");
  });

  it("encodes a single byte", () => {
    const data = new Uint8Array([65]); // 'A'
    const encoded = base64urlEncode(data);
    expect(encoded).toBe("QQ"); // Standard base64 would be "QQ=="
  });

  it("produces URL-safe output (no +, /, or =)", () => {
    // Use bytes that would produce + and / in standard base64
    const data = new Uint8Array([251, 255, 254]); // Would be "+//+" in standard base64
    const encoded = base64urlEncode(data);

    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });

  it("replaces + with - and / with _", () => {
    // 0xfb = 251 produces "+" in base64
    // 0xff = 255 produces "/" in base64
    const data = new Uint8Array([251, 255]);
    const encoded = base64urlEncode(data);

    expect(encoded).toContain("-");
    expect(encoded).toContain("_");
  });

  it("handles all byte values (0-255)", () => {
    const data = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      data[i] = i;
    }
    const encoded = base64urlEncode(data);

    expect(encoded.length).toBeGreaterThan(0);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });
});

describe("base64urlDecode", () => {
  it("decodes empty string", () => {
    const decoded = base64urlDecode("");
    expect(decoded).toEqual(new Uint8Array(0));
  });

  it("decodes a single byte", () => {
    const decoded = base64urlDecode("QQ");
    expect(decoded).toEqual(new Uint8Array([65]));
  });

  it("decodes strings with - and _", () => {
    const original = new Uint8Array([251, 255, 254]);
    const encoded = base64urlEncode(original);
    const decoded = base64urlDecode(encoded);

    expect(decoded).toEqual(original);
  });

  it("handles various lengths (padding edge cases)", () => {
    // Test different lengths to cover all padding cases
    for (let len = 0; len <= 10; len++) {
      const original = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        original[i] = i * 17;
      }
      const encoded = base64urlEncode(original);
      const decoded = base64urlDecode(encoded);

      expect(decoded).toEqual(original);
    }
  });
});

describe("base64url round-trip", () => {
  it("round-trips empty data", () => {
    const original = new Uint8Array(0);
    const roundTripped = base64urlDecode(base64urlEncode(original));
    expect(roundTripped).toEqual(original);
  });

  it("round-trips random binary data", () => {
    const original = new Uint8Array([
      0, 1, 2, 127, 128, 254, 255, 42, 100, 200,
    ]);
    const roundTripped = base64urlDecode(base64urlEncode(original));
    expect(roundTripped).toEqual(original);
  });

  it("round-trips all byte values", () => {
    const original = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      original[i] = i;
    }
    const roundTripped = base64urlDecode(base64urlEncode(original));
    expect(roundTripped).toEqual(original);
  });

  it("round-trips large data", () => {
    const original = new Uint8Array(10000);
    for (let i = 0; i < original.length; i++) {
      original[i] = i % 256;
    }
    const roundTripped = base64urlDecode(base64urlEncode(original));
    expect(roundTripped).toEqual(original);
  });
});

// ============================================================================
// Compression Tests
// ============================================================================

describe("compressData", () => {
  it("compresses empty data", () => {
    const data = new Uint8Array(0);
    const compressed = compressData(data);
    expect(compressed).toBeInstanceOf(Uint8Array);
  });

  it("compresses single byte", () => {
    const data = new Uint8Array([42]);
    const compressed = compressData(data);
    expect(compressed).toBeInstanceOf(Uint8Array);
    expect(compressed.length).toBeGreaterThan(0);
  });

  it("achieves compression on repeated data", () => {
    // 1000 zeros should compress well
    const data = new Uint8Array(1000);
    const compressed = compressData(data);

    expect(compressed.length).toBeLessThan(data.length);
  });

  it("achieves compression on pattern data", () => {
    // Checkerboard pattern should compress somewhat
    const data = new Uint8Array(1000);
    for (let i = 0; i < data.length; i++) {
      data[i] = i % 2 === 0 ? 0 : 255;
    }
    const compressed = compressData(data);

    expect(compressed.length).toBeLessThan(data.length);
  });
});

describe("decompressData", () => {
  it("decompresses empty compressed data", () => {
    const original = new Uint8Array(0);
    const compressed = compressData(original);
    const decompressed = decompressData(compressed);

    expect(decompressed).toEqual(original);
  });

  it("decompresses single byte data", () => {
    const original = new Uint8Array([42]);
    const compressed = compressData(original);
    const decompressed = decompressData(compressed);

    expect(decompressed).toEqual(original);
  });
});

describe("compression round-trip", () => {
  it("round-trips empty data", () => {
    const original = new Uint8Array(0);
    const roundTripped = decompressData(compressData(original));
    expect(roundTripped).toEqual(original);
  });

  it("round-trips sparse data (many zeros)", () => {
    const original = new Uint8Array(1000);
    // Sparse: mostly zeros with some data
    original[0] = 255;
    original[500] = 128;
    original[999] = 64;

    const roundTripped = decompressData(compressData(original));
    expect(roundTripped).toEqual(original);
  });

  it("round-trips pattern data (checkerboard)", () => {
    const original = new Uint8Array(100);
    for (let i = 0; i < original.length; i++) {
      original[i] = i % 2 === 0 ? 0xAA : 0x55;
    }

    const roundTripped = decompressData(compressData(original));
    expect(roundTripped).toEqual(original);
  });

  it("round-trips random-like data", () => {
    const original = new Uint8Array(100);
    for (let i = 0; i < original.length; i++) {
      original[i] = (i * 17 + 31) % 256;
    }

    const roundTripped = decompressData(compressData(original));
    expect(roundTripped).toEqual(original);
  });

  it("round-trips large data", () => {
    const original = new Uint8Array(10000);
    for (let i = 0; i < original.length; i++) {
      original[i] = i % 256;
    }

    const roundTripped = decompressData(compressData(original));
    expect(roundTripped).toEqual(original);
  });

  it("round-trips binary character data simulation", () => {
    // Simulate 256 characters at 8x8 = 256 bytes
    const original = new Uint8Array(256);
    // Mix of empty chars (0x00) and patterned chars
    for (let i = 0; i < 128; i++) {
      original[i] = 0; // First half empty
    }
    for (let i = 128; i < 256; i++) {
      original[i] = (i * 7) % 256; // Second half with patterns
    }

    const roundTripped = decompressData(compressData(original));
    expect(roundTripped).toEqual(original);
  });
});

// ============================================================================
// Combined base64url + compression round-trip
// ============================================================================

describe("full encode/decode pipeline", () => {
  it("round-trips through compress -> base64url -> decode -> decompress", () => {
    const original = new Uint8Array([1, 2, 3, 4, 5, 100, 200, 255]);

    const compressed = compressData(original);
    const encoded = base64urlEncode(compressed);
    const decoded = base64urlDecode(encoded);
    const decompressed = decompressData(decoded);

    expect(decompressed).toEqual(original);
  });

  it("produces URL-safe output for compressed data", () => {
    const original = new Uint8Array(1000);
    for (let i = 0; i < original.length; i++) {
      original[i] = i % 256;
    }

    const compressed = compressData(original);
    const encoded = base64urlEncode(compressed);

    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });

  it("achieves significant compression for typical character ROM data", () => {
    // 256 chars * 8 bytes per char = 2048 bytes (8x8 characters)
    const original = new Uint8Array(2048);
    // Simulate mostly empty with some filled characters
    for (let i = 0; i < 2048; i++) {
      original[i] = i < 512 ? 0 : (i % 256); // 75% sparse
    }

    const compressed = compressData(original);
    const encoded = base64urlEncode(compressed);

    // Should be significantly smaller than uncompressed base64
    const uncompressedBase64Length = Math.ceil(original.length * 4 / 3);
    expect(encoded.length).toBeLessThan(uncompressedBase64Length * 0.5);
  });
});
