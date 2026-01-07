"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { Character, CharacterSetConfig } from "@/lib/character-editor/types";
import { serializeCharacterRom, binaryToBase64 } from "@/lib/character-editor/binary";

const AUTO_SAVE_KEY = "character-editor-autosave";
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
  } = options;

  const [recoveryData, setRecoveryData] = useState<AutoSaveData | null>(null);
  const lastSaveRef = useRef<number>(0);
  const pendingSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check for recovery data on mount
  useEffect(() => {
    if (!characterSetId) return;

    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
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
  }, [characterSetId]);

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
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data));
      lastSaveRef.current = Date.now();
    } catch (e) {
      console.error("Auto-save failed:", e);
    }
  }, [characterSetId, characters, config, selectedIndex, isDirty, enabled]);

  // Auto-save on interval when dirty
  useEffect(() => {
    if (!enabled || !isDirty || !characterSetId) return;

    // Clear any pending save
    if (pendingSaveRef.current) {
      clearTimeout(pendingSaveRef.current);
    }

    // Schedule next save
    const timeSinceLastSave = Date.now() - lastSaveRef.current;
    const delay = Math.max(0, AUTO_SAVE_INTERVAL - timeSinceLastSave);

    pendingSaveRef.current = setTimeout(() => {
      saveNow();
    }, delay);

    return () => {
      if (pendingSaveRef.current) {
        clearTimeout(pendingSaveRef.current);
      }
    };
  }, [enabled, isDirty, characterSetId, saveNow]);

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
      localStorage.removeItem(AUTO_SAVE_KEY);
    } catch {
      // Ignore errors
    }
  }, []);

  const clearAutoSave = useCallback(() => {
    try {
      localStorage.removeItem(AUTO_SAVE_KEY);
    } catch {
      // Ignore errors
    }
  }, []);

  return {
    hasRecoveryData: recoveryData !== null,
    recoveryData,
    recover,
    discard,
    clearAutoSave,
    saveNow,
  };
}
