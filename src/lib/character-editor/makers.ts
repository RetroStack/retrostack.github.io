/**
 * Character ROM Editor - Makers and Systems Constants
 *
 * Defines known hardware manufacturers and their systems for character set categorization.
 */

/**
 * Maker and associated systems
 */
export interface MakerSystems {
  /** Hardware manufacturer name */
  maker: string;
  /** List of systems from this manufacturer */
  systems: string[];
}

/**
 * Known makers and their systems
 * Used for dropdown suggestions in the import wizard and filters
 */
export const KNOWN_MAKERS: MakerSystems[] = [
  {
    maker: "Commodore",
    systems: ["C64", "VIC-20", "C128", "PET", "Plus/4", "C16", "Amiga"],
  },
  {
    maker: "Apple",
    systems: ["Apple II", "Apple IIe", "Apple IIc", "Apple IIgs", "Apple III"],
  },
  {
    maker: "Sinclair",
    systems: ["ZX Spectrum", "ZX81", "ZX80", "QL"],
  },
  {
    maker: "Atari",
    systems: ["Atari 400/800", "Atari ST", "Atari 2600", "Atari 7800", "Atari Lynx"],
  },
  {
    maker: "IBM",
    systems: ["PC CGA", "PC EGA", "PC VGA", "PC MDA", "PC Hercules"],
  },
  {
    maker: "Nintendo",
    systems: ["NES/Famicom", "SNES", "Game Boy", "Game Boy Color", "Game Boy Advance"],
  },
  {
    maker: "Sega",
    systems: ["Master System", "Genesis/Mega Drive", "Game Gear", "Saturn"],
  },
  {
    maker: "Amstrad",
    systems: ["CPC 464", "CPC 6128", "CPC 664", "PCW"],
  },
  {
    maker: "Texas Instruments",
    systems: ["TI-99/4A"],
  },
  {
    maker: "Tandy",
    systems: ["TRS-80 Model I", "TRS-80 Model III", "TRS-80 Color Computer", "TRS-80 Model 4"],
  },
  {
    maker: "MSX",
    systems: ["MSX", "MSX2", "MSX2+", "MSX turbo R"],
  },
  {
    maker: "Acorn",
    systems: ["BBC Micro", "Electron", "Archimedes"],
  },
  {
    maker: "Coleco",
    systems: ["ColecoVision", "Adam"],
  },
  {
    maker: "Mattel",
    systems: ["Intellivision"],
  },
  {
    maker: "NEC",
    systems: ["PC Engine/TurboGrafx-16", "PC-8801", "PC-9801"],
  },
  {
    maker: "Sharp",
    systems: ["MZ-80", "X1", "X68000"],
  },
];

/**
 * Get all unique maker names
 */
export function getAllMakers(): string[] {
  return KNOWN_MAKERS.map((m) => m.maker);
}

/**
 * Get systems for a specific maker
 * @param maker - The maker name
 * @returns Array of system names, or empty array if maker not found
 */
export function getSystemsForMaker(maker: string): string[] {
  const found = KNOWN_MAKERS.find(
    (m) => m.maker.toLowerCase() === maker.toLowerCase()
  );
  return found?.systems || [];
}

/**
 * Get all unique systems across all makers
 */
export function getAllSystems(): string[] {
  const systems = new Set<string>();
  KNOWN_MAKERS.forEach((m) => {
    m.systems.forEach((s) => systems.add(s));
  });
  return Array.from(systems).sort();
}

/**
 * Check if a maker exists in the known list
 */
export function isKnownMaker(maker: string): boolean {
  return KNOWN_MAKERS.some(
    (m) => m.maker.toLowerCase() === maker.toLowerCase()
  );
}

/**
 * Check if a system exists for a specific maker
 */
export function isKnownSystem(maker: string, system: string): boolean {
  const systems = getSystemsForMaker(maker);
  return systems.some((s) => s.toLowerCase() === system.toLowerCase());
}

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

export const DIMENSION_PRESETS: DimensionPreset[] = [
  {
    name: "8x8 (Standard)",
    width: 8,
    height: 8,
    systems: ["C64", "VIC-20", "ZX Spectrum", "ZX81", "ZX80", "Atari 400/800", "NES/Famicom", "Apple II", "Amstrad CPC"],
  },
  {
    name: "8x16 (Extended)",
    width: 8,
    height: 16,
    systems: ["PC CGA", "PC EGA", "PC VGA", "Amstrad CPC"],
  },
  {
    name: "8x14 (VGA Text)",
    width: 8,
    height: 14,
    systems: ["PC VGA"],
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
 * System-specific dimension preset
 * Used for organizing presets by system in dropdowns
 */
export interface SystemDimensionPreset {
  /** System name */
  system: string;
  /** Hardware manufacturer */
  maker: string;
  /** Character width in pixels */
  width: number;
  /** Character height in pixels */
  height: number;
}

/**
 * System-organized presets for 8-bit classics
 * Used in SizePresetDropdown for quick system-based selection
 */
export const SYSTEM_PRESETS: SystemDimensionPreset[] = [
  { system: "C64", maker: "Commodore", width: 8, height: 8 },
  { system: "VIC-20", maker: "Commodore", width: 8, height: 8 },
  { system: "ZX80", maker: "Sinclair", width: 8, height: 8 },
  { system: "ZX81", maker: "Sinclair", width: 8, height: 8 },
  { system: "ZX Spectrum", maker: "Sinclair", width: 8, height: 8 },
  { system: "Apple II", maker: "Apple", width: 8, height: 8 },
  { system: "Atari 400/800", maker: "Atari", width: 8, height: 8 },
  { system: "NES/Famicom", maker: "Nintendo", width: 8, height: 8 },
  { system: "CPC 464", maker: "Amstrad", width: 8, height: 16 },
  { system: "CPC 6128", maker: "Amstrad", width: 8, height: 16 },
  { system: "BBC Micro", maker: "Acorn", width: 8, height: 8 },
  { system: "TRS-80 Model I", maker: "Tandy", width: 8, height: 8 },
  { system: "MSX", maker: "MSX", width: 8, height: 8 },
  { system: "TI-99/4A", maker: "Texas Instruments", width: 8, height: 8 },
];

/**
 * Get system presets grouped by maker
 */
export function getSystemPresetsByMaker(): Record<string, SystemDimensionPreset[]> {
  const grouped: Record<string, SystemDimensionPreset[]> = {};
  for (const preset of SYSTEM_PRESETS) {
    if (!grouped[preset.maker]) {
      grouped[preset.maker] = [];
    }
    grouped[preset.maker].push(preset);
  }
  return grouped;
}
