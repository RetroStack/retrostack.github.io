/**
 * Character ROM Editor - Storage Interfaces
 *
 * Defines interfaces for storage abstraction to enable dependency injection
 * and testing without browser APIs (localStorage, IndexedDB).
 */

import type { SerializedCharacterSet, CharacterSetConfig, Character } from "../types";

/**
 * Key-value storage interface (localStorage abstraction)
 *
 * Provides a simple sync key-value storage interface that can be implemented
 * by localStorage, in-memory storage, or any other backend.
 */
export interface IKeyValueStorage {
  /** Get a value by key, returns null if not found */
  getItem(key: string): string | null;
  /** Set a value by key */
  setItem(key: string, value: string): void;
  /** Remove a value by key */
  removeItem(key: string): void;
}

/**
 * Character set storage interface (IndexedDB abstraction)
 *
 * Provides async CRUD operations for character sets. The real implementation
 * uses IndexedDB with localStorage fallback, but tests can use in-memory storage.
 */
export interface ICharacterSetStorage {
  /** Initialize the storage (open database, run migrations, etc.) */
  initialize(): Promise<void>;

  // CRUD operations
  /** Get all character sets, sorted by pinned first then by update time */
  getAll(): Promise<SerializedCharacterSet[]>;
  /** Get a character set by ID */
  getById(id: string): Promise<SerializedCharacterSet | null>;
  /** Save (insert or update) a character set, returns the ID */
  save(characterSet: SerializedCharacterSet): Promise<string>;
  /** Save as a new character set with a new name, returns the new ID */
  saveAs(characterSet: SerializedCharacterSet, newName: string): Promise<string>;
  /** Delete a character set by ID */
  delete(id: string): Promise<void>;

  // Metadata operations
  /** Toggle the pinned state of a character set, returns new pinned state */
  togglePinned(id: string): Promise<boolean>;

  // Search and filter
  /** Search character sets by text (name, description, source, etc.) */
  search(query: string): Promise<SerializedCharacterSet[]>;
  /** Filter character sets by size dimensions */
  filterBySize(width: number | null, height: number | null): Promise<SerializedCharacterSet[]>;
  /** Filter character sets by manufacturers (OR logic) */
  filterByManufacturers(manufacturers: string[]): Promise<SerializedCharacterSet[]>;
  /** Filter character sets by systems (OR logic) */
  filterBySystems(systems: string[]): Promise<SerializedCharacterSet[]>;

  // Aggregation queries
  /** Get unique sizes available in the library */
  getAvailableSizes(): Promise<{ width: number; height: number }[]>;
  /** Get unique manufacturers available in the library */
  getAvailableManufacturers(): Promise<string[]>;
  /** Get unique systems available in the library */
  getAvailableSystems(): Promise<string[]>;

  // Validation
  /** Check if a character set with the given name exists */
  nameExists(name: string, excludeId?: string): Promise<boolean>;

  // Utility
  /** Get count of character sets */
  count(): Promise<number>;
  /** Check if library is empty */
  isEmpty(): Promise<boolean>;
  /** Clear all data (primarily for testing) */
  clear(): Promise<void>;
}

/**
 * Snapshot data structure
 */
export interface Snapshot {
  /** Unique snapshot ID */
  id: string;
  /** ID of the character set this snapshot belongs to */
  characterSetId: string;
  /** User-provided name for the snapshot */
  name: string;
  /** When the snapshot was created */
  createdAt: number;
  /** Binary data as base64 */
  binaryData: string;
  /** Character set config at time of snapshot */
  config: CharacterSetConfig;
  /** Number of characters in the snapshot */
  characterCount: number;
}

/**
 * Snapshot storage interface
 *
 * Provides async operations for snapshot management. Snapshots are named
 * versions of character sets that users can create and restore.
 */
export interface ISnapshotStorage {
  /** Save a snapshot */
  save(snapshot: Snapshot): Promise<void>;
  /** Get all snapshots for a character set, sorted by created date (newest first) */
  getForCharacterSet(characterSetId: string): Promise<Snapshot[]>;
  /** Get a snapshot by ID */
  getById(id: string): Promise<Snapshot | null>;
  /** Delete a snapshot by ID */
  delete(id: string): Promise<void>;
  /** Delete all snapshots for a character set */
  deleteAllForCharacterSet(characterSetId: string): Promise<void>;
  /** Rename a snapshot */
  rename(id: string, newName: string): Promise<void>;
  /** Get snapshot count for a character set */
  getCount(characterSetId: string): Promise<number>;
  /** Check if snapshots are at capacity for a character set */
  isAtCapacity(characterSetId: string): Promise<boolean>;
  /** Get maximum snapshots allowed per character set */
  getMaxSnapshots(): number;
}

/**
 * Auto-save data structure
 *
 * Note: The canonical definition is in useAutoSave.ts hook.
 * This mirrors that structure for storage utilities.
 */
export interface AutoSaveData {
  characterSetId: string;
  binaryData: string;
  config: CharacterSetConfig;
  selectedIndex: number;
  timestamp: number;
  isDirty: boolean;
}

/**
 * Auto-save storage interface
 *
 * Provides operations for auto-save functionality. Uses key-value storage
 * under the hood but provides a typed interface for auto-save data.
 */
export interface IAutoSaveStorage {
  /** Save auto-save data */
  save(data: AutoSaveData): void;
  /** Get auto-save data, returns null if not found */
  get(): AutoSaveData | null;
  /** Clear auto-save data */
  clear(): void;
  /** Check if auto-save data exists and is newer than stored version */
  hasNewerAutoSave(characterSetId: string, storedUpdatedAt: number): boolean;
}

/**
 * Factory function type for creating snapshot from characters
 * This is a pure function, not storage-dependent
 */
export type CreateSnapshotFn = (
  characterSetId: string,
  name: string,
  characters: Character[],
  config: CharacterSetConfig
) => Snapshot;

/**
 * Factory function type for restoring characters from snapshot
 * This is a pure function, not storage-dependent
 */
export type RestoreSnapshotFn = (snapshot: Snapshot) => Character[];
