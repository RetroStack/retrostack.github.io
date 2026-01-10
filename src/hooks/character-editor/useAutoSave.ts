/**
 * Auto-Save Hook for Character Editor
 *
 * Automatically saves editor state to localStorage at regular intervals
 * when there are unsaved changes. Provides recovery data for crash protection.
 *
 * Features:
 * - 30-second auto-save interval (when dirty)
 * - Save on beforeunload (browser close/refresh)
 * - Recovery data detection on mount
 * - Clear on manual save
 *
 * Supports dependency injection for testing via IKeyValueStorage.
 *
 * @module hooks/character-editor/useAutoSave
 */
"use client";

import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { Character, CharacterSetConfig } from "@/lib/character-editor/types";
import { serializeCharacterRom, binaryToBase64 } from "@/lib/character-editor/import/binary";
import { CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE } from "@/lib/character-editor/storage/keys";
import { createLocalStorageWrapper, type IKeyValueStorage } from "@/lib/character-editor/storage/storage";
import { useTimer } from "@/hooks/useTimer";

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export interface AutoSaveData {
  characterSetId: string;
  binaryData: string;
  config: CharacterSetConfig;
  selectedIndex: number;
  timestamp: number;
  isDirty: boolean;
}

export interface UseAutoSaveOptions {
  /** Character set ID being edited */
  characterSetId: string | null;
  /** Current characters */
  characters: Character[];
  /** Current config */
  config: CharacterSetConfig;
  /** Currently selected index */
  selectedIndex: number;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Whether auto-save is enabled */
  enabled?: boolean;
  /**
   * Key-value storage implementation.
   * Defaults to localStorage wrapper.
   * Pass a mock implementation for testing.
   */
  kvStorage?: IKeyValueStorage;
}

export interface UseAutoSaveResult {
  /** Whether there's recoverable data */
  hasRecoveryData: boolean;
  /** The recovery data if available */
  recoveryData: AutoSaveData | null;
  /** Recover the auto-saved data */
  recover: () => AutoSaveData | null;
  /** Discard the recovery data */
  discard: () => void;
  /** Clear auto-save (call after manual save) */
  clearAutoSave: () => void;
  /** Force save now */
  saveNow: () => void;
}

/**
 * Hook for auto-saving editor state
 */
export function useAutoSave(options: UseAutoSaveOptions): UseAutoSaveResult {
  const {
    characterSetId,
    characters,
    config,
    selectedIndex,
    isDirty,
    enabled = true,
    kvStorage,
  } = options;

  // Use injected storage or default to localStorage wrapper
  const storage = useMemo(
    () => kvStorage ?? createLocalStorageWrapper(),
    [kvStorage]
  );

  const [recoveryData, setRecoveryData] = useState<AutoSaveData | null>(null);
  const lastSaveRef = useRef<number>(0);
  const saveTimer = useTimer();

  // Check for recovery data on mount
  useEffect(() => {
    if (!characterSetId) return;

    try {
      const saved = storage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE);
      if (saved) {
        const data: AutoSaveData = JSON.parse(saved);
        // Only offer recovery if it's for the same character set and is dirty
        if (data.characterSetId === characterSetId && data.isDirty) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional recovery data load
          setRecoveryData(data);
        }
      }
    } catch {
      // Ignore errors reading auto-save
    }
  }, [characterSetId, storage]);

  // Save function
  const saveNow = useCallback(() => {
    if (!characterSetId || !enabled || characters.length === 0) return;

    try {
      const binaryData = binaryToBase64(serializeCharacterRom(characters, config));
      const data: AutoSaveData = {
        characterSetId,
        binaryData,
        config,
        selectedIndex,
        timestamp: Date.now(),
        isDirty,
      };
      storage.setItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE, JSON.stringify(data));
      lastSaveRef.current = Date.now();
    } catch (e) {
      console.error("Auto-save failed:", e);
    }
  }, [characterSetId, characters, config, selectedIndex, isDirty, enabled, storage]);

  // Auto-save on interval when dirty
  useEffect(() => {
    if (!enabled || !isDirty || !characterSetId) {
      saveTimer.clear();
      return;
    }

    // Schedule next save
    const timeSinceLastSave = Date.now() - lastSaveRef.current;
    const delay = Math.max(0, AUTO_SAVE_INTERVAL - timeSinceLastSave);

    saveTimer.set(saveNow, delay);
  }, [enabled, isDirty, characterSetId, saveNow, saveTimer]);

  // Save before unload
  useEffect(() => {
    if (!enabled || !isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      saveNow();
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled, isDirty, saveNow]);

  const recover = useCallback((): AutoSaveData | null => {
    const data = recoveryData;
    setRecoveryData(null);
    return data;
  }, [recoveryData]);

  const discard = useCallback(() => {
    setRecoveryData(null);
    try {
      storage.removeItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE);
    } catch {
      // Ignore errors
    }
  }, [storage]);

  const clearAutoSave = useCallback(() => {
    try {
      storage.removeItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE);
    } catch {
      // Ignore errors
    }
  }, [storage]);

  return {
    hasRecoveryData: recoveryData !== null,
    recoveryData,
    recover,
    discard,
    clearAutoSave,
    saveNow,
  };
}
