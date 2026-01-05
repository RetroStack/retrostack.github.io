/**
 * Character ROM Editor - Manufacturers and Systems Constants
 *
 * Central data source for all hardware manufacturers, systems, and their specifications.
 * All other data structures are derived from the unified SYSTEMS array.
 */

/**
 * Character ROM specifications for a system
 */
export interface CharacterRomSpec {
  /** Character width in pixels */
  width: number;
  /** Character height in pixels */
  height: number;
  /** Default number of characters in the ROM */
  characterCount: number;
}

/**
 * Complete system information including optional hardware specifications.
 * This is the central data structure - extend it to add new system capabilities.
 */
export interface SystemInfo {
  /** System name (e.g., "C64", "ZX Spectrum") */
  system: string;
  /** Hardware manufacturer (e.g., "Commodore", "Sinclair") */
  manufacturer: string;
  /** Character ROM specifications (if the system has a character ROM) */
  characterRom?: CharacterRomSpec;
  // Future extensions can be added here:
  // graphics?: GraphicsSpec;
  // audio?: AudioSpec;
  // cpu?: CpuSpec;
}

/**
 * Central data source for all systems and their specifications.
 *
 * Systems with `characterRom` defined are shown in ROM preset dropdowns.
 * Systems without `characterRom` are only shown in manufacturer/system selection dropdowns.
 *
 * To add a new system:
 * 1. Add an entry to this array with the system name and manufacturer
 * 2. If it has a character ROM, add the `characterRom` spec
 * 3. All derived constants and dropdowns will update automatically
 */
export const SYSTEMS: SystemInfo[] = [
  // =========================================================================
  // Commodore
  // =========================================================================
  {
    system: "C64",
    manufacturer: "Commodore",
    characterRom: { width: 8, height: 8, characterCount: 256 },
  },
  {
    system: "VIC-20",
    manufacturer: "Commodore",
    characterRom: { width: 8, height: 8, characterCount: 256 },
  },
  {
    system: "PET",
    manufacturer: "Commodore",
    characterRom: { width: 8, height: 8, characterCount: 256 },
  },
  { system: "C128", manufacturer: "Commodore" },
  { system: "Plus/4", manufacturer: "Commodore" },
  { system: "C16", manufacturer: "Commodore" },
  { system: "Amiga", manufacturer: "Commodore" },

  // =========================================================================
  // Apple
  // =========================================================================
  {
    system: "Apple II",
    manufacturer: "Apple",
    characterRom: { width: 8, height: 8, characterCount: 256 },
  },
  { system: "Apple IIe", manufacturer: "Apple" },
  { system: "Apple IIc", manufacturer: "Apple" },
  { system: "Apple IIgs", manufacturer: "Apple" },
  { system: "Apple III", manufacturer: "Apple" },

  // =========================================================================
  // Sinclair
  // =========================================================================
  {
    system: "ZX80",
    manufacturer: "Sinclair",
    characterRom: { width: 8, height: 8, characterCount: 64 },
  },
  {
    system: "ZX81",
    manufacturer: "Sinclair",
    characterRom: { width: 8, height: 8, characterCount: 64 },
  },
  {
    system: "ZX Spectrum",
    manufacturer: "Sinclair",
    characterRom: { width: 8, height: 8, characterCount: 96 },
  },
  { system: "QL", manufacturer: "Sinclair" },

  // =========================================================================
  // Atari
  // =========================================================================
  {
    system: "Atari 400/800",
    manufacturer: "Atari",
    characterRom: { width: 8, height: 8, characterCount: 128 },
  },
  { system: "Atari ST", manufacturer: "Atari" },
  { system: "Atari 2600", manufacturer: "Atari" },
  { system: "Atari 7800", manufacturer: "Atari" },
  { system: "Atari Lynx", manufacturer: "Atari" },

  // =========================================================================
  // IBM PC
  // =========================================================================
  {
    system: "PC CGA",
    manufacturer: "IBM",
    characterRom: { width: 8, height: 8, characterCount: 256 },
  },
  {
    system: "PC EGA",
    manufacturer: "IBM",
    characterRom: { width: 8, height: 14, characterCount: 256 },
  },
  {
    system: "PC VGA",
    manufacturer: "IBM",
    characterRom: { width: 8, height: 16, characterCount: 256 },
  },
  { system: "PC MDA", manufacturer: "IBM" },
  { system: "PC Hercules", manufacturer: "IBM" },

  // =========================================================================
  // Nintendo
  // =========================================================================
  {
    system: "NES/Famicom",
    manufacturer: "Nintendo",
    characterRom: { width: 8, height: 8, characterCount: 512 },
  },
  { system: "SNES", manufacturer: "Nintendo" },
  { system: "Game Boy", manufacturer: "Nintendo" },
  { system: "Game Boy Color", manufacturer: "Nintendo" },
  { system: "Game Boy Advance", manufacturer: "Nintendo" },

  // =========================================================================
  // Sega
  // =========================================================================
  { system: "Master System", manufacturer: "Sega" },
  { system: "Genesis/Mega Drive", manufacturer: "Sega" },
  { system: "Game Gear", manufacturer: "Sega" },
  { system: "Saturn", manufacturer: "Sega" },

  // =========================================================================
  // Amstrad
  // =========================================================================
  {
    system: "CPC 464",
    manufacturer: "Amstrad",
    characterRom: { width: 8, height: 8, characterCount: 256 },
  },
  {
    system: "CPC 6128",
    manufacturer: "Amstrad",
    characterRom: { width: 8, height: 8, characterCount: 256 },
  },
  { system: "CPC 664", manufacturer: "Amstrad" },
  { system: "PCW", manufacturer: "Amstrad" },

  // =========================================================================
  // Texas Instruments
  // =========================================================================
  {
    system: "TI-99/4A",
    manufacturer: "Texas Instruments",
    characterRom: { width: 8, height: 8, characterCount: 256 },
  },

  // =========================================================================
  // Tandy
  // =========================================================================
  {
    system: "TRS-80 Model I",
    manufacturer: "Tandy",
    characterRom: { width: 8, height: 8, characterCount: 128 },
  },
  { system: "TRS-80 Model III", manufacturer: "Tandy" },
  { system: "TRS-80 Color Computer", manufacturer: "Tandy" },
  { system: "TRS-80 Model 4", manufacturer: "Tandy" },

  // =========================================================================
  // MSX
  // =========================================================================
  {
    system: "MSX",
    manufacturer: "MSX",
    characterRom: { width: 8, height: 8, characterCount: 256 },
  },
  { system: "MSX2", manufacturer: "MSX" },
  { system: "MSX2+", manufacturer: "MSX" },
  { system: "MSX turbo R", manufacturer: "MSX" },

  // =========================================================================
  // Acorn
  // =========================================================================
  {
    system: "BBC Micro",
    manufacturer: "Acorn",
    characterRom: { width: 8, height: 8, characterCount: 256 },
  },
  { system: "Electron", manufacturer: "Acorn" },
  { system: "Archimedes", manufacturer: "Acorn" },

  // =========================================================================
  // Coleco
  // =========================================================================
  { system: "ColecoVision", manufacturer: "Coleco" },
  { system: "Adam", manufacturer: "Coleco" },

  // =========================================================================
  // Mattel
  // =========================================================================
  { system: "Intellivision", manufacturer: "Mattel" },

  // =========================================================================
  // NEC
  // =========================================================================
  { system: "PC Engine/TurboGrafx-16", manufacturer: "NEC" },
  { system: "PC-8801", manufacturer: "NEC" },
  { system: "PC-9801", manufacturer: "NEC" },

  // =========================================================================
  // Sharp
  // =========================================================================
  { system: "MZ-80", manufacturer: "Sharp" },
  { system: "X1", manufacturer: "Sharp" },
  { system: "X68000", manufacturer: "Sharp" },
];

// ============================================================================
// Derived types (for backwards compatibility with existing components)
// ============================================================================

/**
 * Manufacturer and associated systems
 */
export interface ManufacturerSystems {
  /** Hardware manufacturer name */
  manufacturer: string;
  /** List of systems from this manufacturer */
  systems: string[];
}

/**
 * System-specific dimension preset (flattened for dropdown compatibility)
 */
export interface SystemDimensionPreset {
  /** System name */
  system: string;
  /** Hardware manufacturer */
  manufacturer: string;
  /** Character width in pixels */
  width: number;
  /** Character height in pixels */
  height: number;
}

/**
 * System-specific character count preset (flattened for dropdown compatibility)
 */
export interface SystemCharacterCountPreset {
  /** System name */
  system: string;
  /** Hardware manufacturer */
  manufacturer: string;
  /** Number of characters */
  count: number;
}

// ============================================================================
// Derived constants (computed from SYSTEMS)
// ============================================================================

/**
 * Known manufacturers and their systems (derived from SYSTEMS)
 */
export const KNOWN_MANUFACTURERS: ManufacturerSystems[] = (() => {
  const grouped = new Map<string, string[]>();
  for (const sys of SYSTEMS) {
    if (!grouped.has(sys.manufacturer)) {
      grouped.set(sys.manufacturer, []);
    }
    grouped.get(sys.manufacturer)!.push(sys.system);
  }
  return Array.from(grouped.entries()).map(([manufacturer, systems]) => ({
    manufacturer,
    systems,
  }));
})();

/**
 * Systems with character ROM specs (derived from SYSTEMS)
 */
const SYSTEMS_WITH_CHARACTER_ROM = SYSTEMS.filter(
  (sys): sys is SystemInfo & { characterRom: CharacterRomSpec } =>
    sys.characterRom !== undefined
);

/**
 * System dimension presets for dropdowns (derived from SYSTEMS with characterRom)
 */
export const SYSTEM_PRESETS: SystemDimensionPreset[] = SYSTEMS_WITH_CHARACTER_ROM.map(
  (sys) => ({
    system: sys.system,
    manufacturer: sys.manufacturer,
    width: sys.characterRom.width,
    height: sys.characterRom.height,
  })
);

/**
 * System character count presets for dropdowns (derived from SYSTEMS with characterRom)
 */
export const SYSTEM_CHARACTER_COUNT_PRESETS: SystemCharacterCountPreset[] =
  SYSTEMS_WITH_CHARACTER_ROM.map((sys) => ({
    system: sys.system,
    manufacturer: sys.manufacturer,
    count: sys.characterRom.characterCount,
  }));

// ============================================================================
// Standard format presets (not system-specific, for "Standard Formats" sections)
// ============================================================================

/**
 * Dimension presets based on common character ROM formats
 */
export interface DimensionPreset {
  /** Preset name */
  name: string;
  /** Character width in pixels */
  width: number;
  /** Character height in pixels */
  height: number;
  /** Systems that commonly use this format */
  systems: string[];
}

/**
 * Helper to get systems matching specific character ROM dimensions
 */
function getSystemsWithDimensions(width: number, height: number): string[] {
  return SYSTEMS_WITH_CHARACTER_ROM
    .filter((s) => s.characterRom.width === width && s.characterRom.height === height)
    .map((s) => s.system);
}

/**
 * Helper to get systems matching a specific character count
 */
function getSystemsWithCharacterCount(count: number): string[] {
  return SYSTEMS_WITH_CHARACTER_ROM
    .filter((s) => s.characterRom.characterCount === count)
    .map((s) => s.system);
}

/**
 * Standard dimension presets (format-based, shown in "Standard Formats" dropdown section)
 */
export const DIMENSION_PRESETS: DimensionPreset[] = [
  {
    name: "8x8 (Standard)",
    width: 8,
    height: 8,
    systems: getSystemsWithDimensions(8, 8),
  },
  {
    name: "8x16 (Extended)",
    width: 8,
    height: 16,
    systems: getSystemsWithDimensions(8, 16),
  },
  {
    name: "8x14 (VGA Text)",
    width: 8,
    height: 14,
    systems: getSystemsWithDimensions(8, 14),
  },
  {
    name: "8x10 (Apple II Lores)",
    width: 8,
    height: 10,
    systems: ["Apple II"],
  },
  {
    name: "5x7 (LED Matrix)",
    width: 5,
    height: 7,
    systems: ["LED Displays", "Dot Matrix"],
  },
  {
    name: "6x8 (C64 Hires)",
    width: 6,
    height: 8,
    systems: ["C64"],
  },
  {
    name: "4x8 (VIC-20 Multicolor)",
    width: 4,
    height: 8,
    systems: ["VIC-20"],
  },
];

/**
 * Character count preset based on common ROM sizes
 */
export interface CharacterCountPreset {
  /** Preset name */
  name: string;
  /** Number of characters */
  count: number;
  /** Systems that commonly use this count */
  systems: string[];
}

/**
 * Standard character count presets (format-based, shown in "Standard Counts" dropdown section)
 */
export const CHARACTER_COUNT_PRESETS: CharacterCountPreset[] = [
  {
    name: "64 (Quarter ROM)",
    count: 64,
    systems: getSystemsWithCharacterCount(64),
  },
  {
    name: "96 (ZX Spectrum)",
    count: 96,
    systems: getSystemsWithCharacterCount(96),
  },
  {
    name: "128 (Half ROM)",
    count: 128,
    systems: getSystemsWithCharacterCount(128),
  },
  {
    name: "256 (Full Set)",
    count: 256,
    systems: getSystemsWithCharacterCount(256),
  },
  {
    name: "512 (Extended)",
    count: 512,
    systems: getSystemsWithCharacterCount(512),
  },
];

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Get all unique manufacturer names
 */
export function getAllManufacturers(): string[] {
  return KNOWN_MANUFACTURERS.map((m) => m.manufacturer);
}

/**
 * Get systems for a specific manufacturer
 */
export function getSystemsForManufacturer(manufacturer: string): string[] {
  const found = KNOWN_MANUFACTURERS.find(
    (m) => m.manufacturer.toLowerCase() === manufacturer.toLowerCase()
  );
  return found?.systems || [];
}

/**
 * Get all unique systems across all manufacturers
 */
export function getAllSystems(): string[] {
  return SYSTEMS.map((s) => s.system).sort();
}

/**
 * Check if a manufacturer exists in the known list
 */
export function isKnownManufacturer(manufacturer: string): boolean {
  return KNOWN_MANUFACTURERS.some(
    (m) => m.manufacturer.toLowerCase() === manufacturer.toLowerCase()
  );
}

/**
 * Check if a system exists for a specific manufacturer
 */
export function isKnownSystem(manufacturer: string, system: string): boolean {
  const systems = getSystemsForManufacturer(manufacturer);
  return systems.some((s) => s.toLowerCase() === system.toLowerCase());
}

/**
 * Get dimension presets for a specific system
 */
export function getPresetsForSystem(system: string): DimensionPreset[] {
  return DIMENSION_PRESETS.filter((p) =>
    p.systems.some((s) => s.toLowerCase().includes(system.toLowerCase()))
  );
}

/**
 * Find a preset by dimensions
 */
export function findPresetByDimensions(
  width: number,
  height: number
): DimensionPreset | undefined {
  return DIMENSION_PRESETS.find((p) => p.width === width && p.height === height);
}

/**
 * Get system dimension presets grouped by manufacturer
 */
export function getSystemPresetsByManufacturer(): Record<string, SystemDimensionPreset[]> {
  const grouped: Record<string, SystemDimensionPreset[]> = {};
  for (const preset of SYSTEM_PRESETS) {
    if (!grouped[preset.manufacturer]) {
      grouped[preset.manufacturer] = [];
    }
    grouped[preset.manufacturer].push(preset);
  }
  return grouped;
}

/**
 * Get system character count presets grouped by manufacturer
 */
export function getSystemCharacterCountPresetsByManufacturer(): Record<string, SystemCharacterCountPreset[]> {
  const grouped: Record<string, SystemCharacterCountPreset[]> = {};
  for (const preset of SYSTEM_CHARACTER_COUNT_PRESETS) {
    if (!grouped[preset.manufacturer]) {
      grouped[preset.manufacturer] = [];
    }
    grouped[preset.manufacturer].push(preset);
  }
  return grouped;
}

/**
 * Get full system info by system name
 */
export function getSystemInfo(system: string): SystemInfo | undefined {
  return SYSTEMS.find((s) => s.system.toLowerCase() === system.toLowerCase());
}

/**
 * Get all systems that have character ROM specifications defined
 */
export function getSystemsWithRomPresets(): SystemInfo[] {
  return SYSTEMS_WITH_CHARACTER_ROM;
}
