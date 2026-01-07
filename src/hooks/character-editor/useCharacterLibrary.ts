"use client";

import { useState, useEffect, useCallback } from "react";
import { SerializedCharacterSet, CharacterSet, generateId } from "@/lib/character-editor/types";
import { characterStorage } from "@/lib/character-editor/storage";
import { deserializeCharacterSet, serializeCharacterSet } from "@/lib/character-editor/binary";
import { getDefaultCharacterSets } from "@/lib/character-editor/defaults";

export interface UseCharacterLibraryResult {
  /** All character sets in the library */
  characterSets: SerializedCharacterSet[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Refresh the library */
  refresh: () => Promise<void>;
  /** Get a character set by ID */
  getById: (id: string) => Promise<CharacterSet | null>;
  /** Save a character set */
  save: (characterSet: CharacterSet) => Promise<string>;
  /** Save as a new character set with new name */
  saveAs: (characterSet: CharacterSet, newName: string) => Promise<string>;
  /** Rename a character set */
  rename: (id: string, newName: string) => Promise<void>;
  /** Delete a character set */
  deleteSet: (id: string) => Promise<void>;
  /** Toggle pinned state of a character set */
  togglePinned: (id: string) => Promise<void>;
  /** Search character sets */
  search: (query: string) => Promise<SerializedCharacterSet[]>;
  /** Filter by size */
  filterBySize: (width: number | null, height: number | null) => Promise<SerializedCharacterSet[]>;
  /** Get available sizes for filtering */
  availableSizes: { width: number; height: number }[];
  /** Check if name exists */
  nameExists: (name: string, excludeId?: string) => Promise<boolean>;
}

/**
 * Hook for managing the character set library
 *
 * Handles CRUD operations, search, filtering, and initialization
 * of default character sets.
 */
export function useCharacterLibrary(): UseCharacterLibraryResult {
  const [characterSets, setCharacterSets] = useState<SerializedCharacterSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableSizes, setAvailableSizes] = useState<{ width: number; height: number }[]>([]);

  // Load library on mount
  const loadLibrary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize storage
      await characterStorage.initialize();

      // Check if library is empty and add defaults
      const isEmpty = await characterStorage.isEmpty();
      if (isEmpty) {
        const defaults = getDefaultCharacterSets();
        for (const defaultSet of defaults) {
          await characterStorage.save(defaultSet);
        }
      }

      // Load all character sets
      const sets = await characterStorage.getAll();
      setCharacterSets(sets);

      // Get available sizes for filtering
      const sizes = await characterStorage.getAvailableSizes();
      setAvailableSizes(sizes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load library");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  // Refresh library
  const refresh = useCallback(async () => {
    await loadLibrary();
  }, [loadLibrary]);

  // Get character set by ID
  const getById = useCallback(async (id: string): Promise<CharacterSet | null> => {
    try {
      const serialized = await characterStorage.getById(id);
      if (!serialized) return null;
      return deserializeCharacterSet(serialized);
    } catch (e) {
      console.error("Failed to get character set:", e);
      return null;
    }
  }, []);

  // Save character set
  const save = useCallback(async (characterSet: CharacterSet): Promise<string> => {
    try {
      const serialized = serializeCharacterSet(characterSet);
      const id = await characterStorage.save(serialized);
      await refresh();
      return id;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Failed to save character set");
    }
  }, [refresh]);

  // Save as new character set
  const saveAs = useCallback(async (characterSet: CharacterSet, newName: string): Promise<string> => {
    try {
      const newSet: CharacterSet = {
        ...characterSet,
        metadata: {
          ...characterSet.metadata,
          id: generateId(),
          name: newName,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isBuiltIn: false,
          source: "yourself",
        },
      };
      const serialized = serializeCharacterSet(newSet);
      const id = await characterStorage.save(serialized);
      await refresh();
      return id;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Failed to save character set");
    }
  }, [refresh]);

  // Rename character set
  const rename = useCallback(async (id: string, newName: string): Promise<void> => {
    try {
      const serialized = await characterStorage.getById(id);
      if (!serialized) {
        throw new Error("Character set not found");
      }
      const updated: SerializedCharacterSet = {
        ...serialized,
        metadata: {
          ...serialized.metadata,
          name: newName,
          updatedAt: Date.now(),
        },
      };
      await characterStorage.save(updated);
      await refresh();
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Failed to rename character set");
    }
  }, [refresh]);

  // Delete character set
  const deleteSet = useCallback(async (id: string): Promise<void> => {
    try {
      await characterStorage.delete(id);
      await refresh();
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Failed to delete character set");
    }
  }, [refresh]);

  // Toggle pinned state
  const togglePinned = useCallback(async (id: string): Promise<void> => {
    try {
      await characterStorage.togglePinned(id);
      await refresh();
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Failed to toggle pinned state");
    }
  }, [refresh]);

  // Search character sets
  const searchSets = useCallback(async (query: string): Promise<SerializedCharacterSet[]> => {
    if (!query.trim()) {
      return characterSets;
    }
    return characterStorage.search(query);
  }, [characterSets]);

  // Filter by size
  const filterBySize = useCallback(
    async (width: number | null, height: number | null): Promise<SerializedCharacterSet[]> => {
      if (width === null && height === null) {
        return characterSets;
      }
      return characterStorage.filterBySize(width, height);
    },
    [characterSets]
  );

  // Check if name exists
  const nameExists = useCallback(
    async (name: string, excludeId?: string): Promise<boolean> => {
      return characterStorage.nameExists(name, excludeId);
    },
    []
  );

  return {
    characterSets,
    loading,
    error,
    refresh,
    getById,
    save,
    saveAs,
    rename,
    deleteSet,
    togglePinned,
    search: searchSets,
    filterBySize,
    availableSizes,
    nameExists,
  };
}
