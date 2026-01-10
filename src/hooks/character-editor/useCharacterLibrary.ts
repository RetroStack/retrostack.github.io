/**
 * Character Library Management Hook
 *
 * Manages the IndexedDB-backed library of character sets. Handles:
 * - CRUD operations (create, read, update, delete)
 * - Search and filtering (by name, size, manufacturer, system)
 * - Pinned items management
 * - Auto-initialization of built-in and external character sets
 *
 * On first load, imports built-in character sets (C64, Apple II, etc.)
 * and fetches external character sets from the data directory.
 *
 * Supports dependency injection for testing via ICharacterSetStorage.
 *
 * @module hooks/character-editor/useCharacterLibrary
 */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { SerializedCharacterSet, CharacterSet, CharacterSetMetadata, generateId } from "@/lib/character-editor/types";
import { characterStorage, type ICharacterSetStorage } from "@/lib/character-editor/storage/storage";
import { deserializeCharacterSet, serializeCharacterSet } from "@/lib/character-editor/import/binary";
import {
  getBuiltInIds,
  getBuiltInCharacterSetById,
  getBuiltInVersion,
  getExternalIds,
  getExternalCharacterSetById,
} from "@/lib/character-editor/defaults";

/**
 * Options for useCharacterLibrary hook
 */
export interface UseCharacterLibraryOptions {
  /**
   * Storage implementation to use.
   * Defaults to the real IndexedDB storage singleton.
   * Pass a mock implementation for testing.
   */
  storage?: ICharacterSetStorage;
}

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
  /** Update metadata for a character set */
  updateMetadata: (id: string, metadata: Partial<CharacterSetMetadata>) => Promise<void>;
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
 *
 * @param options - Optional configuration including storage dependency injection
 */
export function useCharacterLibrary(options?: UseCharacterLibraryOptions): UseCharacterLibraryResult {
  // Use injected storage or default to singleton
  const storage = useMemo(
    () => options?.storage ?? characterStorage,
    [options?.storage]
  );

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
      await storage.initialize();

      // Get all existing character set IDs from the database
      const existingSets = await storage.getAll();
      const existingById = new Map(existingSets.map((set) => [set.metadata.id, set]));

      // Get all built-in IDs and find which ones are missing or outdated
      const builtInIds = getBuiltInIds();
      const missingBuiltInIds: string[] = [];
      const outdatedBuiltInIds: string[] = [];

      for (const id of builtInIds) {
        const existing = existingById.get(id);
        if (!existing) {
          // Built-in doesn't exist in storage
          missingBuiltInIds.push(id);
        } else {
          // Check if the built-in version is newer than stored version
          const currentVersion = getBuiltInVersion(id);
          const storedVersion = existing.metadata.builtInVersion ?? 0;
          if (currentVersion !== null && currentVersion > storedVersion) {
            outdatedBuiltInIds.push(id);
          }
        }
      }

      // Import missing built-in character sets
      if (missingBuiltInIds.length > 0) {
        for (const id of missingBuiltInIds) {
          const builtInSet = getBuiltInCharacterSetById(id);
          if (builtInSet) {
            await storage.save(builtInSet);
          }
        }
      }

      // Update outdated built-in character sets (preserving pinned state)
      if (outdatedBuiltInIds.length > 0) {
        for (const id of outdatedBuiltInIds) {
          const existing = existingById.get(id);
          const builtInSet = getBuiltInCharacterSetById(id);
          if (builtInSet && existing) {
            // Preserve user preferences (pinned state)
            builtInSet.metadata.isPinned = existing.metadata.isPinned;
            await storage.save(builtInSet);
          }
        }
      }

      // Fetch external character sets and import missing ones
      const externalIds = await getExternalIds();
      const missingExternalIds = externalIds.filter((id) => !existingById.has(id));

      if (missingExternalIds.length > 0) {
        for (const id of missingExternalIds) {
          const externalSet = await getExternalCharacterSetById(id);
          if (externalSet) {
            await storage.save(externalSet);
          }
        }
      }

      // Load all character sets (including newly added or updated ones)
      const hasChanges = missingBuiltInIds.length > 0 || outdatedBuiltInIds.length > 0 || missingExternalIds.length > 0;
      const sets = hasChanges ? await storage.getAll() : existingSets;
      setCharacterSets(sets);

      // Get available sizes for filtering
      const sizes = await storage.getAvailableSizes();
      setAvailableSizes(sizes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load library");
    } finally {
      setLoading(false);
    }
  }, [storage]);

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
      const serialized = await storage.getById(id);
      if (!serialized) return null;
      return deserializeCharacterSet(serialized);
    } catch (e) {
      console.error("Failed to get character set:", e);
      return null;
    }
  }, [storage]);

  // Save character set
  const save = useCallback(async (characterSet: CharacterSet): Promise<string> => {
    try {
      const serialized = serializeCharacterSet(characterSet);
      const id = await storage.save(serialized);
      await refresh();
      return id;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Failed to save character set");
    }
  }, [storage, refresh]);

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
      const id = await storage.save(serialized);
      await refresh();
      return id;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Failed to save character set");
    }
  }, [storage, refresh]);

  // Rename character set
  const rename = useCallback(async (id: string, newName: string): Promise<void> => {
    try {
      const serialized = await storage.getById(id);
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
      await storage.save(updated);
      await refresh();
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Failed to rename character set");
    }
  }, [storage, refresh]);

  // Update metadata
  const updateMetadata = useCallback(async (id: string, metadata: Partial<CharacterSetMetadata>): Promise<void> => {
    try {
      const serialized = await storage.getById(id);
      if (!serialized) {
        throw new Error("Character set not found");
      }
      const updated: SerializedCharacterSet = {
        ...serialized,
        metadata: {
          ...serialized.metadata,
          ...metadata,
          updatedAt: Date.now(),
        },
      };
      await storage.save(updated);
      await refresh();
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Failed to update metadata");
    }
  }, [storage, refresh]);

  // Delete character set
  const deleteSet = useCallback(async (id: string): Promise<void> => {
    try {
      await storage.delete(id);
      await refresh();
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Failed to delete character set");
    }
  }, [storage, refresh]);

  // Toggle pinned state
  const togglePinned = useCallback(async (id: string): Promise<void> => {
    try {
      await storage.togglePinned(id);
      await refresh();
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Failed to toggle pinned state");
    }
  }, [storage, refresh]);

  // Search character sets
  const searchSets = useCallback(async (query: string): Promise<SerializedCharacterSet[]> => {
    if (!query.trim()) {
      return characterSets;
    }
    return storage.search(query);
  }, [storage, characterSets]);

  // Filter by size
  const filterBySize = useCallback(
    async (width: number | null, height: number | null): Promise<SerializedCharacterSet[]> => {
      if (width === null && height === null) {
        return characterSets;
      }
      return storage.filterBySize(width, height);
    },
    [storage, characterSets]
  );

  // Check if name exists
  const nameExists = useCallback(
    async (name: string, excludeId?: string): Promise<boolean> => {
      return storage.nameExists(name, excludeId);
    },
    [storage]
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
    updateMetadata,
    deleteSet,
    togglePinned,
    search: searchSets,
    filterBySize,
    availableSizes,
    nameExists,
  };
}
