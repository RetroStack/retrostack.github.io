/**
 * Character ROM Editor - Snapshots Storage
 *
 * Provides IndexedDB storage for named snapshots of character sets.
 * Snapshots allow users to save multiple versions of their work.
 */

import { Character, CharacterSetConfig, generateId } from "./types";
import { serializeCharacterRom, binaryToBase64, base64ToBinary, parseCharacterRom } from "./binary";

const DB_NAME = "retrostack-character-editor";
const DB_VERSION = 4; // Bumped for snapshots store
const SNAPSHOTS_STORE = "snapshots";
const MAX_SNAPSHOTS_PER_SET = 10;

/**
 * Snapshot metadata and data
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
 * Check if IndexedDB is available
 */
function isIndexedDBAvailable(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return !!window.indexedDB;
  } catch {
    return false;
  }
}

/**
 * Get the IndexedDB database
 */
function getDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open database"));
    };

    request.onsuccess = () => {
      const db = request.result;
      // Verify the snapshots store exists (may not if upgrade was blocked by another tab)
      if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
        db.close();
        reject(new Error("Database upgrade required - please close other tabs and refresh"));
        return;
      }
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create snapshots store if it doesn't exist
      if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
        const store = db.createObjectStore(SNAPSHOTS_STORE, {
          keyPath: "id",
        });
        store.createIndex("by-character-set", "characterSetId", { unique: false });
        store.createIndex("by-created", "createdAt", { unique: false });
      }
    };
  });
}

/**
 * Create a snapshot from characters
 */
export function createSnapshot(
  characterSetId: string,
  name: string,
  characters: Character[],
  config: CharacterSetConfig
): Snapshot {
  const binaryData = binaryToBase64(serializeCharacterRom(characters, config));

  return {
    id: generateId(),
    characterSetId,
    name,
    createdAt: Date.now(),
    binaryData,
    config,
    characterCount: characters.length,
  };
}

/**
 * Restore characters from a snapshot
 */
export function restoreSnapshot(snapshot: Snapshot): Character[] {
  const binary = base64ToBinary(snapshot.binaryData);
  return parseCharacterRom(binary, snapshot.config);
}

/**
 * Save a snapshot to IndexedDB
 */
export async function saveSnapshot(snapshot: Snapshot): Promise<void> {
  const db = await getDatabase();

  // Check if we've exceeded the limit for this character set
  const existingSnapshots = await getSnapshotsForCharacterSet(snapshot.characterSetId);
  if (existingSnapshots.length >= MAX_SNAPSHOTS_PER_SET) {
    throw new Error(
      `Maximum of ${MAX_SNAPSHOTS_PER_SET} snapshots per character set. Delete an existing snapshot first.`
    );
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SNAPSHOTS_STORE], "readwrite");
    const store = transaction.objectStore(SNAPSHOTS_STORE);
    const request = store.put(snapshot);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Failed to save snapshot"));
  });
}

/**
 * Get all snapshots for a character set
 */
export async function getSnapshotsForCharacterSet(characterSetId: string): Promise<Snapshot[]> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SNAPSHOTS_STORE], "readonly");
    const store = transaction.objectStore(SNAPSHOTS_STORE);
    const index = store.index("by-character-set");
    const request = index.getAll(characterSetId);

    request.onsuccess = () => {
      const snapshots = request.result as Snapshot[];
      // Sort by created date, newest first
      snapshots.sort((a, b) => b.createdAt - a.createdAt);
      resolve(snapshots);
    };

    request.onerror = () => {
      reject(new Error("Failed to get snapshots"));
    };
  });
}

/**
 * Get a snapshot by ID
 */
export async function getSnapshotById(id: string): Promise<Snapshot | null> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SNAPSHOTS_STORE], "readonly");
    const store = transaction.objectStore(SNAPSHOTS_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error("Failed to get snapshot"));
    };
  });
}

/**
 * Delete a snapshot
 */
export async function deleteSnapshot(id: string): Promise<void> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SNAPSHOTS_STORE], "readwrite");
    const store = transaction.objectStore(SNAPSHOTS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Failed to delete snapshot"));
  });
}

/**
 * Delete all snapshots for a character set
 */
export async function deleteAllSnapshotsForCharacterSet(characterSetId: string): Promise<void> {
  const snapshots = await getSnapshotsForCharacterSet(characterSetId);

  for (const snapshot of snapshots) {
    await deleteSnapshot(snapshot.id);
  }
}

/**
 * Rename a snapshot
 */
export async function renameSnapshot(id: string, newName: string): Promise<void> {
  const db = await getDatabase();
  const snapshot = await getSnapshotById(id);

  if (!snapshot) {
    throw new Error("Snapshot not found");
  }

  const updatedSnapshot: Snapshot = {
    ...snapshot,
    name: newName,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SNAPSHOTS_STORE], "readwrite");
    const store = transaction.objectStore(SNAPSHOTS_STORE);
    const request = store.put(updatedSnapshot);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Failed to rename snapshot"));
  });
}

/**
 * Get snapshot count for a character set
 */
export async function getSnapshotCount(characterSetId: string): Promise<number> {
  const snapshots = await getSnapshotsForCharacterSet(characterSetId);
  return snapshots.length;
}

/**
 * Check if snapshots are at capacity
 */
export async function isAtSnapshotCapacity(characterSetId: string): Promise<boolean> {
  const count = await getSnapshotCount(characterSetId);
  return count >= MAX_SNAPSHOTS_PER_SET;
}

/**
 * Get max snapshots per character set
 */
export function getMaxSnapshots(): number {
  return MAX_SNAPSHOTS_PER_SET;
}
