/**
 * Character ROM Editor - Type Definitions
 *
 * Defines the core data structures for character ROM editing:
 * - Character sets with variable dimensions
 * - Binary format configuration (padding, bit direction)
 * - Metadata for library storage
 */

// Padding direction for byte alignment
export type PaddingDirection = "left" | "right";

// Bit direction within bytes
export type BitDirection = "ltr" | "rtl";

// Anchor points for resize operations (3x3 grid)
export type AnchorPoint =
  | "tl" | "tc" | "tr"   // top-left, top-center, top-right
  | "ml" | "mc" | "mr"   // middle-left, middle-center, middle-right
  | "bl" | "bc" | "br";  // bottom-left, bottom-center, bottom-right

/**
 * Character set configuration
 * Defines the format of the binary data
 */
export interface CharacterSetConfig {
  /** Pixels per character width (1-16) */
  width: number;
  /** Pixels per character height (1-16) */
  height: number;
  /** Padding direction for byte alignment */
  padding: PaddingDirection;
  /** Bit interpretation direction */
  bitDirection: BitDirection;
}

/**
 * Single character data
 * Stored as a 2D boolean array [row][column]
 */
export interface Character {
  /** Pixel data - true = foreground, false = background */
  pixels: boolean[][];
}

/**
 * Character set metadata for library storage
 */
export interface CharacterSetMetadata {
  /** Unique identifier (UUID) */
  id: string;
  /** Display name */
  name: string;
  /** Optional description */
  description: string;
  /** Source attribution ("yourself" for user uploads) */
  source: string;
  /** Hardware manufacturer (e.g., "Commodore", "Apple") */
  manufacturer: string;
  /** Specific system (e.g., "C64", "Apple II") */
  system: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Whether this is a built-in character set */
  isBuiltIn: boolean;
}

/**
 * Complete character set with metadata and data
 */
export interface CharacterSet {
  metadata: CharacterSetMetadata;
  config: CharacterSetConfig;
  characters: Character[];
}

/**
 * Serialized format for IndexedDB storage
 * Uses Base64-encoded binary for efficient storage
 */
export interface SerializedCharacterSet {
  metadata: CharacterSetMetadata;
  config: CharacterSetConfig;
  /** Base64-encoded binary data */
  binaryData: string;
}

/**
 * Editor snapshot for undo/redo history
 */
export interface EditorSnapshot {
  characters: Character[];
  selectedIndex: number;
  timestamp: number;
}

/**
 * Undo/redo history state
 */
export interface HistoryState {
  past: EditorSnapshot[];
  present: EditorSnapshot;
  future: EditorSnapshot[];
}

/**
 * Batch selection state for multi-character editing
 */
export interface BatchSelection {
  /** Set of selected character indices */
  indices: Set<number>;
  /** Anchor index for shift-click selection */
  anchorIndex: number | null;
}

/**
 * Temporary storage item for clipboard functionality
 */
export interface TempStorageItem {
  id: string;
  character: Character;
  sourceSetId: string;
  sourceIndex: number;
}

/**
 * Library filter state
 */
export interface LibraryFilter {
  searchQuery: string;
  widthFilter: number | null;
  heightFilter: number | null;
  /** Multi-select filter for manufacturers (OR logic) */
  manufacturerFilters: string[];
  /** Multi-select filter for systems (OR logic) */
  systemFilters: string[];
}

/**
 * Import state during binary file import
 */
export interface ImportState {
  file: File | null;
  rawData: ArrayBuffer | null;
  config: CharacterSetConfig;
  name: string;
  description: string;
}

/**
 * Export options for binary output
 */
export interface ExportOptions {
  padding: PaddingDirection;
  bitDirection: BitDirection;
  filename: string;
}

/**
 * Auto-save data for recovery
 */
export interface AutoSaveData {
  characterSetId: string;
  characters: Character[];
  selectedIndex: number;
  timestamp: number;
  isDirty: boolean;
}

/**
 * Calculate bytes needed per line based on character width
 */
export function bytesPerLine(width: number): number {
  return Math.ceil(width / 8);
}

/**
 * Calculate total bytes per character
 */
export function bytesPerCharacter(config: CharacterSetConfig): number {
  return bytesPerLine(config.width) * config.height;
}

/**
 * Create an empty character with given dimensions
 */
export function createEmptyCharacter(width: number, height: number): Character {
  const pixels: boolean[][] = [];
  for (let row = 0; row < height; row++) {
    pixels.push(new Array(width).fill(false));
  }
  return { pixels };
}

/**
 * Clone a character (deep copy)
 */
export function cloneCharacter(char: Character): Character {
  return {
    pixels: char.pixels.map((row) => [...row]),
  };
}

/**
 * Create default character set config
 */
export function createDefaultConfig(): CharacterSetConfig {
  return {
    width: 8,
    height: 8,
    padding: "right",
    bitDirection: "ltr",
  };
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}
