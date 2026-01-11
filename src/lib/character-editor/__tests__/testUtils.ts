/**
 * Character ROM Editor - Test Utilities
 *
 * Provides mock factories, storage mocks, and helpers for testing
 * character editor business logic without browser dependencies.
 */

import type {
  Character,
  CharacterSet,
  CharacterSetConfig,
  CharacterSetMetadata,
  SerializedCharacterSet,
} from "../types";
import { generateId } from "../types";
import { serializeCharacterRom, binaryToBase64 } from "../import/binary";
import type { Snapshot } from "../storage/interfaces";

// Re-export in-memory storage implementations
export {
  InMemoryKeyValueStorage,
  InMemoryCharacterSetStorage,
  InMemorySnapshotStorage,
  InMemoryAutoSaveStorage,
  createMockKeyValueStorage,
  createMockCharacterSetStorage,
  createMockSnapshotStorage,
  createMockAutoSaveStorage,
} from "../storage/memoryStorage";

// ============================================================================
// Character Factories
// ============================================================================

/**
 * Create a mock character with a specific pattern
 */
export function createMockCharacter(
  width: number = 8,
  height: number = 8,
  pattern: "empty" | "filled" | "checkerboard" | "diagonal" = "empty"
): Character {
  const pixels: boolean[][] = [];

  for (let row = 0; row < height; row++) {
    const rowData: boolean[] = [];
    for (let col = 0; col < width; col++) {
      let value = false;
      switch (pattern) {
        case "filled":
          value = true;
          break;
        case "checkerboard":
          value = (row + col) % 2 === 0;
          break;
        case "diagonal":
          value = row === col;
          break;
        case "empty":
        default:
          value = false;
      }
      rowData.push(value);
    }
    pixels.push(rowData);
  }

  return { pixels };
}

/**
 * Create an array of mock characters
 */
export function createMockCharacters(
  count: number,
  width: number = 8,
  height: number = 8,
  patterns: ("empty" | "filled" | "checkerboard" | "diagonal")[] = ["empty"]
): Character[] {
  return Array.from({ length: count }, (_, i) =>
    createMockCharacter(width, height, patterns[i % patterns.length])
  );
}

// ============================================================================
// Config Factories
// ============================================================================

/**
 * Create a mock character set config
 */
export function createMockConfig(
  overrides?: Partial<CharacterSetConfig>
): CharacterSetConfig {
  return {
    width: 8,
    height: 8,
    padding: "right",
    bitDirection: "msb",
    ...overrides,
  };
}

// ============================================================================
// Metadata Factories
// ============================================================================

/**
 * Create mock character set metadata
 */
export function createMockMetadata(
  overrides?: Partial<CharacterSetMetadata>
): CharacterSetMetadata {
  const now = Date.now();
  return {
    id: generateId(),
    name: "Test Character Set",
    description: "A test character set for unit testing",
    source: "test",
    manufacturer: "Test Manufacturer",
    system: "Test System",
    chip: "Test Chip",
    locale: "English",
    createdAt: now,
    updatedAt: now,
    isBuiltIn: false,
    isPinned: false,
    ...overrides,
  };
}

// ============================================================================
// Character Set Factories
// ============================================================================

/**
 * Create a mock character set
 */
export function createMockCharacterSet(
  overrides?: Partial<{
    metadata: Partial<CharacterSetMetadata>;
    config: Partial<CharacterSetConfig>;
    characters: Character[];
    characterCount: number;
  }>
): CharacterSet {
  const config = createMockConfig(overrides?.config);
  const characterCount = overrides?.characterCount ?? 256;

  return {
    metadata: createMockMetadata(overrides?.metadata),
    config,
    characters:
      overrides?.characters ??
      createMockCharacters(characterCount, config.width, config.height),
  };
}

/**
 * Create a mock serialized character set
 */
export function createMockSerializedCharacterSet(
  overrides?: Partial<{
    metadata: Partial<CharacterSetMetadata>;
    config: Partial<CharacterSetConfig>;
    characters: Character[];
    characterCount: number;
  }>
): SerializedCharacterSet {
  const characterSet = createMockCharacterSet(overrides);
  const binaryData = binaryToBase64(
    serializeCharacterRom(characterSet.characters, characterSet.config)
  );

  return {
    metadata: characterSet.metadata,
    config: characterSet.config,
    binaryData,
  };
}

/**
 * Create multiple mock serialized character sets with different properties
 */
export function createMockSerializedCharacterSets(
  count: number,
  customizer?: (index: number) => Partial<{
    metadata: Partial<CharacterSetMetadata>;
    config: Partial<CharacterSetConfig>;
  }>
): SerializedCharacterSet[] {
  return Array.from({ length: count }, (_, i) => {
    const overrides = customizer?.(i);
    return createMockSerializedCharacterSet({
      metadata: {
        name: `Test Set ${i + 1}`,
        ...overrides?.metadata,
      },
      config: overrides?.config,
      characterCount: 16, // Smaller sets for faster tests
    });
  });
}

// ============================================================================
// Snapshot Factories
// ============================================================================

/**
 * Create a mock snapshot
 */
export function createMockSnapshot(
  overrides?: Partial<Snapshot>
): Snapshot {
  const config = createMockConfig();
  const characters = createMockCharacters(16, config.width, config.height);
  const binaryData = binaryToBase64(serializeCharacterRom(characters, config));

  return {
    id: generateId(),
    characterSetId: generateId(),
    name: "Test Snapshot",
    createdAt: Date.now(),
    binaryData,
    config,
    characterCount: characters.length,
    ...overrides,
  };
}

// ============================================================================
// Comparison Utilities
// ============================================================================

/**
 * Compare two characters for equality
 */
export function charactersEqual(a: Character, b: Character): boolean {
  if (a.pixels.length !== b.pixels.length) return false;
  for (let row = 0; row < a.pixels.length; row++) {
    if (a.pixels[row].length !== b.pixels[row].length) return false;
    for (let col = 0; col < a.pixels[row].length; col++) {
      if (a.pixels[row][col] !== b.pixels[row][col]) return false;
    }
  }
  return true;
}

/**
 * Compare two character arrays for equality
 */
export function characterArraysEqual(a: Character[], b: Character[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!charactersEqual(a[i], b[i])) return false;
  }
  return true;
}

// ============================================================================
// Async Test Helpers
// ============================================================================

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 50
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error("waitFor timed out");
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Wait for a promise to resolve with retries
 */
export async function waitForAsync<T>(
  fn: () => Promise<T>,
  timeout: number = 5000,
  interval: number = 50
): Promise<T> {
  const start = Date.now();
  let lastError: Error | undefined;

  while (Date.now() - start < timeout) {
    try {
      return await fn();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  throw lastError ?? new Error("waitForAsync timed out");
}
