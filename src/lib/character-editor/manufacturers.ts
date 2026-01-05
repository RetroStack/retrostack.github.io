/**
 * Character ROM Editor - Manufacturers and Systems Constants
 *
 * Defines known hardware manufacturers and their systems for character set categorization.
 */

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
 * Known manufacturers and their systems
 * Used for dropdown suggestions in the import wizard and filters
 */
export const KNOWN_MANUFACTURERS: ManufacturerSystems[] = [
  {
    manufacturer: "Commodore",
    systems: ["C64", "VIC-20", "C128", "PET", "Plus/4", "C16", "Amiga"],
  },
  {
    manufacturer: "Apple",
    systems: ["Apple II", "Apple IIe", "Apple IIc", "Apple IIgs", "Apple III"],
  },
  {
    manufacturer: "Sinclair",
    systems: ["ZX Spectrum", "ZX81", "ZX80", "QL"],
  },
  {
    manufacturer: "Atari",
    systems: ["Atari 400/800", "Atari ST", "Atari 2600", "Atari 7800", "Atari Lynx"],
  },
  {
    manufacturer: "IBM",
    systems: ["PC CGA", "PC EGA", "PC VGA", "PC MDA", "PC Hercules"],
  },
  {
    manufacturer: "Nintendo",
    systems: ["NES/Famicom", "SNES", "Game Boy", "Game Boy Color", "Game Boy Advance"],
  },
  {
    manufacturer: "Sega",
    systems: ["Master System", "Genesis/Mega Drive", "Game Gear", "Saturn"],
  },
  {
    manufacturer: "Amstrad",
    systems: ["CPC 464", "CPC 6128", "CPC 664", "PCW"],
  },
  {
    manufacturer: "Texas Instruments",
    systems: ["TI-99/4A"],
  },
  {
    manufacturer: "Tandy",
    systems: ["TRS-80 Model I", "TRS-80 Model III", "TRS-80 Color Computer", "TRS-80 Model 4"],
  },
  {
    manufacturer: "MSX",
    systems: ["MSX", "MSX2", "MSX2+", "MSX turbo R"],
  },
  {
    manufacturer: "Acorn",
    systems: ["BBC Micro", "Electron", "Archimedes"],
  },
  {
    manufacturer: "Coleco",
    systems: ["ColecoVision", "Adam"],
  },
  {
    manufacturer: "Mattel",
    systems: ["Intellivision"],
  },
  {
    manufacturer: "NEC",
    systems: ["PC Engine/TurboGrafx-16", "PC-8801", "PC-9801"],
  },
  {
    manufacturer: "Sharp",
    systems: ["MZ-80", "X1", "X68000"],
  },
];

/**
 * Get all unique manufacturer names
 */
export function getAllManufacturers(): string[] {
  return KNOWN_MANUFACTURERS.map((m) => m.manufacturer);
}

/**
 * Get systems for a specific manufacturer
 * @param manufacturer - The manufacturer name
 * @returns Array of system names, or empty array if manufacturer not found
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
  const systems = new Set<string>();
  KNOWN_MANUFACTURERS.forEach((m) => {
    m.systems.forEach((s) => systems.add(s));
  });
  return Array.from(systems).sort();
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
  manufacturer: string;
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
  { system: "C64", manufacturer: "Commodore", width: 8, height: 8 },
  { system: "VIC-20", manufacturer: "Commodore", width: 8, height: 8 },
  { system: "ZX80", manufacturer: "Sinclair", width: 8, height: 8 },
  { system: "ZX81", manufacturer: "Sinclair", width: 8, height: 8 },
  { system: "ZX Spectrum", manufacturer: "Sinclair", width: 8, height: 8 },
  { system: "Apple II", manufacturer: "Apple", width: 8, height: 8 },
  { system: "Atari 400/800", manufacturer: "Atari", width: 8, height: 8 },
  { system: "NES/Famicom", manufacturer: "Nintendo", width: 8, height: 8 },
  { system: "CPC 464", manufacturer: "Amstrad", width: 8, height: 16 },
  { system: "CPC 6128", manufacturer: "Amstrad", width: 8, height: 16 },
  { system: "BBC Micro", manufacturer: "Acorn", width: 8, height: 8 },
  { system: "TRS-80 Model I", manufacturer: "Tandy", width: 8, height: 8 },
  { system: "MSX", manufacturer: "MSX", width: 8, height: 8 },
  { system: "TI-99/4A", manufacturer: "Texas Instruments", width: 8, height: 8 },
];

/**
 * Get system presets grouped by manufacturer
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
