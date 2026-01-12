/**
 * Unified Systems Data - Central Source of Truth
 *
 * This file is the single source of truth for all system/manufacturer data.
 * Import from this file, NOT from systemsData.ts.
 *
 * Features:
 * - Inheritance resolution: Chips define binary format defaults, systems can override
 * - Derived presets: BINARY_EXPORT_SYSTEM_PRESETS computed from systems
 * - Flat arrays for easy iteration
 * - Lookup maps for fast access by ID
 */

import type { PaddingDirection, BitDirection, ByteOrder } from "../types";

import {
  DATA,
  type SystemsData,
  type ComputerManufacturer,
  type ChipManufacturer,
  type ManufacturerInfo,
  type SystemInfo,
  type ChipInfo,
  type BinaryFormat,
  type BitOrder,
  type CpuSpec,
  type MemorySpec,
  type DisplaySpec,
  type CharacterDimensions,
  type CharacterSetSpec,
  type CharacterGeneratorSpec,
  type VideoHardwareSpec,
  type PriceSpec,
  type CharacterRomSpec,
  type CharacterRomDirect,
  type CharacterRomReference,
  type TextModeSpec,
  type GraphicsModeSpec,
  type SpriteSpec,
} from "./systemsData";

// ============================================================================
// Re-export Types
// ============================================================================

export type {
  SystemsData,
  ComputerManufacturer,
  ChipManufacturer,
  ManufacturerInfo,
  SystemInfo,
  ChipInfo,
  BinaryFormat,
  BitOrder,
  CpuSpec,
  MemorySpec,
  DisplaySpec,
  CharacterDimensions,
  CharacterSetSpec,
  CharacterGeneratorSpec,
  VideoHardwareSpec,
  PriceSpec,
  CharacterRomSpec,
  CharacterRomDirect,
  CharacterRomReference,
  TextModeSpec,
  GraphicsModeSpec,
  SpriteSpec,
};

// ============================================================================
// CharacterRom Type Guards and Helpers
// ============================================================================

/**
 * Check if a CharacterRomSpec is a direct definition (has width/height/characterCount)
 */
export function isCharacterRomDirect(spec: CharacterRomSpec | undefined): spec is CharacterRomDirect {
  if (!spec) return false;
  return "width" in spec && "height" in spec && "characterCount" in spec;
}

/**
 * Check if a CharacterRomSpec is a reference to a chip
 */
export function isCharacterRomReference(spec: CharacterRomSpec | undefined): spec is CharacterRomReference {
  if (!spec) return false;
  return "id" in spec || "ids" in spec;
}

/**
 * Get the chip ID(s) from a CharacterRomSpec reference
 */
export function getCharacterRomChipIds(spec: CharacterRomSpec | undefined): string[] {
  if (!spec || !isCharacterRomReference(spec)) return [];
  if ("id" in spec && spec.id) return [spec.id];
  if ("ids" in spec && spec.ids) return spec.ids;
  return [];
}

// ============================================================================
// Flattened Arrays (for easy iteration)
// ============================================================================

/** All computer manufacturers */
export const COMPUTER_MANUFACTURERS: ComputerManufacturer[] = DATA.computerManufacturers;

/** All chip manufacturers */
export const CHIP_MANUFACTURERS: ChipManufacturer[] = DATA.chipManufacturers;

/** All systems (flattened from all manufacturers) */
export const SYSTEMS: SystemInfo[] = DATA.computerManufacturers.flatMap((m) => m.systems);

/** All chips (flattened from all chip manufacturers) */
export const CHIPS: ChipInfo[] = DATA.chipManufacturers.flatMap((m) => m.chips);

// ============================================================================
// Lookup Maps (for fast access by ID)
// ============================================================================

/** Map for fast system lookup by ID */
const systemById = new Map(SYSTEMS.map((s) => [s.id, s]));

/** Map for fast chip lookup by ID */
const chipById = new Map(CHIPS.map((c) => [c.id, c]));

/** Map for fast computer manufacturer lookup by ID */
const computerManufacturerById = new Map(COMPUTER_MANUFACTURERS.map((m) => [m.id, m]));

/** Map for fast chip manufacturer lookup by ID */
const chipManufacturerById = new Map(CHIP_MANUFACTURERS.map((m) => [m.id, m]));

// ============================================================================
// Lookup Functions
// ============================================================================

/**
 * Get system by ID
 */
export function getSystemById(id: string): SystemInfo | undefined {
  return systemById.get(id);
}

/**
 * Get system by name (case-insensitive)
 */
export function getSystemByName(name: string): SystemInfo | undefined {
  const lowerName = name.toLowerCase();
  return SYSTEMS.find(
    (s) => s.name.toLowerCase() === lowerName || s.alternateNames?.some((n) => n.toLowerCase() === lowerName),
  );
}

/**
 * Get chip by ID
 */
export function getChipById(id: string): ChipInfo | undefined {
  return chipById.get(id);
}

/**
 * Get computer manufacturer by ID
 */
export function getComputerManufacturerById(id: string): ComputerManufacturer | undefined {
  return computerManufacturerById.get(id);
}

/**
 * Get chip manufacturer by ID
 */
export function getChipManufacturerById(id: string): ChipManufacturer | undefined {
  return chipManufacturerById.get(id);
}

/**
 * Get the manufacturer for a system
 */
export function getManufacturerForSystem(system: SystemInfo): ComputerManufacturer | undefined {
  return COMPUTER_MANUFACTURERS.find((m) => m.systems.some((s) => s.id === system.id));
}

/**
 * Get all chips used by a system (from characterRom reference)
 */
export function getChipsForSystem(system: SystemInfo): ChipInfo[] {
  const chips: ChipInfo[] = [];
  const chipIds = getCharacterRomChipIds(system.characterRom);

  for (const chipId of chipIds) {
    const chip = chipById.get(chipId);
    if (chip && !chips.includes(chip)) {
      chips.push(chip);
    }
  }

  return chips;
}

/**
 * Get all unique chip manufacturers
 */
export function getAllChipManufacturers(): string[] {
  const manufacturers = new Set(CHIPS.map((chip) => chip.partNumber));
  return Array.from(manufacturers).sort();
}

// ============================================================================
// Inheritance Resolution
// ============================================================================

/** Default binary format (right padding, MSB first - most common) */
const DEFAULT_BINARY_FORMAT: BinaryFormat = {
  padding: "right",
  bitOrder: "msb",
};

/**
 * Get the resolved binary format for a system.
 *
 * Resolution order:
 * 1. System's own binaryFormat (if defined) -> use it
 * 2. First chip's binaryFormat (from characterRom reference) -> inherit it
 * 3. Default fallback -> { padding: "right", bitOrder: "msb" }
 *
 * @param system - The system to get binary format for
 * @returns The resolved binary format
 */
export function getSystemBinaryFormat(system: SystemInfo): BinaryFormat {
  // 1. System override takes precedence
  if (system.binaryFormat) {
    return system.binaryFormat;
  }

  // 2. Inherit from first chip (via characterRom reference)
  const chipIds = getCharacterRomChipIds(system.characterRom);
  if (chipIds.length > 0) {
    const chip = chipById.get(chipIds[0]);
    if (chip?.binaryFormat) {
      return chip.binaryFormat;
    }
  }

  // 3. Default fallback
  return DEFAULT_BINARY_FORMAT;
}

/**
 * Get the source of the binary format (for debugging/display).
 * Returns system name if overridden, chip part number if inherited, or "default".
 *
 * @param system - The system to check
 * @returns The source of the binary format setting
 */
export function getBinaryFormatSource(system: SystemInfo): string {
  if (system.binaryFormat) {
    return system.name;
  }

  const chipIds = getCharacterRomChipIds(system.characterRom);
  if (chipIds.length > 0) {
    const chip = chipById.get(chipIds[0]);
    if (chip?.binaryFormat) {
      return chip.partNumber;
    }
  }

  return "default";
}

/**
 * Resolved character ROM dimensions.
 * This is the common format returned after resolving references.
 */
export interface ResolvedCharacterRom {
  /** Character width in pixels */
  width: number;
  /** Character height in pixels */
  height: number;
  /** Number of characters in the ROM */
  characterCount: number;
}

/**
 * Resolve a CharacterRomSpec to actual dimensions.
 * If the spec is a reference, looks up the chip to get dimensions.
 * If the spec is direct, returns the dimensions as-is.
 *
 * @param spec - The CharacterRomSpec to resolve
 * @returns The resolved dimensions, or undefined if not resolvable
 */
export function resolveCharacterRom(spec: CharacterRomSpec | undefined): ResolvedCharacterRom | undefined {
  if (!spec) return undefined;

  // Direct definition
  if (isCharacterRomDirect(spec)) {
    return {
      width: spec.width,
      height: spec.height,
      characterCount: spec.characterCount,
    };
  }

  // Reference - look up the chip
  const chipIds = getCharacterRomChipIds(spec);
  if (chipIds.length > 0) {
    const chip = chipById.get(chipIds[0]);
    if (chip) {
      return {
        width: chip.glyph.width,
        height: chip.glyph.height,
        characterCount: chip.glyphCount,
      };
    }
  }

  return undefined;
}

/**
 * Get resolved character ROM for a system.
 * Convenience function that calls resolveCharacterRom with the system's characterRom.
 */
export function getSystemCharacterRom(system: SystemInfo): ResolvedCharacterRom | undefined {
  return resolveCharacterRom(system.characterRom);
}

/**
 * Check if a system has a character ROM definition (either direct or reference).
 */
export function hasCharacterRom(system: SystemInfo): boolean {
  return resolveCharacterRom(system.characterRom) !== undefined;
}

/** Systems that have character ROM definitions (after resolving references) */
export const SYSTEMS_WITH_CHARACTER_ROM: SystemInfo[] = SYSTEMS.filter((s) => hasCharacterRom(s));

// ============================================================================
// Derived Data: Manufacturer Systems
// ============================================================================

/**
 * Manufacturer with their systems
 */
export interface ManufacturerSystems {
  /** Manufacturer name */
  name: string;
  /** Systems from this manufacturer */
  systems: string[];
}

/**
 * Known manufacturers with their systems (only those with character ROM).
 * Systems are sorted by release year (oldest first).
 */
export const KNOWN_MANUFACTURERS: ManufacturerSystems[] = COMPUTER_MANUFACTURERS.map((m) => ({
  name: m.name,
  systems: m.systems
    .filter((s) => hasCharacterRom(s))
    .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.name.localeCompare(b.name))
    .map((s) => s.name),
}))
  .filter((m) => m.systems.length > 0)
  .sort((a, b) => a.name.localeCompare(b.name));

// ============================================================================
// Derived Data: System Dimension Presets
// ============================================================================

/**
 * System dimension preset
 */
export interface SystemDimensionPreset {
  /** Manufacturer name */
  manufacturer: string;
  /** System name */
  system: string;
  /** Release year (for sorting) */
  year?: number;
  /** Character width in pixels */
  width: number;
  /** Character height in pixels */
  height: number;
  /** Display label (e.g., "8x8") */
  label: string;
}

/**
 * System presets for character dimensions.
 * Sorted by manufacturer name, then by release year (oldest first).
 */
export const SYSTEM_PRESETS: SystemDimensionPreset[] = COMPUTER_MANUFACTURERS.flatMap((m) =>
  m.systems
    .filter((s) => hasCharacterRom(s))
    .map((s) => {
      const resolved = getSystemCharacterRom(s)!;
      return {
        manufacturer: m.name,
        system: s.name,
        year: s.year,
        width: resolved.width,
        height: resolved.height,
        label: `${resolved.width}x${resolved.height}`,
      };
    }),
).sort((a, b) =>
  a.manufacturer.localeCompare(b.manufacturer) || (a.year ?? 9999) - (b.year ?? 9999) || a.system.localeCompare(b.system),
);

// ============================================================================
// Derived Data: System Character Count Presets
// ============================================================================

/**
 * System character count preset
 */
export interface SystemCharacterCountPreset {
  /** Manufacturer name */
  manufacturer: string;
  /** System name */
  system: string;
  /** Release year (for sorting) */
  year?: number;
  /** Number of characters */
  characterCount: number;
  /** Alias for characterCount (for backwards compatibility) */
  count: number;
  /** Display label */
  label: string;
}

/**
 * System presets for character counts.
 * Sorted by manufacturer name, then by release year (oldest first).
 */
export const SYSTEM_CHARACTER_COUNT_PRESETS: SystemCharacterCountPreset[] = COMPUTER_MANUFACTURERS.flatMap((m) =>
  m.systems
    .filter((s) => hasCharacterRom(s))
    .map((s) => {
      const resolved = getSystemCharacterRom(s)!;
      return {
        manufacturer: m.name,
        system: s.name,
        year: s.year,
        characterCount: resolved.characterCount,
        count: resolved.characterCount,
        label: String(resolved.characterCount),
      };
    }),
).sort((a, b) =>
  a.manufacturer.localeCompare(b.manufacturer) || (a.year ?? 9999) - (b.year ?? 9999) || a.system.localeCompare(b.system),
);

// ============================================================================
// Derived Data: Binary Export Presets
// ============================================================================

/**
 * Binary export system preset with padding and bit direction.
 */
export interface BinaryExportSystemPreset {
  /** Unique identifier */
  id: string;
  /** System name for display */
  name: string;
  /** Manufacturer name for grouping */
  manufacturer: string;
  /** Release year (for sorting) */
  year?: number;
  /** Bit padding direction */
  padding: PaddingDirection;
  /** Bit order within bytes (msb = leftmost pixel is bit 7, lsb = leftmost pixel is bit 0) */
  bitDirection: BitDirection;
  /** Byte order for multi-byte rows (width > 8). Defaults to "big". */
  byteOrder?: ByteOrder;
}

/**
 * Binary export manufacturer group
 */
export interface BinaryExportManufacturerGroup {
  /** Manufacturer name */
  manufacturer: string;
  /** Systems from this manufacturer */
  systems: BinaryExportSystemPreset[];
}

/**
 * Binary export system presets derived from systems with resolved inheritance.
 * Only includes systems that have character ROM definitions.
 * Sorted by manufacturer name, then by release year (oldest first).
 */
export const BINARY_EXPORT_SYSTEM_PRESETS: BinaryExportSystemPreset[] = COMPUTER_MANUFACTURERS.flatMap((m) =>
  m.systems
    .filter((s) => hasCharacterRom(s))
    .map((s) => {
      const format = getSystemBinaryFormat(s);
      return {
        id: s.id,
        name: s.name,
        manufacturer: m.name,
        year: s.year,
        padding: format.padding,
        bitDirection: format.bitOrder,
        byteOrder: format.byteOrder,
      };
    }),
).sort((a, b) =>
  a.manufacturer.localeCompare(b.manufacturer) || (a.year ?? 9999) - (b.year ?? 9999) || a.name.localeCompare(b.name),
);

/**
 * Get binary export presets grouped by manufacturer
 */
export function getBinaryExportPresetsByManufacturer(): BinaryExportManufacturerGroup[] {
  const groups = new Map<string, BinaryExportSystemPreset[]>();

  for (const preset of BINARY_EXPORT_SYSTEM_PRESETS) {
    if (!groups.has(preset.manufacturer)) {
      groups.set(preset.manufacturer, []);
    }
    groups.get(preset.manufacturer)!.push(preset);
  }

  return Array.from(groups.entries())
    .map(([manufacturer, systems]) => ({ manufacturer, systems }))
    .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer));
}

/**
 * Find binary export system preset by ID
 */
export function findBinaryExportSystemPreset(id: string): BinaryExportSystemPreset | undefined {
  return BINARY_EXPORT_SYSTEM_PRESETS.find((p) => p.id === id);
}

/**
 * Find system presets that match given padding and bit direction
 */
export function findMatchingBinaryExportPresets(
  padding: PaddingDirection,
  bitDirection: BitDirection,
): BinaryExportSystemPreset[] {
  return BINARY_EXPORT_SYSTEM_PRESETS.filter((p) => p.padding === padding && p.bitDirection === bitDirection);
}

// ============================================================================
// Derived Data: Chip Presets
// ============================================================================

/**
 * Chip dimension preset
 */
export interface ChipDimensionPreset {
  /** Chip ID */
  id: string;
  /** Part number */
  partNumber: string;
  /** Manufacturer */
  manufacturer: string;
  /** Glyph width */
  width: number;
  /** Glyph height */
  height: number;
  /** Display label (e.g., "8x8") */
  label: string;
  /** Systems that use this chip */
  usedIn: string[];
}

/**
 * Chip character count preset
 */
export interface ChipCharacterCountPreset {
  /** Chip ID */
  id: string;
  /** Part number */
  partNumber: string;
  /** Manufacturer */
  manufacturer: string;
  /** Number of glyphs */
  glyphCount: number;
  /** Alias for glyphCount (for backwards compatibility) */
  count: number;
  /** Display label */
  label: string;
  /** Systems that use this chip */
  usedIn: string[];
}

/**
 * Chip dimension presets
 */
export const CHIP_DIMENSION_PRESETS: ChipDimensionPreset[] = CHIP_MANUFACTURERS.flatMap((m) =>
  m.chips.map((chip) => ({
    id: chip.id,
    partNumber: chip.partNumber,
    manufacturer: m.name,
    width: chip.glyph.width,
    height: chip.glyph.height,
    label: `${chip.glyph.width}x${chip.glyph.height}`,
    usedIn: chip.usedIn ?? [],
  })),
);

/**
 * Chip character count presets
 */
export const CHIP_CHARACTER_COUNT_PRESETS: ChipCharacterCountPreset[] = CHIP_MANUFACTURERS.flatMap((m) =>
  m.chips.map((chip) => ({
    id: chip.id,
    partNumber: chip.partNumber,
    manufacturer: m.name,
    glyphCount: chip.glyphCount,
    count: chip.glyphCount,
    label: String(chip.glyphCount),
    usedIn: chip.usedIn ?? [],
  })),
);

/**
 * Chip binary export preset with padding and bit direction.
 */
export interface ChipBinaryExportPreset {
  /** Chip ID */
  id: string;
  /** Part number for display */
  partNumber: string;
  /** Manufacturer name for grouping */
  manufacturer: string;
  /** Bit padding direction */
  padding: PaddingDirection;
  /** Bit order within bytes */
  bitDirection: BitDirection;
  /** Byte order for multi-byte rows (width > 8). Defaults to "big". */
  byteOrder?: ByteOrder;
}

/**
 * Chip binary export manufacturer group
 */
export interface ChipBinaryExportManufacturerGroup {
  /** Manufacturer name */
  manufacturer: string;
  /** Chips from this manufacturer */
  chips: ChipBinaryExportPreset[];
}

/**
 * Chip binary export presets derived from chips with binaryFormat defined.
 * Sorted by manufacturer name, then by part number.
 */
export const CHIP_BINARY_EXPORT_PRESETS: ChipBinaryExportPreset[] = CHIP_MANUFACTURERS.flatMap((m) =>
  m.chips
    .filter((chip) => chip.binaryFormat !== undefined)
    .map((chip) => ({
      id: chip.id,
      partNumber: chip.partNumber,
      manufacturer: m.name,
      padding: chip.binaryFormat!.padding,
      bitDirection: chip.binaryFormat!.bitOrder,
      byteOrder: chip.binaryFormat!.byteOrder,
    })),
).sort((a, b) => a.manufacturer.localeCompare(b.manufacturer) || a.partNumber.localeCompare(b.partNumber));

/**
 * Get chip binary export presets grouped by manufacturer
 */
export function getChipBinaryExportPresetsByManufacturer(): ChipBinaryExportManufacturerGroup[] {
  const groups = new Map<string, ChipBinaryExportPreset[]>();

  for (const preset of CHIP_BINARY_EXPORT_PRESETS) {
    if (!groups.has(preset.manufacturer)) {
      groups.set(preset.manufacturer, []);
    }
    groups.get(preset.manufacturer)!.push(preset);
  }

  return Array.from(groups.entries())
    .map(([manufacturer, chips]) => ({ manufacturer, chips }))
    .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer));
}

/**
 * Find chip binary export preset by ID
 */
export function findChipBinaryExportPreset(id: string): ChipBinaryExportPreset | undefined {
  return CHIP_BINARY_EXPORT_PRESETS.find((p) => p.id === id);
}

/**
 * Get chip dimension presets grouped by manufacturer
 */
export function getChipPresetsByManufacturer(): Record<string, ChipDimensionPreset[]> {
  const result: Record<string, ChipDimensionPreset[]> = {};
  for (const preset of CHIP_DIMENSION_PRESETS) {
    if (!result[preset.manufacturer]) {
      result[preset.manufacturer] = [];
    }
    result[preset.manufacturer].push(preset);
  }
  return result;
}

/**
 * Get chip character count presets grouped by manufacturer
 */
export function getChipCharacterCountPresetsByManufacturer(): Record<string, ChipCharacterCountPreset[]> {
  const result: Record<string, ChipCharacterCountPreset[]> = {};
  for (const preset of CHIP_CHARACTER_COUNT_PRESETS) {
    if (!result[preset.manufacturer]) {
      result[preset.manufacturer] = [];
    }
    result[preset.manufacturer].push(preset);
  }
  return result;
}

// ============================================================================
// Helper Functions: Manufacturers
// ============================================================================

/**
 * Get all manufacturer names (from KNOWN_MANUFACTURERS with character ROM systems)
 */
export function getAllManufacturers(): string[] {
  return KNOWN_MANUFACTURERS.map((m) => m.name);
}

/**
 * Get systems for a manufacturer
 */
export function getSystemsForManufacturer(manufacturer: string): string[] {
  const found = KNOWN_MANUFACTURERS.find((m) => m.name === manufacturer);
  return found ? found.systems : [];
}

/**
 * Get all system names (from systems with character ROM)
 */
export function getAllSystems(): string[] {
  return SYSTEMS_WITH_CHARACTER_ROM.map((s) => s.name);
}

/**
 * Check if a manufacturer is known (has systems with character ROM)
 */
export function isKnownManufacturer(manufacturer: string): boolean {
  return KNOWN_MANUFACTURERS.some((m) => m.name === manufacturer);
}

/**
 * Check if a system is known for a manufacturer
 */
export function isKnownSystem(manufacturer: string, system: string): boolean {
  const found = KNOWN_MANUFACTURERS.find((m) => m.name === manufacturer);
  return found ? found.systems.includes(system) : false;
}

// ============================================================================
// Helper Functions: Systems
// ============================================================================

/**
 * Get system info by name (for backwards compatibility)
 */
export function getSystemInfo(system: string): SystemInfo | undefined {
  return getSystemByName(system);
}

/**
 * Get all systems that have character ROM definitions
 */
export function getSystemsWithRomPresets(): SystemInfo[] {
  return SYSTEMS_WITH_CHARACTER_ROM;
}

/**
 * Get system presets grouped by manufacturer
 */
export function getSystemPresetsByManufacturer(): Record<string, SystemDimensionPreset[]> {
  const result: Record<string, SystemDimensionPreset[]> = {};
  for (const preset of SYSTEM_PRESETS) {
    if (!result[preset.manufacturer]) {
      result[preset.manufacturer] = [];
    }
    result[preset.manufacturer].push(preset);
  }
  return result;
}

/**
 * Get system character count presets grouped by manufacturer
 */
export function getSystemCharacterCountPresetsByManufacturer(): Record<string, SystemCharacterCountPreset[]> {
  const result: Record<string, SystemCharacterCountPreset[]> = {};
  for (const preset of SYSTEM_CHARACTER_COUNT_PRESETS) {
    if (!result[preset.manufacturer]) {
      result[preset.manufacturer] = [];
    }
    result[preset.manufacturer].push(preset);
  }
  return result;
}

// ============================================================================
// Backwards Compatibility: ROM_CHIPS
// ============================================================================

/**
 * ROM chip info with manufacturer field (for backwards compatibility).
 * This extends ChipInfo to include the manufacturer name directly.
 */
export interface RomChipInfo extends ChipInfo {
  /** Manufacturer name (flattened from parent) */
  manufacturer: string;
}

/**
 * ROM_CHIPS with manufacturer field included (for backwards compatibility).
 * Components can access chip.manufacturer directly.
 */
export const ROM_CHIPS: RomChipInfo[] = CHIP_MANUFACTURERS.flatMap((m) =>
  m.chips.map((chip) => ({
    ...chip,
    manufacturer: m.name,
  })),
);

// Re-export chip lookup as getRomChipById for backwards compatibility
export const getRomChipById = getChipById;

// Re-export chip dimension presets as ROM_CHIP_DIMENSION_PRESETS
export const ROM_CHIP_DIMENSION_PRESETS = CHIP_DIMENSION_PRESETS;

// Re-export chip character count presets as ROM_CHIP_CHARACTER_COUNT_PRESETS
export const ROM_CHIP_CHARACTER_COUNT_PRESETS = CHIP_CHARACTER_COUNT_PRESETS;

// Re-export grouped presets with old names
export const getRomChipPresetsByManufacturer = getChipPresetsByManufacturer;
export const getRomChipCharacterCountPresetsByManufacturer = getChipCharacterCountPresetsByManufacturer;

/**
 * Get all chips used by a system (for backwards compatibility)
 */
export function getRomChipsForSystem(system: string): RomChipInfo[] {
  const systemInfo = getSystemByName(system);
  if (!systemInfo) return [];
  // Get chips and add manufacturer info
  const chips = getChipsForSystem(systemInfo);
  return chips.map((chip) => {
    // Find the manufacturer for this chip
    const mfr = CHIP_MANUFACTURERS.find((m) => m.chips.some((c) => c.id === chip.id));
    return {
      ...chip,
      manufacturer: mfr?.name ?? "Unknown",
    };
  });
}

/**
 * Get all unique chip manufacturers (for backwards compatibility)
 */
export function getAllRomChipManufacturers(): string[] {
  const manufacturers = new Set(CHIP_MANUFACTURERS.map((m) => m.name));
  return Array.from(manufacturers).sort();
}
