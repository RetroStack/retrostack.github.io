"use client";

import { useState, useCallback, useEffect } from "react";
import { Character, CharacterSetConfig } from "@/lib/character-editor/types";
import {
  Snapshot,
  createSnapshot,
  restoreSnapshot,
  saveSnapshot,
  getSnapshotsForCharacterSet,
  deleteSnapshot,
  renameSnapshot,
  getMaxSnapshots,
} from "@/lib/character-editor/snapshots";

export interface UseSnapshotsOptions {
  /** Character set ID to manage snapshots for */
  characterSetId: string | null;
  /** Whether snapshots are enabled */
  enabled?: boolean;
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
  const { characterSetId, enabled = true } = options;

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxSnapshots = getMaxSnapshots();

  // Load snapshots when character set changes
  const refresh = useCallback(async () => {
    if (!characterSetId || !enabled) {
      setSnapshots([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loaded = await getSnapshotsForCharacterSet(characterSetId);
      setSnapshots(loaded);
    } catch (e) {
      console.error("Failed to load snapshots:", e);
      setError(e instanceof Error ? e.message : "Failed to load snapshots");
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  }, [characterSetId, enabled]);

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
        await saveSnapshot(snapshot);
        await refresh();
        return true;
      } catch (e) {
        console.error("Failed to save snapshot:", e);
        setError(e instanceof Error ? e.message : "Failed to save snapshot");
        return false;
      }
    },
    [characterSetId, refresh]
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
        await deleteSnapshot(snapshotId);
        await refresh();
        return true;
      } catch (e) {
        console.error("Failed to delete snapshot:", e);
        setError(e instanceof Error ? e.message : "Failed to delete snapshot");
        return false;
      }
    },
    [refresh]
  );

  // Rename a snapshot
  const rename = useCallback(
    async (snapshotId: string, newName: string): Promise<boolean> => {
      try {
        await renameSnapshot(snapshotId, newName);
        await refresh();
        return true;
      } catch (e) {
        console.error("Failed to rename snapshot:", e);
        setError(e instanceof Error ? e.message : "Failed to rename snapshot");
        return false;
      }
    },
    [refresh]
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
