/**
 * Systems Data - Internal Raw Data
 *
 * WARNING: This file should ONLY be imported by systems.ts
 * All consumers should import from systems.ts instead.
 *
 * This file contains the unified data structure for:
 * - Computer manufacturers and their systems
 * - IC/chip manufacturers and their character generator chips
 *
 * Cross-references use the pattern:
 * - Each item has an `id` field for its own identifier
 * - References to other items use `id` in the nested object (e.g., `characterRom: { id: "chip-id" }`)
 *
 * @internal
 */

import type { PaddingDirection, ByteOrder } from "../types";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Bit order within each byte
 * - "msb": Most Significant Bit first (leftmost pixel = bit 7) - most common
 * - "lsb": Least Significant Bit first (leftmost pixel = bit 0) - Teletext, etc.
 */
export type BitOrder = "msb" | "lsb";

/**
 * Binary format configuration for character ROM data
 */
export interface BinaryFormat {
  /** Where unused bits go: "left" or "right" */
  padding: PaddingDirection;
  /** Bit ordering within bytes: "msb" or "lsb" */
  bitOrder: BitOrder;
  /** Byte order for multi-byte rows (width > 8): "big" or "little". Defaults to "big". */
  byteOrder?: ByteOrder;
}

// ============================================================================
// Manufacturer Types
// ============================================================================

/**
 * Base manufacturer information shared by computer and chip manufacturers
 */
export interface ManufacturerInfo {
  /** Unique identifier (lowercase, hyphenated) */
  id: string;
  /** Full company name */
  name: string;
  /** Country of origin */
  country: string;
  /** Year the company was founded */
  founded?: number;
  /** Founder(s) of the company */
  founders?: string[];
  /** Company headquarters location */
  headquarters?: string;
  /** Additional notes about the company */
  notes?: string;
  /** Fun historical facts about the company */
  funFacts?: string[];
}

/**
 * Computer manufacturer with their systems
 */
export interface ComputerManufacturer extends ManufacturerInfo {
  /** Main product lines */
  productLines?: string[];
  /** Computer systems from this manufacturer */
  systems: SystemInfo[];
}

/**
 * Chip/IC manufacturer with their character generator products
 */
export interface ChipManufacturer extends ManufacturerInfo {
  /** Character generator chips from this manufacturer */
  chips: ChipInfo[];
}

// ============================================================================
// System Types
// ============================================================================

/**
 * CPU specifications
 */
export interface CpuSpec {
  /** CPU chip name (e.g., "Zilog Z80A", "MOS 6502") */
  chip: string;
  /** Clock speed in MHz */
  speed: number;
  /** Effective speed if different from clock (due to contention, etc.) */
  effectiveSpeed?: number;
  /** CPU bit width (8 or 16) */
  bits?: number;
  /** Notes about the CPU */
  notes?: string;
}

/**
 * Memory specifications
 */
export interface MemorySpec {
  /** ROM size in KB */
  romKb?: number;
  /** ROM contents description */
  romContents?: string;
  /** RAM size in KB */
  ramKb?: number;
  /** RAM type (static, dynamic) */
  ramType?: string;
  /** Maximum expandable RAM in KB */
  expandableKb?: number;
  /** Whether RAM is bank-switched */
  bankSwitched?: boolean;
  /** Video RAM size in KB (if separate) */
  vramKb?: number;
}

/**
 * Text mode specification
 */
export interface TextModeSpec {
  /** Mode identifier (e.g., "mode0", "screen1") */
  id?: string;
  /** Number of columns */
  columns: number;
  /** Number of rows */
  rows: number;
  /** Number of colors available */
  colors?: number;
  /** Mode type (e.g., "teletext") */
  type?: string;
  /** Additional notes */
  notes?: string;
}

/**
 * Graphics mode specification
 */
export interface GraphicsModeSpec {
  /** Mode identifier */
  id?: string;
  /** Horizontal resolution in pixels */
  width: number;
  /** Vertical resolution in pixels */
  height: number;
  /** Number of colors */
  colors: number;
  /** Additional notes */
  notes?: string;
}

/**
 * Sprite capabilities
 */
export interface SpriteSpec {
  /** Number of hardware sprites */
  count: number;
  /** Available sprite sizes (e.g., ["8x8", "16x16"]) */
  sizes?: string[];
  /** Maximum sprites per scanline */
  maxPerLine?: number;
  /** Available sprite modes */
  modes?: string[];
  /** Additional notes */
  notes?: string;
}

/**
 * Display/video specifications
 */
export interface DisplaySpec {
  /** Output type (e.g., "rf_modulator", "composite", "rgb") */
  type?: string;
  /** Available text modes */
  textModes?: TextModeSpec[];
  /** Available graphics modes */
  graphicsModes?: GraphicsModeSpec[];
  /** Total colors in palette */
  paletteColors?: number;
  /** Simultaneous colors on screen */
  simultaneousColors?: number;
  /** Sprite capabilities */
  sprites?: SpriteSpec;
  /** Additional notes about display system */
  notes?: string;
}

/**
 * Character cell and glyph dimensions
 */
export interface CharacterDimensions {
  /** Cell dimensions (including spacing) */
  cell?: { width: number; height: number };
  /** Glyph dimensions (actual drawn pixels) */
  glyph: { width: number; height: number };
  /** Notes about character dimensions */
  notes?: string;
}

/**
 * Character set information
 */
export interface CharacterSetSpec {
  /** Number of glyphs in the set */
  glyphs: number;
  /** Number of character sets available */
  sets?: number;
  /** Whether uppercase is supported */
  uppercase?: boolean;
  /** Whether lowercase is supported */
  lowercase?: boolean;
  /** Whether inverse video is available */
  inverseVideo?: boolean;
  /** Total displayable characters (including inverse, etc.) */
  totalDisplayable?: number;
  /** Character encoding (e.g., "ASCII", "PETSCII") */
  encoding?: string;
  /** Whether user-defined graphics are supported */
  udg?: boolean;
  /** Method for UDG */
  udgMethod?: string;
  /** Regional/language variants available */
  variants?: string[];
  /** Additional notes */
  notes?: string;
}

/**
 * Character generator/ROM location info
 */
export interface CharacterGeneratorSpec {
  /** Location type (e.g., "system_rom", "dedicated_chip", "vram") */
  location: string;
  /** Memory address (hex) */
  address?: string;
  /** Size in bytes */
  sizeBytes?: number;
  /** Whether customizable via RAM */
  customizable?: boolean;
  /** Method for customization */
  customMethod?: string;
  /** Rendering method (e.g., "hardware", "software_to_bitmap") */
  rendering?: string;
  /** Additional notes */
  notes?: string;
}

/**
 * Video hardware specifications
 */
export interface VideoHardwareSpec {
  /** Main video chip(s) */
  chips?: string[];
  /** CRTC chip (if separate) */
  crtc?: string;
  /** VDP/VDG chip */
  vdp?: string;
  /** ULA chip */
  ula?: string;
  /** Additional notes */
  notes?: string;
}

/**
 * Price/MSRP information
 */
export interface PriceSpec {
  /** Base price */
  price?: number;
  /** Kit price (if available) */
  kit?: number;
  /** Assembled price (if different from kit) */
  assembled?: number;
  /** Currency code (e.g., "USD", "GBP") */
  currency: string;
  /** Price variants (e.g., different RAM configs) */
  variants?: Record<string, number>;
}

/**
 * Character ROM specifications for a system - direct definition.
 * Uses glyph dimensions (actual drawn pixels), not cell dimensions.
 */
export interface CharacterRomDirect {
  /** Character width in pixels (glyph size) */
  width: number;
  /** Character height in pixels (glyph size) */
  height: number;
  /** Default number of characters in the ROM (per bank if multi-bank) */
  characterCount: number;
}

/**
 * Character ROM specification by reference to a chip.
 * Dimensions are inherited from the referenced chip.
 */
export interface CharacterRomReference {
  /** Reference to a single chip ID */
  id?: string;
  /** Reference to multiple chip IDs (for systems with multiple character generators) */
  ids?: string[];
}

/**
 * Character ROM specification - either direct values or reference to chip.
 * When using a reference (id/ids), dimensions are inherited from the chip.
 * When specifying width/height/characterCount directly, no chip reference needed.
 */
export type CharacterRomSpec = CharacterRomDirect | CharacterRomReference;

/**
 * Complete system information including optional hardware specifications.
 */
export interface SystemInfo {
  /** Unique identifier (lowercase, hyphenated) */
  id: string;
  /** System name (e.g., "C64", "ZX Spectrum") */
  name: string;
  /** Alternate names for this system */
  alternateNames?: string[];
  /** Year the system was released */
  year?: number;
  /** Year production ended */
  endYear?: number;
  /** Original retail price */
  msrp?: PriceSpec;
  /** Units sold (if known) */
  unitsSold?: string;
  /** Form factor (e.g., "desktop", "portable", "console") */
  formFactor?: string;
  /** CPU specifications */
  cpu?: CpuSpec;
  /** Memory specifications */
  memory?: MemorySpec;
  /** Display/video capabilities */
  display?: DisplaySpec;
  /** Character dimensions (cell and glyph) */
  characterDimensions?: CharacterDimensions;
  /** Character set information */
  characterSets?: CharacterSetSpec;
  /** Character generator/ROM information */
  characterGenerator?: CharacterGeneratorSpec;
  /** Video hardware details */
  videoHardware?: VideoHardwareSpec;
  /**
   * Character ROM specification.
   * Can be either:
   * - Direct: { width, height, characterCount } for systems without a specific chip
   * - Reference: { id: "chip-id" } to inherit from a chip
   * - Multi-reference: { ids: ["chip1", "chip2"] } for systems with multiple chips
   */
  characterRom?: CharacterRomSpec;
  /** Binary format for export (optional - inherits from chip if not specified) */
  binaryFormat?: BinaryFormat;
  /** Storage type (e.g., "cassette", "floppy") */
  storage?: string;
  /** Notes about this system's character ROM implementation */
  notes?: string;
  /** Fun historical facts about the system */
  funFacts?: string[];
}

// ============================================================================
// Chip Types
// ============================================================================

/**
 * Character generator chip/IC specifications
 */
export interface ChipInfo {
  /** Unique identifier */
  id: string;
  /** Part number (e.g., "2513", "901225-01") */
  partNumber: string;
  /** ROM type (e.g., "Mask ROM", "EPROM", "VDG", "VDP") */
  type: string;
  /** Year the chip was introduced */
  year?: number;
  /** Chip capacity */
  capacity?: {
    bits?: number;
    bytes?: number;
    kb?: number;
  };
  /** Memory organization format (e.g., "64x8x5", "4Kx8") */
  organization?: string;
  /** Glyph dimensions */
  glyph: {
    width: number;
    height: number;
  };
  /** Number of glyphs stored */
  glyphCount: number;
  /** Number of character sets stored */
  characterSetsStored?: number;
  /** Output format (e.g., "5-bit parallel", "8-bit parallel") */
  output?: string;
  /** Whether the chip has internal font ROM */
  internalFont?: boolean;
  /** Binary format configuration (defines default for systems using this chip) */
  binaryFormat?: BinaryFormat;
  /** Systems that use this chip (for reference/documentation) */
  usedIn?: string[];
  /** Known variants of this chip */
  variants?: Record<string, string>;
  /** Successor chips */
  successors?: string[];
  /** Additional notes about this chip */
  notes?: string;
  /** Fun historical facts about the chip */
  funFacts?: string[];
}

// ============================================================================
// Unified Data Structure
// ============================================================================

/**
 * The unified systems data structure
 */
export interface SystemsData {
  /** Computer manufacturers with their systems */
  computerManufacturers: ComputerManufacturer[];
  /** IC/chip manufacturers with their character generator chips */
  chipManufacturers: ChipManufacturer[];
}

// ============================================================================
// The Data
// ============================================================================

export const DATA: SystemsData = {
  // ==========================================================================
  // Computer Manufacturers
  // ==========================================================================
  computerManufacturers: [
    // ========================================================================
    // Acorn
    // ========================================================================
    {
      id: "acorn",
      name: "Acorn Computers Ltd",
      country: "UK",
      founded: 1978,
      founders: ["Hermann Hauser", "Chris Curry"],
      headquarters: "Cambridge, England",
      productLines: ["Atom", "BBC Micro", "Electron", "Archimedes"],
      notes: "Later became ARM Holdings",
      funFacts: [
        "Acorn's ARM processor, developed for the Archimedes in 1985, now powers billions of devices including most smartphones",
        "Won the BBC Computer Literacy Project contract in 1981, beating Sinclair, which led to the iconic BBC Micro",
        "The company name 'Acorn' was chosen to appear before 'Apple' in phone directories",
      ],
      systems: [
        {
          id: "acorn-atom",
          name: "Acorn Atom",
          year: 1980,
          characterRom: { id: "mc6847" },
          cpu: { chip: "MOS 6502", speed: 1 },
          memory: { ramKb: 2, romKb: 8, expandableKb: 12 },
          characterDimensions: { glyph: { width: 5, height: 7 } },
          characterSets: {
            glyphs: 64,
            uppercase: true,
            lowercase: false,
            encoding: "ASCII subset",
          },
          videoHardware: { vdp: "MC6847" },
          display: {
            textModes: [{ columns: 32, rows: 16 }],
            graphicsModes: [{ width: 256, height: 192, colors: 4 }],
          },
          notes: "Used Motorola MC6847 VDG.",
          funFacts: [
            "The Atom was the predecessor to the BBC Micro",
            "It was available both as a kit and as a pre-assembled unit",
          ],
        },
        {
          id: "bbc-micro-b",
          name: "BBC Micro Model B",
          year: 1981,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { id: "saa5050" },
          cpu: { chip: "MOS 6502A", speed: 2 },
          memory: { ramKb: 32, romKb: 32 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 256,
            uppercase: true,
            lowercase: true,
            encoding: "ASCII",
          },
          characterGenerator: {
            location: "dedicated_rom",
            address: "$C000",
            customizable: true,
            customMethod: "VDU 23",
          },
          videoHardware: { crtc: "6845", chips: ["SAA5050"] },
          display: {
            textModes: [
              { id: "mode0", columns: 80, rows: 32, colors: 2 },
              { id: "mode3", columns: 80, rows: 25, colors: 2 },
              { id: "mode7", columns: 40, rows: 25, type: "teletext" },
            ],
            graphicsModes: [
              { id: "mode0", width: 640, height: 256, colors: 2 },
              { id: "mode2", width: 160, height: 256, colors: 8 },
            ],
          },
          notes:
            "Standard text modes use 8x8 OS ROM font. Mode 7 uses SAA5050 Teletext chip.",
          funFacts: [
            "The BBC Micro was named after the BBC's Computer Literacy Project",
            "It was widely used in British schools throughout the 1980s",
          ],
        },
        {
          id: "bbc-master-128",
          name: "BBC Master 128",
          year: 1986,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { id: "saa5050" },
          cpu: { chip: "MOS 65SC12", speed: 2 },
          memory: { ramKb: 128, romKb: 128 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 256,
            uppercase: true,
            lowercase: true,
            encoding: "ASCII",
          },
          characterGenerator: {
            location: "dedicated_rom",
            customizable: true,
            customMethod: "VDU 23",
          },
          videoHardware: { crtc: "6845", chips: ["SAA5050"] },
          display: {
            textModes: [
              { id: "mode0", columns: 80, rows: 32, colors: 2 },
              { id: "mode7", columns: 40, rows: 25, type: "teletext" },
            ],
          },
          notes: "Enhanced BBC Micro with more RAM and ROM.",
          funFacts: [
            "The Master 128 was backwards compatible with most BBC Micro software",
          ],
        },
        {
          id: "acorn-electron",
          name: "Electron",
          year: 1983,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 8, height: 8, characterCount: 256 },
          cpu: { chip: "MOS 6502A", speed: 2, effectiveSpeed: 1 },
          memory: { ramKb: 32, romKb: 32 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 256,
            uppercase: true,
            lowercase: true,
            encoding: "ASCII",
          },
          characterGenerator: {
            location: "system_rom",
            customizable: true,
            customMethod: "VDU 23",
          },
          videoHardware: { ula: "Ferranti ULA" },
          display: {
            textModes: [
              { id: "mode0", columns: 80, rows: 32, colors: 2 },
              { id: "mode6", columns: 40, rows: 25, colors: 2 },
            ],
            graphicsModes: [
              { id: "mode0", width: 640, height: 256, colors: 2 },
              { id: "mode2", width: 160, height: 256, colors: 8 },
            ],
          },
          notes: "Budget version of the BBC Micro. No Mode 7 (SAA5050) support.",
          funFacts: [
            "The Electron was designed as a low-cost alternative to the BBC Micro",
            "Production delays caused it to miss the crucial Christmas 1983 market",
          ],
        },
      ],
    },

    // ========================================================================
    // Amstrad
    // ========================================================================
    {
      id: "amstrad",
      name: "Amstrad plc",
      country: "UK",
      founded: 1968,
      founders: ["Alan Sugar"],
      headquarters: "Brentwood, Essex",
      productLines: ["CPC series", "PCW", "PC compatibles"],
      funFacts: [
        "The name 'Amstrad' is a portmanteau of 'Alan Michael Sugar Trading'",
        "Acquired Sinclair Research in 1986 for £5 million, continuing the ZX Spectrum line",
        "The CPC was designed to be an all-in-one system with built-in monitor to avoid TV tuner compatibility issues",
      ],
      systems: [
        {
          id: "amstrad-cpc-464",
          name: "CPC 464",
          year: 1984,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 8, height: 8, characterCount: 256 },
          cpu: { chip: "Zilog Z80A", speed: 4 },
          memory: { ramKb: 64, romKb: 32 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 256,
            uppercase: true,
            lowercase: true,
            inverseVideo: false,
            encoding: "ASCII",
            udg: true,
            udgMethod: "SYMBOL AFTER command",
          },
          characterGenerator: {
            location: "system_rom",
            customizable: true,
            customMethod: "SYMBOL AFTER",
            rendering: "software_to_bitmap",
          },
          videoHardware: { crtc: "6845", ula: "Amstrad Gate Array" },
          display: {
            textModes: [
              { id: "mode0", columns: 20, rows: 25, colors: 16 },
              { id: "mode1", columns: 40, rows: 25, colors: 4 },
              { id: "mode2", columns: 80, rows: 25, colors: 2 },
            ],
            graphicsModes: [
              { id: "mode0", width: 160, height: 200, colors: 16 },
              { id: "mode1", width: 320, height: 200, colors: 4 },
              { id: "mode2", width: 640, height: 200, colors: 2 },
            ],
            paletteColors: 27,
          },
          notes:
            "Text modes use software rendering to bitmap. 8x8 font in ROM at $3800.",
          funFacts: [
            "The CPC 464 included a built-in cassette deck, making it a complete computing solution",
            "It was the best-selling computer in Britain in 1985",
          ],
        },
        {
          id: "amstrad-cpc-664",
          name: "CPC 664",
          year: 1985,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 8, height: 8, characterCount: 256 },
          cpu: { chip: "Zilog Z80A", speed: 4 },
          memory: { ramKb: 64, romKb: 32 },
          notes: "CPC 464 with built-in 3-inch floppy drive.",
        },
        {
          id: "amstrad-cpc-6128",
          name: "CPC 6128",
          year: 1985,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 8, height: 8, characterCount: 256 },
          cpu: { chip: "Zilog Z80A", speed: 4 },
          memory: { ramKb: 128, romKb: 48 },
          notes: "Enhanced CPC with 128KB RAM and CP/M compatibility.",
        },
      ],
    },

    // ========================================================================
    // Apple
    // ========================================================================
    {
      id: "apple",
      name: "Apple Computer Inc",
      country: "USA",
      founded: 1976,
      founders: ["Steve Jobs", "Steve Wozniak", "Ronald Wayne"],
      headquarters: "Cupertino, California",
      productLines: ["Apple I", "Apple II series", "Apple III", "Macintosh"],
      funFacts: [
        "The Apple II was one of the first mass-produced personal computers with color graphics",
        "Ronald Wayne sold his 10% stake in Apple for $800 in 1976; it would be worth over $300 billion today",
        "Steve Wozniak hand-built every Apple I circuit board, producing about 200 units",
      ],
      systems: [
        {
          id: "apple-i",
          name: "Apple I",
          alternateNames: ["Apple-1", "Apple Computer 1"],
          year: 1976,
          characterRom: { id: "signetics-2513" },
          cpu: { chip: "MOS 6502", speed: 1 },
          memory: { ramKb: 4, romKb: 0.25, expandableKb: 8 },
          characterDimensions: {
            cell: { width: 7, height: 8 },
            glyph: { width: 5, height: 7 },
          },
          characterSets: {
            glyphs: 64,
            uppercase: true,
            lowercase: false,
            encoding: "ASCII subset",
          },
          characterGenerator: {
            location: "dedicated_chip",
            customizable: false,
          },
          display: {
            textModes: [{ columns: 40, rows: 24 }],
          },
          notes:
            "First Apple computer, sold as a kit. Used Signetics 2513 for character generation with TV output.",
          funFacts: [
            "Only about 200 Apple I units were ever built, hand-assembled by Steve Wozniak",
            "Original price was $666.66 because Wozniak liked repeating digits",
            "Working Apple I computers have sold at auction for over $900,000",
            "The Apple I was the first computer to come with a video terminal as standard",
          ],
        },
        {
          id: "apple-ii",
          name: "Apple II",
          year: 1977,
          characterRom: { id: "signetics-2513" },
          cpu: { chip: "MOS 6502", speed: 1.023 },
          memory: { ramKb: 4, romKb: 12, expandableKb: 48 },
          characterDimensions: {
            cell: { width: 7, height: 8 },
            glyph: { width: 5, height: 7 },
          },
          characterSets: {
            glyphs: 64,
            uppercase: true,
            lowercase: false,
            inverseVideo: true,
            encoding: "ASCII subset",
          },
          characterGenerator: {
            location: "dedicated_chip",
            customizable: false,
          },
          display: {
            textModes: [{ columns: 40, rows: 24 }],
            graphicsModes: [
              { width: 280, height: 192, colors: 6, notes: "Hi-Res" },
              { width: 40, height: 48, colors: 16, notes: "Lo-Res" },
            ],
          },
          notes:
            "Original Apple II with Signetics 2513 character generator. Uppercase only.",
          funFacts: [
            "Steve Wozniak designed the Apple II to be easily expandable with 8 expansion slots",
            "It was the first personal computer to display color graphics",
          ],
        },
        {
          id: "apple-ii-plus",
          name: "Apple II Plus",
          year: 1979,
          characterRom: { id: "signetics-2513" },
          cpu: { chip: "MOS 6502", speed: 1.023 },
          memory: { ramKb: 48, romKb: 12 },
          characterDimensions: {
            cell: { width: 7, height: 8 },
            glyph: { width: 5, height: 7 },
          },
          notes: "Apple II with Applesoft BASIC in ROM. Still uppercase only.",
        },
        {
          id: "apple-iie",
          name: "Apple IIe",
          year: 1983,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 7, height: 8, characterCount: 256 },
          cpu: { chip: "MOS 6502", speed: 1.023 },
          memory: { ramKb: 64, romKb: 16, expandableKb: 128 },
          characterDimensions: {
            cell: { width: 7, height: 8 },
            glyph: { width: 7, height: 8 },
          },
          characterSets: {
            glyphs: 256,
            uppercase: true,
            lowercase: true,
            encoding: "ASCII",
          },
          notes: "Enhanced Apple II with lowercase and 80-column support.",
          funFacts: [
            "The IIe was the longest-lived Apple II, produced for over 10 years",
          ],
        },
        {
          id: "apple-iic",
          name: "Apple IIc",
          year: 1984,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 7, height: 8, characterCount: 256 },
          cpu: { chip: "MOS 65C02", speed: 1.023 },
          memory: { ramKb: 128, romKb: 16 },
          notes: "Portable Apple IIe. Built-in 5.25-inch floppy drive.",
          funFacts: [
            "The IIc was Apple's first attempt at a portable computer",
          ],
        },
        {
          id: "apple-iigs",
          name: "Apple IIGS",
          year: 1986,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 8, height: 8, characterCount: 256 },
          cpu: { chip: "WDC 65C816", speed: 2.8 },
          memory: { ramKb: 256, romKb: 128, expandableKb: 8192 },
          notes: "16-bit Apple II with enhanced graphics and sound.",
          funFacts: [
            "The GS stood for 'Graphics and Sound'",
            "Steve Wozniak personally worked on its design",
          ],
        },
      ],
    },

    // ========================================================================
    // Atari
    // ========================================================================
    {
      id: "atari",
      name: "Atari Inc / Atari Corporation",
      country: "USA",
      founded: 1972,
      founders: ["Nolan Bushnell", "Ted Dabney"],
      headquarters: "Sunnyvale, California",
      productLines: ["400/800", "XL series", "XE series", "ST"],
      funFacts: [
        "The name 'Atari' comes from a Japanese Go term meaning 'you are about to be engulfed'",
        "Steve Jobs worked at Atari before co-founding Apple, working on the game Breakout",
        "The Atari 2600 sold over 30 million units and popularized home video gaming",
      ],
      systems: [
        {
          id: "atari-400",
          name: "Atari 400",
          year: 1979,
          characterRom: { id: "atari-os-rom" },
          cpu: { chip: "MOS 6502B", speed: 1.79 },
          memory: { ramKb: 8, romKb: 10 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 128,
            uppercase: true,
            lowercase: true,
            inverseVideo: true,
            totalDisplayable: 256,
            encoding: "ATASCII",
          },
          characterGenerator: {
            location: "system_rom",
            address: "$E000",
            customizable: true,
            customMethod: "CHBAS pointer",
          },
          display: {
            textModes: [
              { id: "gr.0", columns: 40, rows: 24 },
              { id: "gr.1", columns: 20, rows: 24 },
              { id: "gr.2", columns: 20, rows: 12 },
            ],
            graphicsModes: [{ id: "gr.8", width: 320, height: 192, colors: 2 }],
          },
          notes:
            "Entry-level model with membrane keyboard. Same ANTIC/GTIA as 800.",
          funFacts: [
            "The 400 had a membrane keyboard to prevent young children from damaging it",
          ],
        },
        {
          id: "atari-800",
          name: "Atari 800",
          year: 1979,
          characterRom: { id: "atari-os-rom" },
          cpu: { chip: "MOS 6502B", speed: 1.79 },
          memory: { ramKb: 48, romKb: 10, expandableKb: 48 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 128,
            uppercase: true,
            lowercase: true,
            inverseVideo: true,
            totalDisplayable: 256,
            encoding: "ATASCII",
          },
          characterGenerator: {
            location: "system_rom",
            address: "$E000",
            customizable: true,
            customMethod: "CHBAS pointer",
          },
          notes: "Full keyboard version of the 400.",
          funFacts: [
            "The Atari 800 featured an aluminum RF shield, making it FCC compliant",
          ],
        },
        {
          id: "atari-800xl",
          name: "Atari 800XL",
          year: 1983,
          characterRom: { id: "atari-os-rom" },
          cpu: { chip: "MOS 6502C", speed: 1.79 },
          memory: { ramKb: 64, romKb: 24 },
          notes: "Cost-reduced 800 with PBI expansion bus.",
          funFacts: [
            "The XL series introduced the Parallel Bus Interface for expansion",
          ],
        },
        {
          id: "atari-65xe",
          name: "Atari 65XE",
          year: 1985,
          characterRom: { id: "atari-os-rom" },
          cpu: { chip: "MOS 6502C", speed: 1.79 },
          memory: { ramKb: 64, romKb: 24 },
          notes: "Redesigned XL with 65KB RAM.",
        },
        {
          id: "atari-130xe",
          name: "Atari 130XE",
          year: 1985,
          characterRom: { id: "atari-os-rom" },
          cpu: { chip: "MOS 6502C", speed: 1.79 },
          memory: { ramKb: 128, romKb: 24, bankSwitched: true },
          notes: "XE with 128KB bank-switched RAM.",
          funFacts: [
            "The extra 64KB of RAM was bank-switched and primarily used for RAM disk or data storage",
          ],
        },
        {
          id: "atari-xegs",
          name: "Atari XEGS",
          year: 1987,
          characterRom: { id: "atari-os-rom" },
          cpu: { chip: "MOS 6502C", speed: 1.79 },
          memory: { ramKb: 64, romKb: 24 },
          notes: "Game console/computer hybrid. Detachable keyboard.",
          funFacts: [
            "The XEGS was designed to compete with the Nintendo Entertainment System",
          ],
        },
        {
          id: "atari-st",
          name: "Atari ST",
          year: 1985,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 8, height: 16, characterCount: 256 },
          cpu: { chip: "Motorola 68000", speed: 8, bits: 16 },
          memory: { ramKb: 512, romKb: 192 },
          notes: "16-bit computer. System font in TOS ROM.",
          funFacts: [
            "ST stood for 'Sixteen/Thirty-two' referring to the 68000's bus widths",
            "The ST was popular with musicians due to its built-in MIDI ports",
          ],
        },
      ],
    },

    // ========================================================================
    // Coleco
    // ========================================================================
    {
      id: "coleco",
      name: "Coleco Industries",
      country: "USA",
      founded: 1932,
      headquarters: "West Hartford, Connecticut",
      productLines: ["ColecoVision", "Adam"],
      funFacts: [
        "The name 'Coleco' is short for 'Connecticut Leather Company' - they originally made leather goods",
        "ColecoVision was the first console to feature a licensed arcade port (Donkey Kong)",
        "Coleco later found success with Cabbage Patch Kids dolls in the 1980s",
      ],
      systems: [
        {
          id: "colecovision",
          name: "ColecoVision",
          year: 1982,
          characterRom: { id: "tms9918" },
          cpu: { chip: "Zilog Z80A", speed: 3.58 },
          memory: { ramKb: 1, vramKb: 16, romKb: 8 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 256,
            uppercase: true,
            lowercase: true,
            encoding: "ASCII",
          },
          characterGenerator: {
            location: "vram",
            customizable: true,
            rendering: "hardware",
          },
          videoHardware: { vdp: "TMS9928A" },
          display: {
            textModes: [{ columns: 32, rows: 24 }],
            graphicsModes: [{ width: 256, height: 192, colors: 16 }],
            sprites: { count: 32, sizes: ["8x8", "16x16"], maxPerLine: 4 },
          },
          notes:
            "Game console with TMS9928A. Font in BIOS ROM, loaded to VRAM.",
          funFacts: [
            "The ColecoVision's graphics chip was the same used in the TI-99/4A and MSX computers",
          ],
        },
        {
          id: "coleco-adam",
          name: "Coleco Adam",
          year: 1983,
          characterRom: { id: "tms9918" },
          cpu: { chip: "Zilog Z80A", speed: 3.58 },
          memory: { ramKb: 80, romKb: 32 },
          notes:
            "Computer expansion for ColecoVision. Same video as ColecoVision.",
          funFacts: [
            "The Adam was notorious for its electromagnetic interference that could erase data tapes",
          ],
        },
      ],
    },

    // ========================================================================
    // Commodore
    // ========================================================================
    {
      id: "commodore",
      name: "Commodore International",
      country: "USA",
      founded: 1954,
      founders: ["Jack Tramiel"],
      headquarters: "West Chester, Pennsylvania",
      productLines: ["PET", "VIC-20", "C64", "C128", "Plus/4", "Amiga"],
      notes: "Acquired MOS Technology in 1976",
      funFacts: [
        "Jack Tramiel's motto was 'Computers for the masses, not the classes'",
        "The Commodore 64 is the best-selling single computer model of all time with 17+ million units",
        "Commodore started as a typewriter repair company in the 1950s",
      ],
      systems: [
        {
          id: "commodore-pet-2001",
          name: "PET 2001",
          year: 1977,
          characterRom: { id: "mos-901447-10" },
          cpu: { chip: "MOS 6502", speed: 1 },
          memory: { ramKb: 8, romKb: 14 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 256,
            uppercase: true,
            lowercase: true,
            encoding: "PETSCII",
          },
          display: {
            textModes: [{ columns: 40, rows: 25 }],
          },
          notes: "First Commodore computer. 40-column display.",
          funFacts: [
            "PET stood for 'Personal Electronic Transactor'",
            "The original PET featured a built-in cassette drive and chiclet keyboard",
          ],
        },
        {
          id: "commodore-pet-8032",
          name: "PET 8032",
          year: 1980,
          characterRom: { id: "mos-901447-10" },
          cpu: { chip: "MOS 6502", speed: 1 },
          memory: { ramKb: 32, romKb: 18 },
          display: {
            textModes: [{ columns: 80, rows: 25 }],
          },
          notes: "Business-oriented PET with 80-column display.",
        },
        {
          id: "vic-20",
          name: "VIC-20",
          year: 1980,
          characterRom: { id: "mos-901460-03" },
          cpu: { chip: "MOS 6502", speed: 1.02 },
          memory: { ramKb: 5, romKb: 16, expandableKb: 32 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 256,
            sets: 2,
            uppercase: true,
            lowercase: true,
            encoding: "PETSCII",
          },
          characterGenerator: {
            location: "dedicated_rom",
            address: "$8000",
            customizable: true,
            customMethod: "VIC register",
          },
          videoHardware: { chips: ["VIC"] },
          display: {
            textModes: [{ columns: 22, rows: 23 }],
            graphicsModes: [{ width: 176, height: 184, colors: 8 }],
          },
          notes: "First Commodore color computer. 22-column display.",
          funFacts: [
            "The VIC-20 was the first computer to sell one million units",
            "It was sold as the VIC-1001 in Japan and VC-20 in Germany",
          ],
        },
        {
          id: "c64",
          name: "C64",
          alternateNames: ["Commodore 64", "CBM 64"],
          year: 1982,
          characterRom: { id: "mos-901225-01" },
          cpu: { chip: "MOS 6510", speed: 1.02 },
          memory: { ramKb: 64, romKb: 20 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 256,
            sets: 2,
            uppercase: true,
            lowercase: true,
            encoding: "PETSCII",
          },
          characterGenerator: {
            location: "dedicated_rom",
            address: "$D000",
            sizeBytes: 4096,
            customizable: true,
            customMethod: "VIC-II bank switching",
          },
          videoHardware: { chips: ["VIC-II"] },
          display: {
            textModes: [{ columns: 40, rows: 25, colors: 16 }],
            graphicsModes: [
              { width: 320, height: 200, colors: 2, notes: "Hi-Res" },
              { width: 160, height: 200, colors: 4, notes: "Multicolor" },
            ],
            sprites: { count: 8, sizes: ["24x21"], maxPerLine: 8 },
            paletteColors: 16,
          },
          notes:
            "Most popular 8-bit computer. Two PETSCII charsets in 4KB ROM.",
          funFacts: [
            "The C64 holds the Guinness World Record for the highest-selling single computer model",
            "The SID sound chip was designed by Bob Yannes, who later co-founded Ensoniq",
          ],
        },
        {
          id: "c64c",
          name: "Commodore 64C",
          year: 1986,
          characterRom: { id: "mos-901225-01" },
          cpu: { chip: "MOS 8500", speed: 1.02 },
          memory: { ramKb: 64, romKb: 20 },
          notes: "Redesigned C64 with cost-reduced motherboard.",
        },
        {
          id: "c128",
          name: "Commodore 128",
          year: 1985,
          characterRom: { id: "mos-901225-01" },
          cpu: { chip: "MOS 8502 + Zilog Z80", speed: 2 },
          memory: { ramKb: 128, romKb: 72 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 256,
            sets: 2,
            uppercase: true,
            lowercase: true,
            encoding: "PETSCII",
          },
          display: {
            textModes: [
              { columns: 40, rows: 25, notes: "VIC-II mode" },
              { columns: 80, rows: 25, notes: "VDC mode" },
            ],
          },
          notes: "Dual-CPU: 8502 for C64 mode, Z80 for CP/M.",
          funFacts: [
            "The C128 was fully backwards compatible with the C64",
            "It included three operating modes: C128, C64, and CP/M",
          ],
        },
        {
          id: "plus-4",
          name: "Plus/4",
          year: 1984,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 8, height: 8, characterCount: 256 },
          cpu: { chip: "MOS 7501", speed: 1.76 },
          memory: { ramKb: 64, romKb: 32 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 256,
            uppercase: true,
            lowercase: true,
            encoding: "PETSCII",
          },
          display: {
            textModes: [{ columns: 40, rows: 25 }],
            graphicsModes: [{ width: 320, height: 200, colors: 2 }],
          },
          notes:
            "Business-oriented computer with built-in software. TED chip for video.",
          funFacts: [
            "The Plus/4 included word processor, spreadsheet, database, and graphing software in ROM",
            "Despite its features, it was incompatible with C64 software and failed commercially",
          ],
        },
        {
          id: "amiga-500",
          name: "Amiga 500",
          year: 1987,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 8, height: 8, characterCount: 256 },
          cpu: { chip: "Motorola 68000", speed: 7.16, bits: 16 },
          memory: { ramKb: 512, romKb: 256 },
          notes: "16/32-bit computer. Topaz system font.",
          funFacts: [
            "The Amiga was far ahead of its time with preemptive multitasking and custom chips",
            "It became the platform of choice for video production in the late 1980s",
          ],
        },
      ],
    },

    // ========================================================================
    // Dragon Data
    // ========================================================================
    {
      id: "dragon-data",
      name: "Dragon Data Ltd",
      country: "UK (Wales)",
      founded: 1982,
      headquarters: "Port Talbot, Wales",
      productLines: ["Dragon 32", "Dragon 64"],
      funFacts: [
        "Dragon Data was the only home computer manufacturer based in Wales",
        "The Dragon 32/64 was partially compatible with the TRS-80 Color Computer due to similar hardware",
        "The Welsh Development Agency provided significant funding for Dragon Data",
      ],
      systems: [
        {
          id: "dragon-32",
          name: "Dragon 32",
          year: 1982,
          characterRom: { id: "mc6847" },
          cpu: { chip: "Motorola 6809E", speed: 0.89 },
          memory: { ramKb: 32, romKb: 16 },
          characterDimensions: {
            cell: { width: 8, height: 12 },
            glyph: { width: 5, height: 7 },
          },
          characterSets: {
            glyphs: 64,
            uppercase: true,
            lowercase: false,
            inverseVideo: true,
          },
          characterGenerator: {
            location: "vdg_internal",
            customizable: false,
          },
          videoHardware: { vdp: "MC6847" },
          display: {
            textModes: [{ columns: 32, rows: 16 }],
            graphicsModes: [{ width: 256, height: 192, colors: 4 }],
          },
          notes:
            "Used MC6847 VDG internal font. Uppercase only. Left-padded format.",
          funFacts: [
            "The Dragon was essentially a clone of the TRS-80 Color Computer",
          ],
        },
        {
          id: "dragon-64",
          name: "Dragon 64",
          year: 1983,
          characterRom: { id: "mc6847" },
          cpu: { chip: "Motorola 6809E", speed: 0.89 },
          memory: { ramKb: 64, romKb: 16 },
          notes: "Dragon 32 with 64KB RAM and RS-232 port.",
        },
      ],
    },

    // ========================================================================
    // Mattel
    // ========================================================================
    {
      id: "mattel",
      name: "Mattel Electronics",
      country: "USA",
      founded: 1945,
      headquarters: "El Segundo, California",
      productLines: ["Intellivision", "Aquarius"],
      funFacts: [
        "Mattel is best known for Barbie and Hot Wheels, but their Intellivision was a major Atari 2600 competitor",
        "The Intellivision was the first 16-bit video game console",
        "Mattel's game division lost over $300 million before being closed in 1984",
      ],
      systems: [
        {
          id: "intellivision",
          name: "Intellivision",
          year: 1979,
          characterRom: { id: "intellivision-grom" },
          cpu: { chip: "General Instrument CP1610", speed: 0.895, bits: 16 },
          memory: { ramKb: 1, romKb: 7 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 213,
            encoding: "Custom (GROM)",
          },
          videoHardware: { chips: ["STIC (AY-3-8900)"] },
          display: {
            graphicsModes: [{ width: 160, height: 96, colors: 16 }],
            sprites: { count: 8, sizes: ["8x8", "8x16"] },
          },
          notes:
            "STIC chip has 213 predefined 8x8 'cards' in GROM. Unusual format.",
          funFacts: [
            "The Intellivision was the first console to offer downloadable games via PlayCable",
          ],
        },
      ],
    },

    // ========================================================================
    // MSX Consortium
    // ========================================================================
    {
      id: "ascii-microsoft",
      name: "MSX Consortium",
      country: "Japan/International",
      founded: 1983,
      founders: ["ASCII Corporation", "Microsoft"],
      productLines: ["MSX", "MSX2", "MSX2+", "MSX turboR"],
      notes: "Standard adopted by Sony, Panasonic, Philips, and others",
      funFacts: [
        "MSX stood for 'Machines with Software eXchangeability' according to official sources",
        "Popular games like Metal Gear and Bomberman originated on MSX systems",
        "Over 20 different manufacturers produced MSX-compatible computers",
      ],
      systems: [
        {
          id: "msx",
          name: "MSX",
          year: 1983,
          characterRom: { id: "tms9918" },
          cpu: { chip: "Zilog Z80A", speed: 3.58 },
          memory: { ramKb: 8, romKb: 32 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 256,
            uppercase: true,
            lowercase: true,
            encoding: "ASCII/International",
          },
          characterGenerator: {
            location: "vram",
            customizable: true,
            rendering: "hardware",
          },
          videoHardware: { vdp: "TMS9918A / TMS9928A / TMS9929A" },
          display: {
            textModes: [
              { id: "screen0", columns: 40, rows: 24 },
              { id: "screen1", columns: 32, rows: 24 },
            ],
            graphicsModes: [{ width: 256, height: 192, colors: 16 }],
            sprites: { count: 32, sizes: ["8x8", "16x16"], maxPerLine: 4 },
          },
          notes:
            "TMS9918 VDP. Font in BIOS ROM, copied to VRAM. Standard across many manufacturers.",
          funFacts: [
            "MSX was extremely popular in Japan, South Korea, and parts of Europe and South America",
          ],
        },
        {
          id: "msx2",
          name: "MSX2",
          year: 1985,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 8, height: 8, characterCount: 256 },
          cpu: { chip: "Zilog Z80A", speed: 3.58 },
          memory: { ramKb: 64, vramKb: 128, romKb: 48 },
          videoHardware: { vdp: "V9938" },
          display: {
            graphicsModes: [
              { width: 512, height: 212, colors: 16 },
              { width: 256, height: 212, colors: 256 },
            ],
          },
          notes: "V9938 VDP with enhanced graphics.",
          funFacts: [
            "MSX2 introduced hardware scrolling and more colors",
          ],
        },
      ],
    },

    // ========================================================================
    // NEC
    // ========================================================================
    {
      id: "nec",
      name: "NEC Corporation",
      country: "Japan",
      founded: 1899,
      headquarters: "Tokyo, Japan",
      productLines: ["PC-6001", "PC-8001", "PC-8801", "PC-9801"],
      funFacts: [
        "The PC-98 series dominated the Japanese PC market for over a decade with 90%+ market share",
        "NEC stands for 'Nippon Electric Company' and was founded as a telephone equipment manufacturer",
        "The TurboGrafx-16/PC Engine was jointly developed by NEC and Hudson Soft",
      ],
      systems: [
        {
          id: "nec-pc-6001",
          name: "NEC PC-6001",
          year: 1981,
          characterRom: { id: "mc6847" },
          cpu: { chip: "Zilog Z80A", speed: 4 },
          memory: { ramKb: 16, romKb: 16 },
          videoHardware: { vdp: "MC6847" },
          display: {
            textModes: [{ columns: 32, rows: 16 }],
          },
          notes: "Japanese home computer using MC6847 VDG.",
          funFacts: [
            "The PC-6001 was popular in Japan for gaming and education",
          ],
        },
      ],
    },

    // ========================================================================
    // Oric
    // ========================================================================
    {
      id: "oric",
      name: "Oric Products International Ltd",
      country: "UK",
      founded: 1981,
      headquarters: "St Ives, Cambridgeshire",
      productLines: ["Oric-1", "Oric Atmos"],
      notes: "Originally Tangerine Computer Systems",
      funFacts: [
        "The Oric-1 was particularly popular in France where it outsold the ZX Spectrum",
        "Oric was spun off from Tangerine Computer Systems, which also made the Microtan 65",
        "The company name 'Oric' was intended to suggest 'Original' and 'Organic'",
      ],
      systems: [
        {
          id: "oric-1",
          name: "Oric-1",
          year: 1983,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 6, height: 8, characterCount: 128 },
          cpu: { chip: "MOS 6502A", speed: 1 },
          memory: { ramKb: 16, romKb: 16, expandableKb: 64 },
          characterDimensions: {
            cell: { width: 6, height: 8 },
            glyph: { width: 6, height: 8 },
          },
          characterSets: {
            glyphs: 128,
            uppercase: true,
            lowercase: true,
            encoding: "ASCII",
          },
          display: {
            textModes: [{ columns: 40, rows: 28 }],
            graphicsModes: [{ width: 240, height: 200, colors: 8 }],
          },
          notes:
            "UK computer popular in France. 6x8 character matrix, software rendered.",
          funFacts: [
            "The Oric-1 had a notorious reputation for cassette loading problems",
          ],
        },
        {
          id: "oric-atmos",
          name: "Oric Atmos",
          year: 1984,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 6, height: 8, characterCount: 128 },
          cpu: { chip: "MOS 6502A", speed: 1 },
          memory: { ramKb: 48, romKb: 16 },
          notes: "Improved Oric-1 with better keyboard and ROM.",
        },
      ],
    },

    // ========================================================================
    // Philips
    // ========================================================================
    {
      id: "philips",
      name: "Philips",
      country: "Netherlands",
      founded: 1891,
      headquarters: "Amsterdam, Netherlands",
      productLines: ["P2000", "MSX computers", "Videopac"],
      funFacts: [
        "Philips co-invented the CD format with Sony in 1982",
        "The Philips Videopac was sold as the Magnavox Odyssey² in North America",
        "Philips started as a light bulb manufacturer in Eindhoven in 1891",
      ],
      systems: [
        {
          id: "philips-p2000",
          name: "Philips P2000",
          year: 1980,
          characterRom: { id: "saa5050" },
          cpu: { chip: "Zilog Z80A", speed: 2.5 },
          memory: { ramKb: 16, romKb: 16 },
          characterDimensions: {
            cell: { width: 6, height: 10 },
            glyph: { width: 5, height: 9 },
          },
          characterSets: {
            glyphs: 96,
            uppercase: true,
            lowercase: true,
            encoding: "ASCII",
          },
          videoHardware: { chips: ["SAA5050"] },
          display: {
            textModes: [{ columns: 40, rows: 24, type: "teletext" }],
          },
          notes: "Dutch computer using SAA5050 Teletext chip. Uses LSB-first bit order.",
          funFacts: [
            "The P2000 was primarily sold in the Netherlands and Belgium",
          ],
        },
      ],
    },

    // ========================================================================
    // Sega
    // ========================================================================
    {
      id: "sega",
      name: "Sega Enterprises",
      country: "Japan",
      founded: 1960,
      headquarters: "Tokyo, Japan",
      productLines: ["SG-1000", "SC-3000", "Master System", "Genesis/Mega Drive"],
      funFacts: [
        "The name 'SEGA' is a portmanteau of 'SErvice GAmes', an American company that made coin-operated machines",
        "The Mega Drive/Genesis was released in Japan on the same day as the Super Famicom was announced",
        "Sega started by making coin-operated amusement machines for American military bases in Japan",
      ],
      systems: [
        {
          id: "sega-sg-1000",
          name: "SG-1000",
          year: 1983,
          characterRom: { id: "tms9918" },
          cpu: { chip: "Zilog Z80A", speed: 3.58 },
          memory: { ramKb: 1, vramKb: 16, romKb: 8 },
          videoHardware: { vdp: "TMS9918A" },
          display: {
            graphicsModes: [{ width: 256, height: 192, colors: 16 }],
            sprites: { count: 32, sizes: ["8x8", "16x16"], maxPerLine: 4 },
          },
          notes: "Sega's first home console. Uses TMS9918A VDP.",
          funFacts: [
            "The SG-1000 was released the same day as the Nintendo Famicom in Japan",
          ],
        },
        {
          id: "sega-sc-3000",
          name: "SC-3000",
          year: 1983,
          characterRom: { id: "tms9918" },
          cpu: { chip: "Zilog Z80A", speed: 3.58 },
          memory: { ramKb: 2, vramKb: 16, romKb: 8 },
          notes: "Computer version of SG-1000 with keyboard.",
        },
      ],
    },

    // ========================================================================
    // Sharp
    // ========================================================================
    {
      id: "sharp",
      name: "Sharp Corporation",
      country: "Japan",
      founded: 1912,
      headquarters: "Osaka, Japan",
      productLines: ["MZ series", "X1", "X68000"],
      funFacts: [
        "The company was named 'Sharp' after the Ever-Sharp mechanical pencil invented by founder Tokuji Hayakawa",
        "The X68000 was a popular platform for arcade game development and ports in Japan",
        "Sharp pioneered the 'clean computer' design philosophy with the MZ series, booting from tape/disk with no built-in BASIC",
      ],
      systems: [
        {
          id: "sharp-mz-80k",
          name: "Sharp MZ-80K",
          year: 1978,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 8, height: 8, characterCount: 256 },
          cpu: { chip: "Zilog Z80", speed: 2 },
          memory: { ramKb: 48, romKb: 4 },
          display: {
            textModes: [{ columns: 40, rows: 25 }],
          },
          notes: "Clean computer - no built-in BASIC, loaded from tape.",
          funFacts: [
            "Sharp's 'clean computer' concept meant the OS had to be loaded from tape",
          ],
        },
      ],
    },

    // ========================================================================
    // Sinclair
    // ========================================================================
    {
      id: "sinclair",
      name: "Sinclair Research Ltd",
      country: "UK",
      founded: 1961,
      founders: ["Clive Sinclair"],
      headquarters: "Cambridge, England",
      productLines: ["ZX80", "ZX81", "ZX Spectrum", "QL"],
      funFacts: [
        "Clive Sinclair was knighted in 1983 for services to British industry",
        "The ZX Spectrum launched a generation of British game developers, many of whom founded major studios",
        "Sinclair also invented the C5 electric vehicle, which was a commercial failure but ahead of its time",
      ],
      systems: [
        {
          id: "zx80",
          name: "ZX80",
          year: 1980,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 8, height: 8, characterCount: 64 },
          cpu: { chip: "Zilog Z80A", speed: 3.25 },
          memory: { ramKb: 1, romKb: 4 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 64,
            uppercase: true,
            lowercase: false,
          },
          display: {
            textModes: [{ columns: 32, rows: 24, colors: 2 }],
          },
          notes: "First Sinclair computer. 64 characters, no lowercase.",
          funFacts: [
            "The ZX80 was the first personal computer in Britain to cost under £100",
          ],
        },
        {
          id: "zx81",
          name: "ZX81",
          year: 1981,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 8, height: 8, characterCount: 64 },
          cpu: { chip: "Zilog Z80A", speed: 3.25 },
          memory: { ramKb: 1, romKb: 8, expandableKb: 16 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 64,
            uppercase: true,
            lowercase: false,
          },
          display: {
            textModes: [{ columns: 32, rows: 24, colors: 2 }],
          },
          notes: "Cost-reduced ZX80. Huge seller, 1.5 million units.",
          funFacts: [
            "The ZX81 was sold as a kit for £49.95 or assembled for £69.95",
            "It was sold as the Timex Sinclair 1000 in the USA",
          ],
        },
        {
          id: "zx-spectrum",
          name: "ZX Spectrum",
          alternateNames: ["Speccy"],
          year: 1982,
          characterRom: { id: "sinclair-spectrum-rom" },
          cpu: { chip: "Zilog Z80A", speed: 3.5 },
          memory: { ramKb: 16, romKb: 16, expandableKb: 48 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 96,
            uppercase: true,
            lowercase: true,
            udg: true,
            udgMethod: "USR function",
            notes: "21 user-defined graphics characters",
          },
          characterGenerator: {
            location: "system_rom",
            address: "$3D00",
            sizeBytes: 768,
            customizable: true,
            customMethod: "UDG area in RAM",
          },
          videoHardware: { ula: "Ferranti ULA" },
          display: {
            textModes: [{ columns: 32, rows: 24, colors: 8 }],
            graphicsModes: [
              {
                width: 256,
                height: 192,
                colors: 8,
                notes: "Attribute-based color",
              },
            ],
          },
          notes:
            "Iconic UK computer. 96 printable characters in ROM at $3D00-$3FFF.",
          funFacts: [
            "The rubber keyboard was a cost-saving measure that became iconic",
            "Over 24,000 software titles were released for the Spectrum",
          ],
        },
        {
          id: "zx-spectrum-128",
          name: "ZX Spectrum 128",
          year: 1985,
          characterRom: { id: "sinclair-spectrum-rom" },
          cpu: { chip: "Zilog Z80A", speed: 3.5 },
          memory: { ramKb: 128, romKb: 32, bankSwitched: true },
          notes:
            "Enhanced Spectrum with 128KB RAM and AY-3-8912 sound chip.",
          funFacts: [
            "The 128K was first released in Spain before the UK",
          ],
        },
        {
          id: "zx-spectrum-plus2",
          name: "ZX Spectrum +2",
          year: 1986,
          characterRom: { id: "sinclair-spectrum-rom" },
          cpu: { chip: "Zilog Z80A", speed: 3.5 },
          memory: { ramKb: 128, romKb: 32 },
          notes:
            "Amstrad-built Spectrum with integrated tape deck.",
          funFacts: [
            "The +2 was the first Spectrum made by Amstrad after acquiring Sinclair",
          ],
        },
        {
          id: "zx-spectrum-plus3",
          name: "ZX Spectrum +3",
          year: 1987,
          characterRom: { id: "sinclair-spectrum-rom" },
          cpu: { chip: "Zilog Z80A", speed: 3.5 },
          memory: { ramKb: 128, romKb: 64 },
          notes:
            "Spectrum with 3-inch floppy drive. Last official Spectrum.",
          funFacts: [
            "The +3 used the same 3-inch disks as the Amstrad CPC",
          ],
        },
      ],
    },

    // ========================================================================
    // Tandy / Radio Shack
    // ========================================================================
    {
      id: "tandy",
      name: "Tandy Corporation / Radio Shack",
      country: "USA",
      founded: 1963,
      headquarters: "Fort Worth, Texas",
      productLines: ["TRS-80 Model I/III/4", "Color Computer", "Model 100"],
      funFacts: [
        "The TRS-80 Model I was nicknamed 'Trash-80' by enthusiasts, despite being a bestseller",
        "Radio Shack stores gave Tandy unparalleled retail distribution for personal computers",
        "The Model 100 was one of the first laptop computers and was popular with journalists",
      ],
      systems: [
        {
          id: "trs-80-model-i",
          name: "TRS-80 Model I",
          year: 1977,
          characterRom: { id: "mcm6673" },
          cpu: { chip: "Zilog Z80", speed: 1.77 },
          memory: { ramKb: 4, romKb: 4, expandableKb: 48 },
          characterDimensions: {
            cell: { width: 6, height: 12 },
            glyph: { width: 5, height: 8 },
          },
          characterSets: {
            glyphs: 128,
            uppercase: true,
            lowercase: true,
            encoding: "ASCII",
          },
          characterGenerator: {
            location: "dedicated_chip",
            customizable: false,
          },
          display: {
            textModes: [{ columns: 64, rows: 16 }],
            graphicsModes: [
              {
                width: 128,
                height: 48,
                colors: 2,
                notes: "Semigraphics block mode",
              },
            ],
          },
          notes:
            "First TRS-80. Motorola MCM6673 character generator. 5x8 font in 6x12 cell.",
          funFacts: [
            "The TRS-80 was one of the first mass-produced personal computers",
            "Over 200,000 units sold in the first year",
          ],
        },
        {
          id: "trs-80-model-iii",
          name: "TRS-80 Model III",
          year: 1980,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 8, height: 12, characterCount: 128 },
          cpu: { chip: "Zilog Z80", speed: 2 },
          memory: { ramKb: 16, romKb: 14, expandableKb: 48 },
          display: {
            textModes: [{ columns: 64, rows: 16 }],
          },
          notes:
            "Integrated Model I with better RF shielding. Custom character ROM.",
          funFacts: [
            "The Model III addressed the Model I's electromagnetic interference issues",
          ],
        },
        {
          id: "trs-80-model-4",
          name: "TRS-80 Model 4",
          year: 1983,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 8, height: 8, characterCount: 256 },
          cpu: { chip: "Zilog Z80A", speed: 4 },
          memory: { ramKb: 64, romKb: 14, expandableKb: 128 },
          display: {
            textModes: [
              { columns: 80, rows: 24 },
              { columns: 64, rows: 16, notes: "Model III compatible" },
            ],
          },
          notes:
            "Final TRS-80 desktop. 80-column mode and CP/M compatible.",
        },
        {
          id: "trs-80-coco",
          name: "TRS-80 Color Computer",
          alternateNames: ["CoCo", "Color Computer"],
          year: 1980,
          characterRom: { id: "mc6847" },
          cpu: { chip: "Motorola 6809E", speed: 0.89 },
          memory: { ramKb: 4, romKb: 8, expandableKb: 64 },
          characterDimensions: {
            cell: { width: 8, height: 12 },
            glyph: { width: 5, height: 7 },
          },
          characterSets: {
            glyphs: 64,
            uppercase: true,
            lowercase: false,
            inverseVideo: true,
          },
          characterGenerator: {
            location: "vdg_internal",
            customizable: false,
          },
          videoHardware: { vdp: "MC6847" },
          display: {
            textModes: [{ columns: 32, rows: 16 }],
            graphicsModes: [{ width: 256, height: 192, colors: 4 }],
          },
          notes:
            "Used MC6847 VDG internal font. Uppercase only. Left-padded format.",
          funFacts: [
            "The CoCo used Microsoft Color BASIC",
            "It was designed by Motorola and licensed to Tandy",
          ],
        },
        {
          id: "trs-80-coco2",
          name: "TRS-80 Color Computer 2",
          alternateNames: ["CoCo 2"],
          year: 1983,
          characterRom: { ids: ["mc6847", "mc6847t1"] },
          cpu: { chip: "Motorola 6809E", speed: 0.89 },
          memory: { ramKb: 16, romKb: 16, expandableKb: 64 },
          notes:
            "Cost-reduced CoCo. Later models used MC6847T1 with lowercase.",
          funFacts: [
            "Late CoCo 2 models finally added lowercase letters via the T1 chip",
          ],
        },
        {
          id: "trs-80-coco3",
          name: "Tandy Color Computer 3",
          alternateNames: ["CoCo 3"],
          year: 1986,
          characterRom: { id: "gime" },
          cpu: { chip: "Motorola 6809E", speed: 1.79 },
          memory: { ramKb: 128, romKb: 32, expandableKb: 512 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 256,
            uppercase: true,
            lowercase: true,
            udg: true,
          },
          characterGenerator: {
            location: "system_rom",
            customizable: true,
            customMethod: "RAM-based fonts",
          },
          videoHardware: { chips: ["GIME"] },
          display: {
            textModes: [
              { columns: 40, rows: 24, colors: 8 },
              { columns: 80, rows: 24, colors: 8 },
            ],
            graphicsModes: [{ width: 640, height: 225, colors: 4 }],
            paletteColors: 64,
          },
          notes: "Major upgrade with GIME chip. 40/80-column text modes.",
          funFacts: [
            "The CoCo 3 was a significant upgrade with enhanced graphics and more RAM",
          ],
        },
        {
          id: "trs-80-mc10",
          name: "TRS-80 MC-10",
          year: 1983,
          characterRom: { id: "mc6847" },
          cpu: { chip: "Motorola 6803", speed: 0.89 },
          memory: { ramKb: 4, romKb: 8 },
          notes:
            "Budget computer with MC6847 VDG. Chiclet keyboard.",
          funFacts: [
            "The MC-10 was Tandy's attempt at a low-cost entry-level computer",
          ],
        },
        {
          id: "tandy-model-100",
          name: "TRS-80 Model 100",
          year: 1983,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          characterRom: { width: 5, height: 7, characterCount: 256 },
          cpu: { chip: "Intel 80C85", speed: 2.4 },
          memory: { ramKb: 8, romKb: 32 },
          formFactor: "portable",
          display: {
            textModes: [{ columns: 40, rows: 8 }],
          },
          notes:
            "Portable computer with LCD. ROM includes Microsoft BASIC by Bill Gates.",
          funFacts: [
            "Bill Gates personally wrote much of the Model 100's ROM software",
            "Journalists loved it for its portability and long battery life",
          ],
        },
      ],
    },

    // ========================================================================
    // Texas Instruments
    // ========================================================================
    {
      id: "texas-instruments",
      name: "Texas Instruments",
      country: "USA",
      founded: 1951,
      headquarters: "Dallas, Texas",
      productLines: ["TI-99/4", "TI-99/4A"],
      funFacts: [
        "TI invented the integrated circuit (microchip) in 1958, along with Fairchild Semiconductor",
        "The TI-99/4A was the first home computer with a 16-bit processor",
        "TI lost an estimated $500 million in the home computer price war before exiting in 1983",
      ],
      systems: [
        {
          id: "ti-99-4",
          name: "TI-99/4",
          year: 1979,
          characterRom: { id: "tms9918" },
          cpu: { chip: "TMS9900", speed: 3, bits: 16 },
          memory: { ramKb: 16, vramKb: 16, romKb: 26 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 256,
            uppercase: true,
            lowercase: false,
            encoding: "ASCII",
          },
          characterGenerator: {
            location: "vram",
            customizable: true,
            rendering: "hardware",
          },
          videoHardware: { vdp: "TMS9918" },
          display: {
            textModes: [{ id: "text", columns: 40, rows: 24 }],
            graphicsModes: [{ width: 256, height: 192, colors: 16 }],
            sprites: { count: 32, sizes: ["8x8", "16x16"], maxPerLine: 4 },
          },
          notes:
            "First 16-bit home computer. TMS9918 VDP. Font loaded to VRAM.",
          funFacts: [
            "The TI-99/4 was expensive at $1,150 and had a calculator-style keyboard",
          ],
        },
        {
          id: "ti-99-4a",
          name: "TI-99/4A",
          year: 1981,
          characterRom: { id: "tms9918" },
          cpu: { chip: "TMS9900", speed: 3, bits: 16 },
          memory: { ramKb: 16, vramKb: 16, romKb: 26 },
          characterDimensions: {
            cell: { width: 8, height: 8 },
            glyph: { width: 8, height: 8 },
          },
          characterSets: {
            glyphs: 256,
            uppercase: true,
            lowercase: true,
            encoding: "ASCII",
          },
          characterGenerator: {
            location: "vram",
            customizable: true,
            rendering: "hardware",
          },
          videoHardware: { vdp: "TMS9918A" },
          display: {
            textModes: [{ id: "text", columns: 40, rows: 24 }],
            graphicsModes: [{ width: 256, height: 192, colors: 16 }],
            sprites: { count: 32, sizes: ["8x8", "16x16"], maxPerLine: 4 },
          },
          notes:
            "Improved TI-99/4 with full keyboard and lowercase. Price dropped to $99 in price war.",
          funFacts: [
            "The price war between TI and Commodore drove the TI-99/4A's price from $525 to $99",
            "TI lost money on every unit sold at the lower prices",
          ],
        },
      ],
    },
  ],

  // ==========================================================================
  // Chip Manufacturers
  // ==========================================================================
  chipManufacturers: [
    // ========================================================================
    // Atari (embedded ROM)
    // ========================================================================
    {
      id: "atari-chips",
      name: "Atari Inc",
      country: "USA",
      founded: 1972,
      headquarters: "Sunnyvale, California",
      chips: [
        {
          id: "atari-os-rom",
          partNumber: "Atari OS ROM",
          type: "System ROM (embedded font)",
          year: 1979,
          capacity: { bytes: 1024 },
          organization: "128x8x8",
          glyph: { width: 8, height: 8 },
          glyphCount: 128,
          internalFont: true,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          usedIn: ["Atari 400", "Atari 800", "Atari 800XL", "Atari 65XE", "Atari 130XE", "Atari XEGS"],
          notes: "Font in OS ROM at $E000-$E3FF; allows software redirection to RAM via CHBAS ($2F4).",
          funFacts: ["The Atari font was designed to be clean and readable on low-resolution displays"],
        },
      ],
    },

    // ========================================================================
    // Coleco
    // ========================================================================
    {
      id: "coleco-chips",
      name: "Coleco Industries",
      country: "USA",
      founded: 1932,
      headquarters: "West Hartford, Connecticut",
      chips: [
        {
          id: "colecovision-bios",
          partNumber: "ColecoVision BIOS",
          type: "System BIOS (8KB)",
          year: 1982,
          capacity: { kb: 8 },
          glyph: { width: 8, height: 8 },
          glyphCount: 256,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          usedIn: ["ColecoVision"],
          notes: "Contains startup code, bitmap fonts, and utility routines.",
          funFacts: ["The BIOS contained one of the earliest arcade-quality font sets for home consoles"],
        },
      ],
    },

    // ========================================================================
    // General Instrument
    // ========================================================================
    {
      id: "general-instrument",
      name: "General Instrument",
      country: "USA",
      founded: 1923,
      headquarters: "New York, New York",
      chips: [
        {
          id: "gi-ro-3-2513",
          partNumber: "RO-3-2513",
          type: "Mask ROM",
          capacity: { bits: 2560 },
          organization: "64x8x5",
          output: "5-bit parallel",
          glyph: { width: 5, height: 7 },
          glyphCount: 64,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          usedIn: ["Apple II"],
          notes: "Pin-compatible with Signetics 2513, used in Apple II clones.",
          funFacts: ["GI made popular second-source versions of the Signetics 2513"],
        },
        {
          id: "intellivision-grom",
          partNumber: "GROM",
          type: "Graphics ROM (part of STIC)",
          year: 1979,
          capacity: { kb: 2 },
          glyph: { width: 8, height: 8 },
          glyphCount: 213,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          usedIn: ["Intellivision"],
          notes: "213 predefined 8x8 graphics cards including alphanumerics. Part of STIC (AY-3-8900).",
          funFacts: ["The GROM used a unique 'card' concept where each character was treated as a graphic tile"],
        },
      ],
    },

    // ========================================================================
    // MOS Technology
    // ========================================================================
    {
      id: "mos-technology",
      name: "MOS Technology",
      country: "USA",
      founded: 1969,
      headquarters: "Norristown, Pennsylvania",
      notes: "Acquired by Commodore in 1976",
      funFacts: [
        "MOS Technology was founded by former Motorola engineers",
        "The 6502 CPU designed by MOS powered the Apple II, C64, and Atari computers",
      ],
      chips: [
        {
          id: "mos-901225-01",
          partNumber: "901225-01",
          type: "Mask ROM (2332-type)",
          year: 1982,
          capacity: { kb: 4, bytes: 4096 },
          organization: "4Kx8",
          glyph: { width: 8, height: 8 },
          glyphCount: 256,
          characterSetsStored: 2,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          usedIn: ["C64", "Commodore 64C", "Commodore 128"],
          notes: "Two PETSCII charsets (uppercase/graphics, uppercase/lowercase). Commonly replaced via EPROM adapters.",
          funFacts: ["This is one of the most replaced ROMs in retro computing, often swapped for custom character sets"],
        },
        {
          id: "mos-901447-10",
          partNumber: "901447-10",
          type: "Mask ROM (2316-type)",
          capacity: { kb: 2, bytes: 2048 },
          glyph: { width: 8, height: 8 },
          glyphCount: 256,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          usedIn: ["PET 8032"],
          notes: "Reversed characters generated by hardware logic.",
          funFacts: ["The PET business machines used this ROM for professional-looking 80-column displays"],
        },
        {
          id: "mos-901460-03",
          partNumber: "901460-03",
          type: "Mask ROM (2332-type)",
          year: 1980,
          capacity: { kb: 4, bytes: 4096 },
          organization: "4Kx8",
          glyph: { width: 8, height: 8 },
          glyphCount: 256,
          characterSetsStored: 2,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          usedIn: ["VIC-20"],
          notes: "4Kx8 mask ROM; byte-wide organization. Two charsets switchable.",
          funFacts: ["The VIC-20 character ROM featured both PETSCII graphic characters and standard text"],
        },
      ],
    },

    // ========================================================================
    // Motorola
    // ========================================================================
    {
      id: "motorola",
      name: "Motorola",
      country: "USA",
      founded: 1928,
      headquarters: "Schaumburg, Illinois",
      funFacts: [
        "Motorola originally made car radios - the name combines 'motor' with 'ola' (sound)",
        "The MC6800 and MC6809 CPUs powered many classic computers",
      ],
      chips: [
        {
          id: "mc6847",
          partNumber: "MC6847",
          type: "Video Display Generator (VDG)",
          year: 1978,
          organization: "64x7x5",
          glyph: { width: 5, height: 7 },
          glyphCount: 64,
          internalFont: true,
          binaryFormat: { padding: "left", bitOrder: "msb" },
          usedIn: ["TRS-80 Color Computer", "TRS-80 Color Computer 2", "TRS-80 MC-10", "Dragon 32", "Dragon 64", "Acorn Atom", "NEC PC-6001"],
          variants: {
            MC6847: "Original, uppercase only",
            MC6847Y: "Interlaced video",
            MC6847T1: "96 characters with lowercase",
          },
          notes: "All-in-one VDG with internal 64-character ROM. 256x192 resolution, 9 colors, text mode 32x16.",
          funFacts: [
            "The MC6847 was one of the most popular video display chips of the early 1980s",
            "Its internal font was uppercase-only, a deliberate cost-saving measure",
          ],
        },
        {
          id: "mc6847t1",
          partNumber: "MC6847T1",
          type: "Video Display Generator (enhanced)",
          organization: "96x7x5",
          glyph: { width: 5, height: 7 },
          glyphCount: 96,
          internalFont: true,
          binaryFormat: { padding: "left", bitOrder: "msb" },
          usedIn: ["TRS-80 Color Computer 2"],
          notes: "Enhanced version with 96 characters including true lowercase. Used in late CoCo 2 models.",
          funFacts: ["The T1 variant added lowercase letters, which many users of the original MC6847 had requested"],
        },
        {
          id: "mcm6673",
          partNumber: "MCM6673",
          type: "Mask ROM (custom)",
          capacity: { bits: 5120, bytes: 640 },
          organization: "128x8x5",
          output: "5-bit parallel",
          glyph: { width: 5, height: 8 },
          glyphCount: 128,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          usedIn: ["TRS-80 Model I"],
          notes: "Custom for Radio Shack. Part of MCM6670 series. Outputs 5 bits per row.",
          funFacts: ["This was a custom ROM ordered by Radio Shack specifically for the TRS-80 Model I"],
        },
        {
          id: "mcm6674",
          partNumber: "MCM6674",
          type: "Mask ROM",
          capacity: { bits: 5120, bytes: 640 },
          organization: "128x8x5",
          output: "5-bit parallel",
          glyph: { width: 5, height: 8 },
          glyphCount: 128,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          usedIn: [],
          notes: "General-purpose character generator for terminals. Standard terminal character set.",
          funFacts: ["The MCM6674 was widely used in video terminals and display systems"],
        },
      ],
    },

    // ========================================================================
    // Mullard/Philips
    // ========================================================================
    {
      id: "mullard-philips",
      name: "Mullard/Philips",
      country: "Netherlands/UK",
      founded: 1891,
      headquarters: "Amsterdam, Netherlands",
      chips: [
        {
          id: "saa5050",
          partNumber: "SAA5050",
          type: "Teletext Character Generator",
          year: 1980,
          glyph: { width: 5, height: 9 },
          glyphCount: 96,
          internalFont: true,
          output: "RGB",
          binaryFormat: { padding: "left", bitOrder: "lsb" },
          usedIn: ["BBC Micro", "Philips P2000"],
          variants: {
            SAA5050: "UK",
            SAA5051: "German",
            SAA5052: "Swedish",
            SAA5053: "Italian",
            SAA5054: "Belgian",
            SAA5055: "US ASCII",
            SAA5056: "Hebrew",
            SAA5057: "Cyrillic",
          },
          notes: "Teletext standard IC. Internal 5x9 font interpolated to 10x18. Supports double-height, flashing, block graphics.",
          funFacts: [
            "The SAA5050 series was designed for the European Teletext broadcast standard",
            "It could interpolate its 5x9 font to 10x18 for smooth display on TVs",
          ],
        },
      ],
    },

    // ========================================================================
    // Signetics
    // ========================================================================
    {
      id: "signetics",
      name: "Signetics",
      country: "USA",
      founded: 1961,
      headquarters: "Sunnyvale, California",
      notes: "Acquired by Philips in 1975",
      funFacts: [
        "Signetics was one of the first companies to manufacture integrated circuits",
        "The 2513 character generator became an industry standard",
      ],
      chips: [
        {
          id: "signetics-2513",
          partNumber: "2513",
          type: "Mask ROM",
          year: 1971,
          capacity: { bits: 2560 },
          organization: "64x8x5",
          output: "5-bit parallel",
          glyph: { width: 5, height: 7 },
          glyphCount: 64,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          usedIn: ["Apple I", "Apple II", "Apple II Plus"],
          variants: {
            "2513-CM": "Uppercase (General Instrument RO-3-2513)",
            "2513-CN": "Lowercase",
            "2513-4": "Greek",
          },
          notes: "Industry standard character generator of the 1970s. One of the earliest chargen ROMs.",
          funFacts: [
            "The Signetics 2513 was the industry standard character generator of the 1970s",
            "Steve Wozniak chose it for the Apple II due to its low cost and availability",
          ],
        },
      ],
    },

    // ========================================================================
    // Sinclair (embedded ROM)
    // ========================================================================
    {
      id: "sinclair-chips",
      name: "Sinclair Research Ltd",
      country: "UK",
      founded: 1961,
      headquarters: "Cambridge, England",
      chips: [
        {
          id: "sinclair-spectrum-rom",
          partNumber: "Spectrum ROM",
          type: "System ROM (embedded font)",
          year: 1982,
          capacity: { bytes: 768 },
          organization: "96x8x8",
          glyph: { width: 8, height: 8 },
          glyphCount: 96,
          internalFont: true,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          usedIn: ["ZX Spectrum", "ZX Spectrum 128", "ZX Spectrum +2", "ZX Spectrum +3"],
          notes: "Font at $3D00-$3FFF in 16KB ROM. 768 bytes (96 chars x 8 bytes). Supports 21 UDGs.",
          funFacts: [
            "The Spectrum font was designed to be highly legible on 1980s TVs",
            "User-Defined Graphics (UDGs) allowed programmers to create custom characters",
          ],
        },
      ],
    },

    // ========================================================================
    // Tandy (custom ASICs)
    // ========================================================================
    {
      id: "tandy-chips",
      name: "Tandy Corporation",
      country: "USA",
      founded: 1963,
      headquarters: "Fort Worth, Texas",
      chips: [
        {
          id: "gime",
          partNumber: "GIME",
          type: "Custom Video Controller (ASIC)",
          year: 1986,
          glyph: { width: 8, height: 8 },
          glyphCount: 256,
          internalFont: false,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          usedIn: ["Tandy Color Computer 3"],
          notes: "Graphics Interrupt Memory Enhancement. Replaces MC6847 VDG and MC6883 SAM. Supports 40/80 column text, 640x225 graphics, 64-color palette, software-definable fonts.",
          funFacts: [
            "The GIME was designed by Tandy to dramatically upgrade the CoCo 3's capabilities",
            "It combined the functions of multiple chips into one custom ASIC",
          ],
        },
      ],
    },

    // ========================================================================
    // Texas Instruments
    // ========================================================================
    {
      id: "texas-instruments-chips",
      name: "Texas Instruments",
      country: "USA",
      founded: 1951,
      headquarters: "Dallas, Texas",
      funFacts: [
        "TI invented the integrated circuit (microchip) in 1958",
        "Jack Kilby of TI won the Nobel Prize in Physics for the integrated circuit invention",
      ],
      chips: [
        {
          id: "tms9918",
          partNumber: "TMS9918A",
          type: "Video Display Processor (VDP)",
          year: 1979,
          glyph: { width: 8, height: 8 },
          glyphCount: 256,
          internalFont: false,
          binaryFormat: { padding: "right", bitOrder: "msb" },
          usedIn: ["TI-99/4A", "ColecoVision", "Coleco Adam", "MSX", "Sega SG-1000", "Sega SC-3000"],
          variants: {
            TMS9918: "Original NTSC",
            TMS9918A: "Enhanced NTSC",
            TMS9928A: "Y/R-Y/B-Y component output",
            TMS9929A: "PAL version",
          },
          successors: ["V9938 (MSX2)", "V9958 (MSX2+)"],
          notes: "No internal font; all 256 patterns in 16KB VRAM. 32 sprites, multiple graphics modes.",
          funFacts: [
            "The TMS9918 was TI's answer to custom video chips like those in the Atari 2600",
            "It could display 32 sprites simultaneously, which was impressive for 1979",
          ],
        },
      ],
    },
  ],
};
