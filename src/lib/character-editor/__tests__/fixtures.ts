/**
 * Character ROM Editor - Test Fixtures
 *
 * Pre-built sample data for testing. These fixtures represent realistic
 * character sets that can be used across multiple test suites.
 */

import type {
  CharacterSetConfig,
  SerializedCharacterSet,
} from "../types";
import {
  createMockCharacter,
  createMockSerializedCharacterSet,
} from "./testUtils";
import type { Snapshot } from "../storage/interfaces";
import type { LibraryFilterState } from "../library/filters";

// ============================================================================
// Standard Configurations
// ============================================================================

export const config8x8: CharacterSetConfig = {
  width: 8,
  height: 8,
  padding: "right",
  bitDirection: "ltr",
};

export const config8x16: CharacterSetConfig = {
  width: 8,
  height: 16,
  padding: "right",
  bitDirection: "ltr",
};

export const config16x16: CharacterSetConfig = {
  width: 16,
  height: 16,
  padding: "right",
  bitDirection: "ltr",
};

// ============================================================================
// Sample Characters
// ============================================================================

export const emptyCharacter8x8 = createMockCharacter(8, 8, "empty");
export const filledCharacter8x8 = createMockCharacter(8, 8, "filled");
export const checkerboardCharacter8x8 = createMockCharacter(8, 8, "checkerboard");
export const diagonalCharacter8x8 = createMockCharacter(8, 8, "diagonal");

// ============================================================================
// Sample Character Sets
// ============================================================================

/**
 * Commodore 64 style character set
 */
export const commodore64CharacterSet: SerializedCharacterSet = createMockSerializedCharacterSet({
  metadata: {
    name: "Commodore 64 US",
    description: "Standard C64 character set",
    source: "VICE",
    manufacturer: "Commodore",
    system: "C64",
    chip: "901225-01",
    locale: "English",
    isBuiltIn: true,
    isPinned: false,
  },
  config: config8x8,
  characterCount: 256,
});

/**
 * Apple II style character set
 */
export const appleIICharacterSet: SerializedCharacterSet = createMockSerializedCharacterSet({
  metadata: {
    name: "Apple II Standard",
    description: "Standard Apple II character ROM",
    source: "AppleWin",
    manufacturer: "Apple",
    system: "Apple II",
    chip: "2513",
    locale: "English",
    isBuiltIn: true,
    isPinned: false,
  },
  config: { ...config8x8, width: 7 },
  characterCount: 128,
});

/**
 * Atari 800 style character set
 */
export const atari800CharacterSet: SerializedCharacterSet = createMockSerializedCharacterSet({
  metadata: {
    name: "Atari 800",
    description: "Standard Atari 8-bit character ROM",
    source: "Altirra",
    manufacturer: "Atari",
    system: "Atari 800",
    chip: "CO14599",
    locale: "English",
    isBuiltIn: true,
    isPinned: true,
  },
  config: config8x8,
  characterCount: 128,
});

/**
 * User-created character set
 */
export const userCharacterSet: SerializedCharacterSet = createMockSerializedCharacterSet({
  metadata: {
    name: "My Custom Font",
    description: "A custom font I created",
    source: "yourself",
    manufacturer: "",
    system: "",
    chip: "",
    locale: "",
    isBuiltIn: false,
    isPinned: false,
  },
  config: config8x8,
  characterCount: 64,
});

/**
 * German locale character set
 */
export const germanCharacterSet: SerializedCharacterSet = createMockSerializedCharacterSet({
  metadata: {
    name: "C64 German",
    description: "German C64 character ROM with umlauts",
    source: "VICE",
    manufacturer: "Commodore",
    system: "C64",
    chip: "901225-02",
    locale: "German",
    isBuiltIn: true,
    isPinned: false,
  },
  config: config8x8,
  characterCount: 256,
});

/**
 * Array of all sample character sets for library testing
 */
export const sampleCharacterSets: SerializedCharacterSet[] = [
  commodore64CharacterSet,
  appleIICharacterSet,
  atari800CharacterSet,
  userCharacterSet,
  germanCharacterSet,
];

// ============================================================================
// Sample Snapshots
// ============================================================================

export const sampleSnapshot1: Snapshot = {
  id: "snapshot-1",
  characterSetId: commodore64CharacterSet.metadata.id,
  name: "Before modifications",
  createdAt: Date.now() - 3600000, // 1 hour ago
  binaryData: commodore64CharacterSet.binaryData,
  config: commodore64CharacterSet.config,
  characterCount: 256,
};

export const sampleSnapshot2: Snapshot = {
  id: "snapshot-2",
  characterSetId: commodore64CharacterSet.metadata.id,
  name: "After fixing letter A",
  createdAt: Date.now() - 1800000, // 30 min ago
  binaryData: commodore64CharacterSet.binaryData,
  config: commodore64CharacterSet.config,
  characterCount: 256,
};

export const sampleSnapshots: Snapshot[] = [sampleSnapshot1, sampleSnapshot2];

// ============================================================================
// Sample Filters
// ============================================================================

export const emptyFilter: LibraryFilterState = {
  searchQuery: "",
  widthFilters: [],
  heightFilters: [],
  characterCountFilters: [],
  manufacturerFilters: [],
  systemFilters: [],
  chipFilters: [],
  localeFilters: [],
  tagFilters: [],
};

export const commodoreFilter: LibraryFilterState = {
  ...emptyFilter,
  manufacturerFilters: ["Commodore"],
};

export const size8x8Filter: LibraryFilterState = {
  ...emptyFilter,
  widthFilters: [8],
  heightFilters: [8],
};

export const searchQueryFilter: LibraryFilterState = {
  ...emptyFilter,
  searchQuery: "C64",
};

export const complexFilter: LibraryFilterState = {
  searchQuery: "",
  widthFilters: [8],
  heightFilters: [8],
  characterCountFilters: [256],
  manufacturerFilters: ["Commodore"],
  systemFilters: ["C64"],
  chipFilters: [],
  localeFilters: ["English"],
  tagFilters: [],
};
