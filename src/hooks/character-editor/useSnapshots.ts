/**
 * Snapshots Management Hook
 *
 * Manages named snapshots of character sets stored in IndexedDB.
 * Snapshots allow users to save and restore multiple versions of their work
 * without creating separate character sets in the library.
 *
 * Features:
 * - Save up to 10 snapshots per character set
 * - Restore to a previous snapshot
 * - Rename and delete snapshots
 * - Capacity tracking and limits
 *
 * Supports dependency injection for testing via ISnapshotStorage.
 *
 * @module hooks/character-editor/useSnapshots
 */
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Character, CharacterSetConfig } from "@/lib/character-editor/types";
import {
  createSnapshot,
  restoreSnapshot,
  saveSnapshot as saveSnapshotToDb,
  getSnapshotsForCharacterSet,
  deleteSnapshot as deleteSnapshotFromDb,
  renameSnapshot as renameSnapshotInDb,
  getMaxSnapshots,
} from "@/lib/character-editor/storage/snapshots";
import type { ISnapshotStorage, Snapshot } from "@/lib/character-editor/storage/interfaces";

export interface UseSnapshotsOptions {
  /** Character set ID to manage snapshots for */
  characterSetId: string | null;
  /** Whether snapshots are enabled */
  enabled?: boolean;
  /**
   * Snapshot storage implementation.
   * Defaults to the real IndexedDB storage.
   * Pass a mock implementation for testing.
   */
  storage?: ISnapshotStorage;
}

/**
 * Create a default adapter that wraps the existing IndexedDB functions
 */
function createDefaultSnapshotStorage(): ISnapshotStorage {
  return {
    save: saveSnapshotToDb,
    getForCharacterSet: getSnapshotsForCharacterSet,
    getById: async (id: string) => {
      // Not directly available, would need to search through all
      const allSets = await getSnapshotsForCharacterSet("");
      return allSets.find((s) => s.id === id) ?? null;
    },
    delete: deleteSnapshotFromDb,
    deleteAllForCharacterSet: async (characterSetId: string) => {
      const snapshots = await getSnapshotsForCharacterSet(characterSetId);
      for (const snapshot of snapshots) {
        await deleteSnapshotFromDb(snapshot.id);
      }
    },
    rename: renameSnapshotInDb,
    getCount: async (characterSetId: string) => {
      const snapshots = await getSnapshotsForCharacterSet(characterSetId);
      return snapshots.length;
    },
    isAtCapacity: async (characterSetId: string) => {
      const count = (await getSnapshotsForCharacterSet(characterSetId)).length;
      return count >= getMaxSnapshots();
    },
    getMaxSnapshots,
  };
}

export interface UseSnapshotsResult {
  /** List of snapshots for the current character set */
  snapshots: Snapshot[];
  /** Whether snapshots are loading */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Save a new snapshot */
  saveNewSnapshot: (
    name: string,
    characters: Character[],
    config: CharacterSetConfig
  ) => Promise<boolean>;
  /** Restore a snapshot (returns the characters) */
  restore: (snapshotId: string) => Promise<Character[] | null>;
  /** Delete a snapshot */
  remove: (snapshotId: string) => Promise<boolean>;
  /** Rename a snapshot */
  rename: (snapshotId: string, newName: string) => Promise<boolean>;
  /** Refresh the snapshots list */
  refresh: () => Promise<void>;
  /** Whether at max capacity */
  isAtCapacity: boolean;
  /** Maximum number of snapshots allowed */
  maxSnapshots: number;
}

/**
 * Hook for managing snapshots of character sets
 */
export function useSnapshots(options: UseSnapshotsOptions): UseSnapshotsResult {
  const { characterSetId, enabled = true, storage: providedStorage } = options;

  // Use injected storage or default adapter
  const storage = useMemo(
    () => providedStorage ?? createDefaultSnapshotStorage(),
    [providedStorage]
  );

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxSnapshots = storage.getMaxSnapshots();

  // Load snapshots when character set changes
  const refresh = useCallback(async () => {
    if (!characterSetId || !enabled) {
      setSnapshots([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loaded = await storage.getForCharacterSet(characterSetId);
      setSnapshots(loaded);
    } catch (e) {
      console.error("Failed to load snapshots:", e);
      setError(e instanceof Error ? e.message : "Failed to load snapshots");
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  }, [characterSetId, enabled, storage]);

  // Load snapshots on mount and when character set changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Save a new snapshot
  const saveNewSnapshot = useCallback(
    async (
      name: string,
      characters: Character[],
      config: CharacterSetConfig
    ): Promise<boolean> => {
      if (!characterSetId) {
        setError("No character set ID");
        return false;
      }

      try {
        const snapshot = createSnapshot(characterSetId, name, characters, config);
        await storage.save(snapshot);
        await refresh();
        return true;
      } catch (e) {
        console.error("Failed to save snapshot:", e);
        setError(e instanceof Error ? e.message : "Failed to save snapshot");
        return false;
      }
    },
    [characterSetId, refresh, storage]
  );

  // Restore a snapshot
  const restore = useCallback(async (snapshotId: string): Promise<Character[] | null> => {
    try {
      const snapshot = snapshots.find((s) => s.id === snapshotId);
      if (!snapshot) {
        setError("Snapshot not found");
        return null;
      }

      const characters = restoreSnapshot(snapshot);
      return characters;
    } catch (e) {
      console.error("Failed to restore snapshot:", e);
      setError(e instanceof Error ? e.message : "Failed to restore snapshot");
      return null;
    }
  }, [snapshots]);

  // Delete a snapshot
  const remove = useCallback(
    async (snapshotId: string): Promise<boolean> => {
      try {
        await storage.delete(snapshotId);
        await refresh();
        return true;
      } catch (e) {
        console.error("Failed to delete snapshot:", e);
        setError(e instanceof Error ? e.message : "Failed to delete snapshot");
        return false;
      }
    },
    [refresh, storage]
  );

  // Rename a snapshot
  const rename = useCallback(
    async (snapshotId: string, newName: string): Promise<boolean> => {
      try {
        await storage.rename(snapshotId, newName);
        await refresh();
        return true;
      } catch (e) {
        console.error("Failed to rename snapshot:", e);
        setError(e instanceof Error ? e.message : "Failed to rename snapshot");
        return false;
      }
    },
    [refresh, storage]
  );

  return {
    snapshots,
    loading,
    error,
    saveNewSnapshot,
    restore,
    remove,
    rename,
    refresh,
    isAtCapacity: snapshots.length >= maxSnapshots,
    maxSnapshots,
  };
}
