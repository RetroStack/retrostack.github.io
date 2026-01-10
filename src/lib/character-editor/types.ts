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
 * Origin of a character set - how it was created
 * - "created": Made from scratch (new empty set or preset)
 * - "binary": Imported from binary file (.bin, .rom)
 * - "text": Imported from text format (assembly, C arrays, hex)
 * - "font": Imported from font file (TTF, OTF, WOFF)
 * - "image": Imported from image file (PNG, JPG, etc.)
 * - "shared": Imported from shared URL
 * - "copied": Copied/duplicated from another character set
 */
export type CharacterSetOrigin =
  | "created"
  | "binary"
  | "text"
  | "font"
  | "image"
  | "shared"
  | "copied";

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
 * Note attached to a character set
 */
export interface CharacterSetNote {
  /** Unique identifier */
  id: string;
  /** Note content (text) */
  text: string;
  /** When the note was created */
  createdAt: number;
  /** When the note was last updated */
  updatedAt: number;
}

/**
 * User-owned metadata (modifiable even for built-in sets)
 * These fields represent user preferences, not character set data.
 * They are preserved when built-in character sets are updated.
 */
export interface UserMetadata {
  /** Whether this character set is pinned to appear first */
  isPinned?: boolean;
  /** User notes attached to this character set */
  notes?: CharacterSetNote[];
}

/**
 * Character set metadata for library storage
 *
 * Note: isPinned and notes are "user-owned" fields that can be modified
 * even on built-in character sets and are preserved during updates.
 * All other fields are "character set owned" and are read-only for built-in sets.
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
  /** Character ROM IC chip used (e.g., "901225-01", "2513") */
  chip: string;
  /** Locale/region where this character set is typically used (e.g., "English", "German") */
  locale: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Whether this is a built-in character set */
  isBuiltIn: boolean;
  /** Version of the built-in character set (used for auto-updates, only for isBuiltIn: true) */
  builtInVersion?: number;
  /** User-defined tags for organization */
  tags?: string[];
  /**
   * Origin: how this character set was created
   * - "created": Made from scratch (new empty set or preset)
   * - "imported": Imported from file or external source
   * - "copied": Copied/duplicated from another character set
   */
  origin?: CharacterSetOrigin;
  /** ID of the source character set if this was copied (for lineage tracking) */
  copiedFromId?: string;
  /** Name of the source character set at time of copy (snapshot, since original may change) */
  copiedFromName?: string;

  // ============================================================================
  // User-owned fields (preserved during built-in updates, modifiable on any set)
  // ============================================================================

  /** Whether this character set is pinned to appear first in search results */
  isPinned?: boolean;
  /** User notes attached to this character set */
  notes?: CharacterSetNote[];
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
  /** Multi-select filter for character counts (OR logic) */
  characterCountFilters: number[];
  /** Multi-select filter for manufacturers (OR logic) */
  manufacturerFilters: string[];
  /** Multi-select filter for systems (OR logic) */
  systemFilters: string[];
  /** Multi-select filter for chips (OR logic) */
  chipFilters: string[];
  /** Multi-select filter for locales (OR logic) */
  localeFilters: string[];
  /** Multi-select filter for tags (OR logic) */
  tagFilters: string[];
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
 * Calculate character count from a serialized character set
 */
export function getCharacterCount(serialized: SerializedCharacterSet): number {
  // Calculate the binary data size from base64 (accounting for padding)
  const base64 = serialized.binaryData;
  let padding = 0;
  if (base64.endsWith("==")) padding = 2;
  else if (base64.endsWith("=")) padding = 1;
  const binaryLength = (base64.length * 3) / 4 - padding;

  const bpc = bytesPerCharacter(serialized.config);
  return bpc > 0 ? Math.floor(binaryLength / bpc) : 0;
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
