/**
 * Character ROM Editor - Default Character Sets
 *
 * Built-in character sets for classic retro systems.
 * These are authentic character ROM data from various vintage computers.
 * Data is stored in JSON and imported here with type definitions.
 * Also supports loading character sets from external URLs.
 */

import { SerializedCharacterSet } from "./types";
import { binaryToBase64 } from "./import/binary";
import charsetData from "./data/builtinCharsets.json";
import { getEnabledExternalSources, ExternalCharsetSource } from "./data/externalSources";

/**
 * Source character set data format with full metadata
 */
export interface ChargenSourceData {
  /** Unique identifier for the character set (used for database tracking) */
  id: string;
  /** Display name for the character set */
  name: string;
  /** Description of the character set */
  description: string;
  /** Source URL or attribution */
  source: string;
  /** Character width in pixels */
  width: number;
  /** Character height in pixels */
  height: number;
  /** Number of characters in the set */
  length: number;
  /** Hardware manufacturer (e.g., "Apple", "Commodore") */
  manufacturer: string;
  /** System name (e.g., "Apple II", "C64") */
  system: string;
  /** ROM chip identifier (e.g., "901225-01", "2513") */
  chip: string;
  /** Locale/language of the character set (e.g., "English", "German", "Japanese") */
  locale: string;
  /** Bit direction: "msb" = MSB is leftmost pixel, "lsb" = LSB is leftmost pixel */
  bitDirection: "msb" | "lsb";
  /** Padding direction: "left" = padding bits at start, "right" = padding bits at end (default: "right") */
  bitPadding?: "left" | "right";
  /** Version number for built-in character sets (used for auto-updates) */
  version: number;
  /** Raw character data - array of byte arrays per character */
  data: number[][];
}

/**
 * All built-in character sets loaded from JSON
 */
const builtinCharsets: ChargenSourceData[] = charsetData as ChargenSourceData[];

/**
 * Convert source chargen data to Uint8Array binary format
 * Each inner array in data represents one character's row bytes
 */
function chargenDataToBinary(data: number[][]): Uint8Array {
  // Calculate total bytes needed
  const totalBytes = data.reduce((sum, char) => sum + char.length, 0);
  const bytes = new Uint8Array(totalBytes);

  let offset = 0;
  for (const charData of data) {
    for (const byte of charData) {
      bytes[offset++] = byte;
    }
  }

  return bytes;
}

/**
 * Create a SerializedCharacterSet from source chargen data
 * Uses all metadata directly from the source data object including its id
 */
function createCharacterSetFromSource(
  source: ChargenSourceData
): SerializedCharacterSet {
  const now = Date.now();

  return {
    metadata: {
      id: source.id,
      name: source.name,
      description: source.description || `${source.system} character set`,
      source: source.source || "RetroStack",
      manufacturer: source.manufacturer,
      system: source.system,
      chip: source.chip,
      locale: source.locale,
      createdAt: now,
      updatedAt: now,
      isBuiltIn: true,
      builtInVersion: source.version,
      origin: "binary",
    },
    config: {
      width: source.width,
      height: source.height,
      padding: source.bitPadding ?? "right",
      bitDirection: source.bitDirection,
    },
    binaryData: binaryToBase64(chargenDataToBinary(source.data)),
  };
}

/**
 * Get all default character sets
 */
export function getDefaultCharacterSets(): SerializedCharacterSet[] {
  return builtinCharsets.map((source) => createCharacterSetFromSource(source));
}

/**
 * Get all built-in character set IDs
 */
export function getBuiltInIds(): string[] {
  return builtinCharsets.map((source) => source.id);
}

/**
 * Get a specific built-in character set by ID
 * Returns null if not found
 */
export function getBuiltInCharacterSetById(id: string): SerializedCharacterSet | null {
  const source = builtinCharsets.find((s) => s.id === id);
  if (!source) return null;
  return createCharacterSetFromSource(source);
}

/**
 * Check if a character set is a built-in default
 */
export function isBuiltInCharacterSet(id: string): boolean {
  return builtinCharsets.some((source) => source.id === id);
}

/**
 * Get the current version of a built-in character set
 * Returns null if the ID is not a built-in character set
 */
export function getBuiltInVersion(id: string): number | null {
  const source = builtinCharsets.find((s) => s.id === id);
  return source?.version ?? null;
}

// =============================================================================
// External Character Set Loading
// =============================================================================

/**
 * Cache for fetched external character sets
 * Maps source URL to fetched data (or null if fetch failed)
 */
const externalCharsetCache = new Map<string, ChargenSourceData[] | null>();

/**
 * Fetch character sets from a single external URL
 * Returns null if fetch fails (does not throw)
 */
async function fetchExternalCharsets(
  source: ExternalCharsetSource
): Promise<ChargenSourceData[] | null> {
  // Check cache first
  if (externalCharsetCache.has(source.url)) {
    return externalCharsetCache.get(source.url) ?? null;
  }

  try {
    const response = await fetch(source.url);
    if (!response.ok) {
      console.warn(
        `Failed to fetch external charsets from ${source.name}: ${response.status}`
      );
      externalCharsetCache.set(source.url, null);
      return null;
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      console.warn(
        `Invalid format from ${source.name}: expected array of character sets`
      );
      externalCharsetCache.set(source.url, null);
      return null;
    }

    // Validate and filter valid entries
    const validCharsets = data.filter((item): item is ChargenSourceData => {
      return (
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.width === "number" &&
        typeof item.height === "number" &&
        Array.isArray(item.data)
      );
    });

    externalCharsetCache.set(source.url, validCharsets);
    return validCharsets;
  } catch (error) {
    console.warn(`Error fetching external charsets from ${source.name}:`, error);
    externalCharsetCache.set(source.url, null);
    return null;
  }
}

/**
 * Fetch all character sets from all enabled external sources
 * Returns combined array of all successfully fetched character sets
 */
export async function fetchAllExternalCharsets(): Promise<SerializedCharacterSet[]> {
  const sources = getEnabledExternalSources();
  if (sources.length === 0) {
    return [];
  }

  const results = await Promise.all(sources.map(fetchExternalCharsets));

  const allCharsets: SerializedCharacterSet[] = [];
  for (const charsets of results) {
    if (charsets) {
      for (const source of charsets) {
        allCharsets.push(createCharacterSetFromSource(source));
      }
    }
  }

  return allCharsets;
}

/**
 * Get all external character set IDs from all enabled sources
 * Returns array of IDs from successfully fetched sources
 */
export async function getExternalIds(): Promise<string[]> {
  const sources = getEnabledExternalSources();
  if (sources.length === 0) {
    return [];
  }

  const results = await Promise.all(sources.map(fetchExternalCharsets));

  const ids: string[] = [];
  for (const charsets of results) {
    if (charsets) {
      for (const source of charsets) {
        ids.push(source.id);
      }
    }
  }

  return ids;
}

/**
 * Get a specific external character set by ID
 * Searches all enabled external sources
 * Returns null if not found
 */
export async function getExternalCharacterSetById(
  id: string
): Promise<SerializedCharacterSet | null> {
  const sources = getEnabledExternalSources();
  if (sources.length === 0) {
    return null;
  }

  const results = await Promise.all(sources.map(fetchExternalCharsets));

  for (const charsets of results) {
    if (charsets) {
      const source = charsets.find((s) => s.id === id);
      if (source) {
        return createCharacterSetFromSource(source);
      }
    }
  }

  return null;
}

/**
 * Check if a character set ID belongs to an external source
 */
export async function isExternalCharacterSet(id: string): Promise<boolean> {
  const externalIds = await getExternalIds();
  return externalIds.includes(id);
}

/**
 * Clear the external charset cache
 * Useful for forcing a refresh from external sources
 */
export function clearExternalCache(): void {
  externalCharsetCache.clear();
}
